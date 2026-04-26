package org.example.flowtaskmanager.domain.task;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.example.flowtaskmanager.domain.event.TaskEventService;
import org.example.flowtaskmanager.domain.event.TaskEventType;
import org.example.flowtaskmanager.domain.session.Session;
import org.example.flowtaskmanager.domain.session.SessionEndReason;
import org.example.flowtaskmanager.domain.session.SessionService;
import org.example.flowtaskmanager.domain.sessionswitch.SessionSwitch;
import org.example.flowtaskmanager.domain.sessionswitch.SessionSwitchRepository;
import org.example.flowtaskmanager.domain.settings.UserSettings;
import org.example.flowtaskmanager.domain.settings.UserSettingsService;
import org.example.flowtaskmanager.global.exception.AppException;
import org.example.flowtaskmanager.global.exception.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TaskServiceTest {

	@Mock TaskRepository taskRepository;
	@Mock UserSettingsService userSettingsService;
	@Mock SessionService sessionService;
	@Mock SessionSwitchRepository sessionSwitchRepository;
	@Mock TaskEventService taskEventService;
	@InjectMocks TaskService taskService;

	private final LocalDate today = LocalDate.now();

	// ── createTask ──────────────────────────────────────────────────

	@Test
	@DisplayName("오늘 작업 수가 한도 미만이면 Task가 생성된다")
	void createTask_withinLimit_savesTask() {
		given(userSettingsService.findOrCreate()).willReturn(UserSettings.createDefault());
		given(taskRepository.countByScheduledDateAndStatusIn(eq(today), any())).willReturn(3);
		given(taskRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

		Task result = taskService.createTask(new CreateTaskCommand("작업", null, today, false, null, null));

		assertThat(result.getTitle()).isEqualTo("작업");
		assertThat(result.getStatus()).isEqualTo(TaskStatus.PLANNED);
		then(taskRepository).should().save(any(Task.class));
	}

	@Test
	@DisplayName("오늘 작업 수가 한도 이상이면 DAILY_TASK_LIMIT 예외가 발생한다")
	void createTask_exceedsDailyLimit_throwsException() {
		given(userSettingsService.findOrCreate()).willReturn(UserSettings.createDefault());
		given(taskRepository.countByScheduledDateAndStatusIn(eq(today), any())).willReturn(5);

		assertThatThrownBy(() ->
			taskService.createTask(new CreateTaskCommand("작업", null, today, false, null, null))
		)
			.isInstanceOf(AppException.class)
			.satisfies(e -> assertThat(((AppException)e).getErrorCode()).isEqualTo(ErrorCode.DAILY_TASK_LIMIT));
	}

	@Test
	@DisplayName("startImmediately=true이면 생성 후 즉시 start된다")
	void createTask_startImmediately_startsTask() {
		given(userSettingsService.findOrCreate()).willReturn(UserSettings.createDefault());
		given(taskRepository.countByScheduledDateAndStatusIn(eq(today), any())).willReturn(0);
		given(taskRepository.save(any())).willAnswer(inv -> {
			Task t = inv.getArgument(0);
			return Task.builder()
				.id(UUID.randomUUID()).title(t.getTitle()).status(t.getStatus())
				.scheduledDate(t.getScheduledDate()).carryOverCount(t.getCarryOverCount())
				.carryOverPending(t.isCarryOverPending()).switchCount(t.getSwitchCount())
				.createdAt(t.getCreatedAt()).build();
		});
		given(taskRepository.findByStatus(TaskStatus.IN_PROGRESS)).willReturn(Optional.empty());
		given(taskRepository.findById(any())).willAnswer(inv ->
			Optional.of(Task.builder()
				.id(inv.getArgument(0)).title("작업").status(TaskStatus.PLANNED)
				.scheduledDate(today).carryOverCount(0).carryOverPending(false)
				.switchCount(0).createdAt(Instant.now()).build())
		);
		given(sessionService.createSession(any())).willReturn(mockSession());

		taskService.createTask(new CreateTaskCommand("작업", null, today, true, null, null));

		then(sessionService).should().createSession(any());
	}

	// ── startTask ───────────────────────────────────────────────────

	@Test
	@DisplayName("active task가 없으면 switch_reason 없이 task를 시작할 수 있다")
	void startTask_noActiveTask_startsWithoutReason() {
		Task task = plannedTask();
		given(taskRepository.findByStatus(TaskStatus.IN_PROGRESS)).willReturn(Optional.empty());
		given(taskRepository.findById(task.getId())).willReturn(Optional.of(task));
		given(sessionService.createSession(any())).willReturn(mockSession());

		taskService.startTask(new StartTaskCommand(task.getId(), null, null));

		assertThat(task.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
	}

	@Test
	@DisplayName("active task가 있고 switch_reason이 없으면 SWITCH_REASON_REQUIRED 예외가 발생한다")
	void startTask_withActiveTask_noReason_throwsException() {
		Task activeTask = inProgressTask();
		Task nextTask = plannedTask();
		given(taskRepository.findByStatus(TaskStatus.IN_PROGRESS)).willReturn(Optional.of(activeTask));

		assertThatThrownBy(() ->
			taskService.startTask(new StartTaskCommand(nextTask.getId(), null, null))
		)
			.isInstanceOf(AppException.class)
			.satisfies(e -> assertThat(((AppException)e).getErrorCode()).isEqualTo(ErrorCode.SWITCH_REASON_REQUIRED));
	}

	@Test
	@DisplayName("active task가 있고 switch_reason이 있으면 기존 task를 pause하고 새 task를 시작한다")
	void startTask_withActiveTask_withReason_switches() {
		Task activeTask = inProgressTask();
		Task nextTask = plannedTask();
		Session endedSession = mockSession();
		given(taskRepository.findByStatus(TaskStatus.IN_PROGRESS)).willReturn(Optional.of(activeTask));
		given(taskRepository.findById(nextTask.getId())).willReturn(Optional.of(nextTask));
		given(sessionService.endSessionForTask(activeTask.getId(), SessionEndReason.SWITCHED))
			.willReturn(Optional.of(endedSession));
		given(sessionService.createSession(any())).willReturn(mockSession());

		taskService.startTask(new StartTaskCommand(nextTask.getId(), SwitchReason.AI_DELEGATED, null));

		assertThat(activeTask.getStatus()).isEqualTo(TaskStatus.PLANNED);
		assertThat(nextTask.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
		then(sessionService).should().endSessionForTask(activeTask.getId(), SessionEndReason.SWITCHED);
	}

	@Test
	@DisplayName("switch 시 SessionSwitch가 저장된다")
	void startTask_switch_recordsSessionSwitch() {
		Task activeTask = inProgressTask();
		Task nextTask = plannedTask();
		Session endedSession = mockSession();
		given(taskRepository.findByStatus(TaskStatus.IN_PROGRESS)).willReturn(Optional.of(activeTask));
		given(taskRepository.findById(nextTask.getId())).willReturn(Optional.of(nextTask));
		given(sessionService.endSessionForTask(activeTask.getId(), SessionEndReason.SWITCHED))
			.willReturn(Optional.of(endedSession));
		given(sessionService.createSession(any())).willReturn(mockSession());

		taskService.startTask(new StartTaskCommand(nextTask.getId(), SwitchReason.URGENT, "긴급"));

		then(sessionSwitchRepository).should().save(argThat(sw ->
			sw.getFromTaskId().equals(activeTask.getId()) &&
			sw.getToTaskId().equals(nextTask.getId()) &&
			sw.getReason() == SwitchReason.URGENT
		));
	}

	@Test
	@DisplayName("이미 IN_PROGRESS인 task를 다시 start하면 기존 세션을 반환한다")
	void startTask_sameActiveTask_returnsCurrentSession() {
		Task task = inProgressTask();
		Session currentSession = mockSession();
		given(taskRepository.findByStatus(TaskStatus.IN_PROGRESS)).willReturn(Optional.of(task));
		given(sessionService.getCurrentSession()).willReturn(Optional.of(currentSession));

		Session result = taskService.startTask(new StartTaskCommand(task.getId(), null, null));

		assertThat(result).isEqualTo(currentSession);
		then(taskRepository).should(never()).findById(any());
	}

	// ── completeTask ─────────────────────────────────────────────────

	@Test
	@DisplayName("IN_PROGRESS task를 complete하면 COMPLETED가 된다")
	void completeTask_inProgress_becomesCompleted() {
		Task task = inProgressTask();
		given(taskRepository.findById(task.getId())).willReturn(Optional.of(task));

		taskService.completeTask(task.getId());

		assertThat(task.getStatus()).isEqualTo(TaskStatus.COMPLETED);
		then(sessionService).should().endSessionForTask(task.getId(), SessionEndReason.COMPLETED);
	}

	// ── blockTask ────────────────────────────────────────────────────

	@Test
	@DisplayName("IN_PROGRESS task를 block하면 BLOCKED가 된다")
	void blockTask_inProgress_becomesBlocked() {
		Task task = inProgressTask();
		given(taskRepository.findById(task.getId())).willReturn(Optional.of(task));

		taskService.blockTask(task.getId());

		assertThat(task.getStatus()).isEqualTo(TaskStatus.BLOCKED);
		then(sessionService).should().endSessionForTask(task.getId(), SessionEndReason.SWITCHED);
	}

	// ── unblockTask ──────────────────────────────────────────────────

	@Test
	@DisplayName("BLOCKED task를 unblock하면 PLANNED가 된다")
	void unblockTask_blocked_becomesPlanned() {
		Task task = blockedTask();
		given(taskRepository.findById(task.getId())).willReturn(Optional.of(task));

		taskService.unblockTask(task.getId());

		assertThat(task.getStatus()).isEqualTo(TaskStatus.PLANNED);
	}

	// ── cancelTask ───────────────────────────────────────────────────

	@Test
	@DisplayName("PLANNED task를 cancel하면 CANCELLED가 된다")
	void cancelTask_planned_becomesCancelled() {
		Task task = plannedTask();
		given(taskRepository.findById(task.getId())).willReturn(Optional.of(task));

		taskService.cancelTask(task.getId());

		assertThat(task.getStatus()).isEqualTo(TaskStatus.CANCELLED);
	}

	@Test
	@DisplayName("BLOCKED task를 cancel하면 CANCELLED가 된다")
	void cancelTask_blocked_becomesCancelled() {
		Task task = blockedTask();
		given(taskRepository.findById(task.getId())).willReturn(Optional.of(task));

		taskService.cancelTask(task.getId());

		assertThat(task.getStatus()).isEqualTo(TaskStatus.CANCELLED);
	}

	@Test
	@DisplayName("존재하지 않는 task를 start하면 TASK_NOT_FOUND 예외가 발생한다")
	void startTask_notFound_throwsException() {
		UUID unknownId = UUID.randomUUID();
		given(taskRepository.findByStatus(TaskStatus.IN_PROGRESS)).willReturn(Optional.empty());
		given(taskRepository.findById(unknownId)).willReturn(Optional.empty());

		assertThatThrownBy(() ->
			taskService.startTask(new StartTaskCommand(unknownId, null, null))
		)
			.isInstanceOf(AppException.class)
			.satisfies(e -> assertThat(((AppException)e).getErrorCode()).isEqualTo(ErrorCode.TASK_NOT_FOUND));
	}

	// ── event recording ─────────────────────────────────────────────

	@Test
	@DisplayName("createTask 시 CREATED 이벤트가 기록된다")
	void createTask_recordsCreatedEvent() {
		given(userSettingsService.findOrCreate()).willReturn(UserSettings.createDefault());
		given(taskRepository.countByScheduledDateAndStatusIn(eq(today), any())).willReturn(0);
		given(taskRepository.save(any())).willAnswer(inv -> {
			Task t = inv.getArgument(0);
			return Task.builder()
				.id(UUID.randomUUID()).title(t.getTitle()).status(t.getStatus())
				.scheduledDate(t.getScheduledDate()).carryOverCount(t.getCarryOverCount())
				.carryOverPending(t.isCarryOverPending()).switchCount(t.getSwitchCount())
				.createdAt(t.getCreatedAt()).build();
		});

		taskService.createTask(new CreateTaskCommand("작업", null, today, false, null, null));

		then(taskEventService).should().record(any(UUID.class), eq(TaskEventType.CREATED));
	}

	@Test
	@DisplayName("completeTask 시 COMPLETED 이벤트가 기록된다")
	void completeTask_recordsCompletedEvent() {
		Task task = inProgressTask();
		given(taskRepository.findById(task.getId())).willReturn(Optional.of(task));

		taskService.completeTask(task.getId());

		then(taskEventService).should().record(eq(task.getId()), eq(TaskEventType.COMPLETED));
	}

	@Test
	@DisplayName("blockTask 시 BLOCKED 이벤트가 기록된다")
	void blockTask_recordsBlockedEvent() {
		Task task = inProgressTask();
		given(taskRepository.findById(task.getId())).willReturn(Optional.of(task));

		taskService.blockTask(task.getId());

		then(taskEventService).should().record(eq(task.getId()), eq(TaskEventType.BLOCKED));
	}

	@Test
	@DisplayName("startTask 시 STARTED 이벤트가 기록된다")
	void startTask_recordsStartedEvent() {
		Task task = plannedTask();
		given(taskRepository.findByStatus(TaskStatus.IN_PROGRESS)).willReturn(Optional.empty());
		given(taskRepository.findById(task.getId())).willReturn(Optional.of(task));
		given(sessionService.createSession(any())).willReturn(mockSession());

		taskService.startTask(new StartTaskCommand(task.getId(), null, null));

		then(taskEventService).should().record(eq(task.getId()), any(UUID.class), eq(TaskEventType.STARTED));
	}

	// ── helpers ──────────────────────────────────────────────────────

	private Task plannedTask() {
		return Task.builder()
			.id(UUID.randomUUID()).title("PLANNED 작업").status(TaskStatus.PLANNED)
			.scheduledDate(today).carryOverCount(0).carryOverPending(false)
			.switchCount(0).createdAt(Instant.now()).build();
	}

	private Task inProgressTask() {
		return Task.builder()
			.id(UUID.randomUUID()).title("IN_PROGRESS 작업").status(TaskStatus.IN_PROGRESS)
			.scheduledDate(today).carryOverCount(0).carryOverPending(false)
			.switchCount(1).createdAt(Instant.now()).lastStartedAt(Instant.now()).build();
	}

	private Task blockedTask() {
		return Task.builder()
			.id(UUID.randomUUID()).title("BLOCKED 작업").status(TaskStatus.BLOCKED)
			.scheduledDate(today).carryOverCount(0).carryOverPending(false)
			.switchCount(0).createdAt(Instant.now()).build();
	}

	private Session mockSession() {
		return Session.builder().id(UUID.randomUUID()).startedAt(Instant.now()).build();
	}
}
