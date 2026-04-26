package org.example.flowtaskmanager.domain.task;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.example.flowtaskmanager.domain.session.Session;
import org.example.flowtaskmanager.domain.session.SessionEndReason;
import org.example.flowtaskmanager.domain.session.SessionService;
import org.example.flowtaskmanager.domain.sessionswitch.SessionSwitch;
import org.example.flowtaskmanager.domain.sessionswitch.SessionSwitchRepository;
import org.example.flowtaskmanager.domain.settings.UserSettings;
import org.example.flowtaskmanager.domain.settings.UserSettingsService;
import org.example.flowtaskmanager.global.exception.AppException;
import org.example.flowtaskmanager.global.exception.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TaskService {

	private final TaskRepository taskRepository;
	private final UserSettingsService userSettingsService;
	private final SessionService sessionService;
	private final SessionSwitchRepository sessionSwitchRepository;

	@Transactional
	public Task createTask(CreateTaskCommand cmd) {
		UserSettings settings = findOrCreateSettings();
		int todayCount = taskRepository.countByScheduledDateAndStatusIn(
			cmd.scheduledDate(),
			List.of(TaskStatus.PLANNED, TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED)
		);
		if (todayCount >= settings.getDailyTaskLimit()) {
			throw new AppException(ErrorCode.DAILY_TASK_LIMIT);
		}

		Task task = taskRepository.save(Task.create(cmd.title(), cmd.description(), cmd.scheduledDate()));

		if (cmd.startImmediately()) {
			startTaskInternal(task.getId(), cmd.switchReason(), cmd.switchNote());
		}
		return task;
	}

	@Transactional
	public Session startTask(StartTaskCommand cmd) {
		return startTaskInternal(cmd.taskId(), cmd.switchReason(), cmd.switchNote());
	}

	@Transactional
	public Task completeTask(UUID taskId) {
		Task task = findTask(taskId);
		sessionService.endSessionForTask(taskId, SessionEndReason.COMPLETED);
		task.complete();
		return task;
	}

	@Transactional
	public Task blockTask(UUID taskId) {
		Task task = findTask(taskId);
		sessionService.endSessionForTask(taskId, SessionEndReason.SWITCHED);
		task.block();
		return task;
	}

	@Transactional
	public Task unblockTask(UUID taskId) {
		Task task = findTask(taskId);
		task.unblock();
		return task;
	}

	@Transactional
	public Task cancelTask(UUID taskId) {
		Task task = findTask(taskId);
		task.cancel();
		return task;
	}

	@Transactional(readOnly = true)
	public List<Task> getTodayTasks(LocalDate date) {
		return taskRepository.findByScheduledDate(date);
	}

	private Session startTaskInternal(UUID taskId, SwitchReason switchReason, String switchNote) {
		Optional<Task> maybeActive = taskRepository.findByStatus(TaskStatus.IN_PROGRESS);
		if (maybeActive.isPresent()) {
			Task active = maybeActive.get();
			if (active.getId().equals(taskId)) {
				return sessionService.getCurrentSession()
					.orElseGet(() -> sessionService.createSession(active));
			}
			if (switchReason == null) {
				throw new AppException(ErrorCode.SWITCH_REASON_REQUIRED);
			}
			Optional<Session> endedSession = sessionService.endSessionForTask(active.getId(), SessionEndReason.SWITCHED);
			active.pause();
			endedSession.ifPresent(s ->
				sessionSwitchRepository.save(
					SessionSwitch.create(s, active.getId(), taskId, switchReason, switchNote)
				)
			);
		}

		Task task = findTask(taskId);
		task.start();
		task.incrementSwitchCount();
		return sessionService.createSession(task);
	}

	private Task findTask(UUID taskId) {
		return taskRepository.findById(taskId)
			.orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));
	}

	private UserSettings findOrCreateSettings() {
		return userSettingsService.findOrCreate();
	}
}
