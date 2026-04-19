package org.example.flowtestmanager.domain.task;

import static org.assertj.core.api.Assertions.*;

import java.time.LocalDate;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.example.flowtestmanager.global.exception.AppException;
import org.example.flowtestmanager.global.exception.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TaskStatusTransitionTest {

	@Test
	@DisplayName("PLANNED task를 시작하면 IN_PROGRESS가 된다")
	void start_fromPlanned_becomesInProgress() {
		Task task = taskWith(TaskStatus.PLANNED);

		task.start();

		assertThat(task.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
	}

	@Test
	@DisplayName("IN_PROGRESS task를 완료하면 COMPLETED가 된다")
	void complete_fromInProgress_becomesCompleted() {
		Task task = taskWith(TaskStatus.IN_PROGRESS);

		task.complete();

		assertThat(task.getStatus()).isEqualTo(TaskStatus.COMPLETED);
	}

	@Test
	@DisplayName("IN_PROGRESS task를 차단하면 BLOCKED가 된다")
	void block_fromInProgress_becomesBlocked() {
		Task task = taskWith(TaskStatus.IN_PROGRESS);

		task.block();

		assertThat(task.getStatus()).isEqualTo(TaskStatus.BLOCKED);
	}

	@Test
	@DisplayName("BLOCKED task를 차단 해제하면 PLANNED가 된다")
	void unblock_fromBlocked_becomesPlanned() {
		Task task = taskWith(TaskStatus.BLOCKED);

		task.unblock();

		assertThat(task.getStatus()).isEqualTo(TaskStatus.PLANNED);
	}

	@Test
	@DisplayName("BLOCKED task를 취소하면 CANCELLED가 된다")
	void cancel_fromBlocked_becomesCancelled() {
		Task task = taskWith(TaskStatus.BLOCKED);

		task.cancel();

		assertThat(task.getStatus()).isEqualTo(TaskStatus.CANCELLED);
	}

	@Test
	@DisplayName("PLANNED task를 취소하면 CANCELLED가 된다")
	void cancel_fromPlanned_becomesCancelled() {
		Task task = taskWith(TaskStatus.PLANNED);

		task.cancel();

		assertThat(task.getStatus()).isEqualTo(TaskStatus.CANCELLED);
	}

	@Test
	@DisplayName("IN_PROGRESS task를 pause()하면 PLANNED가 된다")
	void pause_fromInProgress_becomesPlanned() {
		Task task = taskWith(TaskStatus.IN_PROGRESS);

		task.pause();

		assertThat(task.getStatus()).isEqualTo(TaskStatus.PLANNED);
	}

	@Test
	@DisplayName("PLANNED task를 pause()하면 예외가 발생한다")
	void pause_fromPlanned_throwsException() {
		Task task = taskWith(TaskStatus.PLANNED);

		assertInvalidTransition(task::pause);
	}

	@Test
	@DisplayName("COMPLETED task를 시작하면 예외가 발생한다")
	void start_fromCompleted_throwsException() {
		Task task = taskWith(TaskStatus.COMPLETED);

		assertInvalidTransition(task::start);
	}

	@Test
	@DisplayName("CANCELLED task를 시작하면 예외가 발생한다")
	void start_fromCancelled_throwsException() {
		Task task = taskWith(TaskStatus.CANCELLED);

		assertInvalidTransition(task::start);
	}

	@Test
	@DisplayName("BLOCKED task를 unblock 없이 바로 시작하면 예외가 발생한다")
	void start_fromBlocked_throwsException() {
		Task task = taskWith(TaskStatus.BLOCKED);

		assertInvalidTransition(task::start);
	}

	@Test
	@DisplayName("carryOver() 호출 시 scheduledDate가 1일 뒤로 밀리고 carryOverCount가 증가하며 PLANNED가 된다")
	void carryOver_movesDateAndIncrementsCount() {
		LocalDate today = LocalDate.now();
		Task task = Task.builder()
			.title("테스트 작업")
			.scheduledDate(today)
			.status(TaskStatus.IN_PROGRESS)
			.build();

		task.carryOver();

		assertThat(task.getStatus()).isEqualTo(TaskStatus.PLANNED);
		assertThat(task.getScheduledDate()).isEqualTo(today.plusDays(1));
		assertThat(task.getCarryOverCount()).isEqualTo(1);
	}

	@Test
	@DisplayName("incrementSwitchCount() 호출 시 switchCount가 1 증가한다")
	void incrementSwitchCount_increasesByOne() {
		Task task = taskWith(TaskStatus.IN_PROGRESS);

		task.incrementSwitchCount();

		assertThat(task.getSwitchCount()).isEqualTo(1);
	}

	private Task taskWith(TaskStatus status) {
		return Task.builder()
			.title("테스트 작업")
			.scheduledDate(LocalDate.now())
			.status(status)
			.build();
	}

	private void assertInvalidTransition(ThrowingCallable action) {
		assertThatThrownBy(action)
			.isInstanceOf(AppException.class)
			.satisfies(e -> assertThat(((AppException)e).getErrorCode())
				.isEqualTo(ErrorCode.INVALID_STATUS_TRANSITION));
	}
}
