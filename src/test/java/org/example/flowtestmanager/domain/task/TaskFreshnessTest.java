package org.example.flowtestmanager.domain.task;

import static org.assertj.core.api.Assertions.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TaskFreshnessTest {

	// ── PLANNED 케이스 ──────────────────────────────────────────
	@Test
	@DisplayName("PLANNED: 한 번도 시작하지 않고 생성 후 3일 이상이면 STALE")
	void planned_neverStarted_olderThan3Days_isStale() {
		Task task = plannedTask()
			.title("방치된 작업")
			.createdAt(Instant.now().minus(3, ChronoUnit.DAYS))
			.build();

		assertThat(task.calculateFreshness()).contains(TaskFreshness.STALE);
	}

	@Test
	@DisplayName("PLANNED: 한 번도 시작하지 않았지만 생성 후 3일 미만이면 NORMAL")
	void planned_neverStarted_lessThan3Days_isNormal() {
		Task task = plannedTask()
			.title("새 작업")
			.createdAt(Instant.now().minus(2, ChronoUnit.DAYS))
			.build();

		assertThat(task.calculateFreshness()).contains(TaskFreshness.NORMAL);
	}

	@Test
	@DisplayName("PLANNED: 한 번 시작했지만 last_started_at 기준 3일 이상 경과하면 STALE")
	void planned_startedButNeglected_olderThan3Days_isStale() {
		Task task = plannedTask()
			.title("오래 전 시작 후 방치된 작업")
			.createdAt(Instant.now().minus(10, ChronoUnit.DAYS))
			.lastStartedAt(Instant.now().minus(3, ChronoUnit.DAYS))
			.build();

		assertThat(task.calculateFreshness()).contains(TaskFreshness.STALE);
	}

	@Test
	@DisplayName("PLANNED: 한 번 시작했고 last_started_at 기준 3일 미만이면 NORMAL")
	void planned_startedRecently_isNormal() {
		Task task = plannedTask()
			.title("최근 시작한 작업")
			.createdAt(Instant.now().minus(10, ChronoUnit.DAYS))
			.lastStartedAt(Instant.now().minus(2, ChronoUnit.DAYS))
			.build();

		assertThat(task.calculateFreshness()).contains(TaskFreshness.NORMAL);
	}

	@Test
	@DisplayName("PLANNED: carryOverCount 4 이상이면 STALE")
	void planned_carryOverCount4orMore_isStale() {
		Task task = plannedTask()
			.title("자주 미룬 작업")
			.carryOverCount(4)
			.lastStartedAt(Instant.now().minus(1, ChronoUnit.DAYS))
			.build();

		assertThat(task.calculateFreshness()).contains(TaskFreshness.STALE);
	}

	@Test
	@DisplayName("PLANNED: carryOverCount 2~3이면 WARNING")
	void planned_carryOverCount2or3_isWarning() {
		Task task = plannedTask()
			.title("조금 미룬 작업")
			.carryOverCount(2)
			.lastStartedAt(Instant.now().minus(1, ChronoUnit.DAYS))
			.build();

		assertThat(task.calculateFreshness()).contains(TaskFreshness.WARNING);
	}

	@Test
	@DisplayName("PLANNED: carryOverCount 1 이하이고 최근 시작했으면 NORMAL")
	void planned_recentlyStarted_lowCarryOver_isNormal() {
		Task task = plannedTask()
			.title("정상 작업")
			.carryOverCount(1)
			.lastStartedAt(Instant.now().minus(1, ChronoUnit.DAYS))
			.build();

		assertThat(task.calculateFreshness()).contains(TaskFreshness.NORMAL);
	}

	@Test
	@DisplayName("PLANNED: 방치형 조건(1순위)은 carryOverCount 4 이상(2순위)보다 우선")
	void planned_neverStartedStale_takePriorityOverCarryOver() {
		Task task = plannedTask()
			.title("완전 방치 작업")
			.carryOverCount(4)
			.createdAt(Instant.now().minus(5, ChronoUnit.DAYS))
			.build();

		assertThat(task.calculateFreshness()).contains(TaskFreshness.STALE);
	}

	// ── IN_PROGRESS 케이스 ──────────────────────────────────────
	@Test
	@DisplayName("IN_PROGRESS: freshness 없음 — Optional.empty() 반환")
	void inProgress_returnsEmpty() {
		Task task = Task.builder()
			.title("진행 중인 작업")
			.status(TaskStatus.IN_PROGRESS)
			.scheduledDate(LocalDate.now())
			.carryOverCount(5)
			.createdAt(Instant.now().minus(10, ChronoUnit.DAYS))
			.lastStartedAt(Instant.now())
			.build();

		assertThat(task.calculateFreshness()).isEmpty();
	}

	// ── BLOCKED / COMPLETED / CANCELLED 케이스 ──────────────────
	@Test
	@DisplayName("BLOCKED: 항상 NORMAL 반환")
	void blocked_alwaysNormal() {
		Task task = Task.builder()
			.title("차단된 작업")
			.status(TaskStatus.BLOCKED)
			.scheduledDate(LocalDate.now())
			.carryOverCount(5)
			.createdAt(Instant.now().minus(10, ChronoUnit.DAYS))
			.lastStartedAt(null)
			.build();

		assertThat(task.calculateFreshness()).contains(TaskFreshness.NORMAL);
	}

	@Test
	@DisplayName("COMPLETED: 항상 NORMAL 반환")
	void completed_alwaysNormal() {
		Task task = Task.builder()
			.title("완료된 작업")
			.status(TaskStatus.COMPLETED)
			.scheduledDate(LocalDate.now())
			.carryOverCount(0)
			.createdAt(Instant.now().minus(1, ChronoUnit.DAYS))
			.lastStartedAt(Instant.now().minus(1, ChronoUnit.DAYS))
			.build();

		assertThat(task.calculateFreshness()).contains(TaskFreshness.NORMAL);
	}

	@Test
	@DisplayName("CANCELLED: 항상 NORMAL 반환")
	void cancelled_alwaysNormal() {
		Task task = Task.builder()
			.title("취소된 작업")
			.status(TaskStatus.CANCELLED)
			.scheduledDate(LocalDate.now())
			.carryOverCount(3)
			.createdAt(Instant.now().minus(7, ChronoUnit.DAYS))
			.lastStartedAt(null)
			.build();

		assertThat(task.calculateFreshness()).contains(TaskFreshness.NORMAL);
	}

	private Task.TaskBuilder plannedTask() {
		return Task.builder()
			.status(TaskStatus.PLANNED)
			.scheduledDate(LocalDate.now())
			.carryOverCount(0)
			.createdAt(Instant.now())
			.lastStartedAt(null);
	}
}
