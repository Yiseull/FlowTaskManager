package org.example.flowtestmanager.domain.task;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import org.example.flowtestmanager.global.exception.AppException;
import org.example.flowtestmanager.global.exception.ErrorCode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TaskStatusTransitionTest {

    @Test
    @DisplayName("PLANNED task를 시작하면 IN_PROGRESS가 된다")
    void start_fromPlanned_becomesInProgress() {
        Task task = Task.builder()
                .title("테스트 작업")
                .scheduledDate(LocalDate.now())
                .status(TaskStatus.PLANNED)
                .build();

        task.start();

        assertThat(task.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
    }

    @Test
    @DisplayName("IN_PROGRESS task를 완료하면 COMPLETED가 된다")
    void complete_fromInProgress_becomesCompleted() {
        Task task = Task.builder()
                .title("테스트 작업")
                .scheduledDate(LocalDate.now())
                .status(TaskStatus.IN_PROGRESS)
                .build();

        task.complete();

        assertThat(task.getStatus()).isEqualTo(TaskStatus.COMPLETED);
    }

    @Test
    @DisplayName("IN_PROGRESS task를 차단하면 BLOCKED가 된다")
    void block_fromInProgress_becomesBlocked() {
        Task task = Task.builder()
                .title("테스트 작업")
                .scheduledDate(LocalDate.now())
                .status(TaskStatus.IN_PROGRESS)
                .build();

        task.block();

        assertThat(task.getStatus()).isEqualTo(TaskStatus.BLOCKED);
    }

    @Test
    @DisplayName("BLOCKED task를 차단 해제하면 PLANNED가 된다")
    void unblock_fromBlocked_becomesPlanned() {
        Task task = Task.builder()
                .title("테스트 작업")
                .scheduledDate(LocalDate.now())
                .status(TaskStatus.BLOCKED)
                .build();

        task.unblock();

        assertThat(task.getStatus()).isEqualTo(TaskStatus.PLANNED);
    }

    @Test
    @DisplayName("BLOCKED task를 취소하면 CANCELLED가 된다")
    void cancel_fromBlocked_becomesCancelled() {
        Task task = Task.builder()
                .title("테스트 작업")
                .scheduledDate(LocalDate.now())
                .status(TaskStatus.BLOCKED)
                .build();

        task.cancel();

        assertThat(task.getStatus()).isEqualTo(TaskStatus.CANCELLED);
    }

    @Test
    @DisplayName("COMPLETED task를 시작하면 예외가 발생한다")
    void start_fromCompleted_throwsException() {
        Task task = Task.builder()
                .title("테스트 작업")
                .scheduledDate(LocalDate.now())
                .status(TaskStatus.COMPLETED)
                .build();

        assertThatThrownBy(task::start)
                .isInstanceOf(AppException.class)
                .satisfies(e -> assertThat(((AppException) e).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_STATUS_TRANSITION));
    }

    @Test
    @DisplayName("CANCELLED task를 시작하면 예외가 발생한다")
    void start_fromCancelled_throwsException() {
        Task task = Task.builder()
                .title("테스트 작업")
                .scheduledDate(LocalDate.now())
                .status(TaskStatus.CANCELLED)
                .build();

        assertThatThrownBy(task::start)
                .isInstanceOf(AppException.class)
                .satisfies(e -> assertThat(((AppException) e).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_STATUS_TRANSITION));
    }

    @Test
    @DisplayName("BLOCKED task를 unblock 없이 바로 시작하면 예외가 발생한다")
    void start_fromBlocked_throwsException() {
        Task task = Task.builder()
                .title("테스트 작업")
                .scheduledDate(LocalDate.now())
                .status(TaskStatus.BLOCKED)
                .build();

        assertThatThrownBy(task::start)
                .isInstanceOf(AppException.class)
                .satisfies(e -> assertThat(((AppException) e).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_STATUS_TRANSITION));
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
        Task task = Task.builder()
                .title("테스트 작업")
                .scheduledDate(LocalDate.now())
                .status(TaskStatus.IN_PROGRESS)
                .build();

        task.incrementSwitchCount();

        assertThat(task.getSwitchCount()).isEqualTo(1);
    }
}
