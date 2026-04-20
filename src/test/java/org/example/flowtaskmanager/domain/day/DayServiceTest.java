package org.example.flowtaskmanager.domain.day;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.example.flowtaskmanager.domain.session.SessionEndReason;
import org.example.flowtaskmanager.domain.session.SessionRepository;
import org.example.flowtaskmanager.domain.session.SessionService;
import org.example.flowtaskmanager.domain.task.Task;
import org.example.flowtaskmanager.domain.task.TaskRepository;
import org.example.flowtaskmanager.domain.task.TaskStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DayServiceTest {

	@Mock
	TaskRepository taskRepository;
	@Mock
	SessionRepository sessionRepository;
	@Mock
	SessionService sessionService;
	@InjectMocks
	DayService dayService;

	private final LocalDate today = LocalDate.now();

	// ── processDayEnd ────────────────────────────────────────────────

	@Test
	@DisplayName("Day End 시 IN_PROGRESS task는 carryOver되고 세션이 종료된다")
	void processDayEnd_inProgressTask_carriesOverAndEndsSession() {
		Task task = inProgressTask();
		LocalDate originalDate = task.getScheduledDate();
		given(taskRepository.findByScheduledDate(today)).willReturn(List.of(task));

		dayService.processDayEnd(today);

		assertThat(task.getStatus()).isEqualTo(TaskStatus.PLANNED);
		assertThat(task.getScheduledDate()).isEqualTo(originalDate.plusDays(1));
		assertThat(task.getCarryOverCount()).isEqualTo(1);
		then(sessionService).should().endSessionForTask(task.getId(), SessionEndReason.DAY_END);
	}

	@Test
	@DisplayName("Day End 시 PLANNED task는 carryOverPending이 true가 된다")
	void processDayEnd_plannedTask_setsCarryOverPending() {
		Task task = plannedTask();
		given(taskRepository.findByScheduledDate(today)).willReturn(List.of(task));

		dayService.processDayEnd(today);

		assertThat(task.isCarryOverPending()).isTrue();
	}

	@Test
	@DisplayName("Day End 시 COMPLETED task는 변경되지 않는다")
	void processDayEnd_completedTask_unchanged() {
		Task task = completedTask();
		given(taskRepository.findByScheduledDate(today)).willReturn(List.of(task));

		dayService.processDayEnd(today);

		assertThat(task.getStatus()).isEqualTo(TaskStatus.COMPLETED);
		then(sessionService).should(never()).endSessionForTask(any(), any());
	}

	// ── processDayStart ──────────────────────────────────────────────

	@Test
	@DisplayName("Day Start 시 carryOver 선택한 task는 날짜가 +1되고 carryOverCount가 증가한다")
	void processDayStart_carryOver_movesDateAndIncrements() {
		Task task = pendingTask();
		LocalDate originalDate = task.getScheduledDate();
		given(taskRepository.findByCarryOverPendingTrue()).willReturn(List.of(task));

		dayService.processDayStart(List.of(task.getId()), List.of());

		assertThat(task.isCarryOverPending()).isFalse();
		assertThat(task.getCarryOverCount()).isEqualTo(1);
	}

	@Test
	@DisplayName("Day Start 시 dismiss 선택한 task는 CANCELLED가 된다")
	void processDayStart_dismiss_becomesCancelled() {
		Task task = pendingTask();
		given(taskRepository.findByCarryOverPendingTrue()).willReturn(List.of(task));

		dayService.processDayStart(List.of(), List.of(task.getId()));

		assertThat(task.getStatus()).isEqualTo(TaskStatus.CANCELLED);
		assertThat(task.isCarryOverPending()).isFalse();
	}

	// ── helpers ──────────────────────────────────────────────────────

	private Task plannedTask() {
		return Task.builder()
			.id(UUID.randomUUID())
			.title("PLANNED 작업")
			.status(TaskStatus.PLANNED)
			.scheduledDate(today)
			.carryOverCount(0)
			.carryOverPending(false)
			.switchCount(0)
			.createdAt(Instant.now())
			.build();
	}

	private Task inProgressTask() {
		return Task.builder()
			.id(UUID.randomUUID())
			.title("IN_PROGRESS 작업")
			.status(TaskStatus.IN_PROGRESS)
			.scheduledDate(today)
			.carryOverCount(0)
			.carryOverPending(false)
			.switchCount(1)
			.createdAt(Instant.now())
			.lastStartedAt(Instant.now())
			.build();
	}

	private Task completedTask() {
		return Task.builder()
			.id(UUID.randomUUID())
			.title("COMPLETED 작업")
			.status(TaskStatus.COMPLETED)
			.scheduledDate(today)
			.carryOverCount(0)
			.carryOverPending(false)
			.switchCount(1)
			.createdAt(Instant.now())
			.completedAt(Instant.now())
			.build();
	}

	private Task pendingTask() {
		return Task.builder()
			.id(UUID.randomUUID())
			.title("PENDING 작업")
			.status(TaskStatus.PLANNED)
			.scheduledDate(today.minusDays(1))
			.carryOverCount(0)
			.carryOverPending(true)
			.switchCount(0)
			.createdAt(Instant.now())
			.build();
	}
}
