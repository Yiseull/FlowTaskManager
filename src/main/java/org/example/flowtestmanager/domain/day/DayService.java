package org.example.flowtestmanager.domain.day;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.example.flowtestmanager.domain.session.Session;
import org.example.flowtestmanager.domain.session.SessionEndReason;
import org.example.flowtestmanager.domain.session.SessionRepository;
import org.example.flowtestmanager.domain.session.SessionService;
import org.example.flowtestmanager.domain.task.Task;
import org.example.flowtestmanager.domain.task.TaskRepository;
import org.example.flowtestmanager.domain.task.TaskStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DayService {

	private final TaskRepository taskRepository;
	private final SessionRepository sessionRepository;
	private final SessionService sessionService;

	@Transactional
	public void processDayEnd(LocalDate date) {
		List<Task> todayTasks = taskRepository.findByScheduledDate(date);
		for (Task task : todayTasks) {
			switch (task.getStatus()) {
				case IN_PROGRESS -> {
					sessionService.endSessionForTask(task.getId(), SessionEndReason.DAY_END);
					task.carryOver();
				}
				case PLANNED -> task.setCarryOverPending(true);
				default -> { /* COMPLETED, BLOCKED, CANCELLED — 변경 없음 */ }
			}
		}
	}

	@Transactional
	public void processDayStart(List<UUID> carryOverIds, List<UUID> dismissIds) {
		Set<UUID> carryOverSet = new HashSet<>(carryOverIds);
		Set<UUID> dismissSet = new HashSet<>(dismissIds);
		List<Task> pendingTasks = taskRepository.findByCarryOverPendingTrue();

		for (Task task : pendingTasks) {
			if (carryOverSet.contains(task.getId())) {
				task.carryOver();
			} else if (dismissSet.contains(task.getId())) {
				task.setCarryOverPending(false);
				task.cancel();
			}
		}
	}

	@Transactional(readOnly = true)
	public DaySummary getDaySummary(LocalDate date) {
		List<Task> tasks = taskRepository.findByScheduledDate(date);

		int completedCount = 0;
		int switchCount = 0;
		int carryOverCount = 0;
		for (Task task : tasks) {
			if (task.getStatus() == TaskStatus.COMPLETED) completedCount++;
			if (task.isCarryOverPending()) carryOverCount++;
			switchCount += task.getSwitchCount();
		}

		Instant startOfDay = date.atStartOfDay(ZoneOffset.UTC).toInstant();
		Instant startOfNextDay = date.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
		List<Session> sessions = sessionRepository.findByDateRange(startOfDay, startOfNextDay);
		long focusMinutes = sessions.stream()
			.filter(s -> !s.isOpen())
			.mapToLong(s -> ChronoUnit.MINUTES.between(s.getStartedAt(), s.getEndedAt()))
			.sum();

		return new DaySummary(date, completedCount, switchCount, focusMinutes, carryOverCount);
	}
}
