package org.example.flowtestmanager.domain.task;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import org.example.flowtestmanager.global.exception.AppException;
import org.example.flowtestmanager.global.exception.ErrorCode;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class Task {

	private UUID id;
	private String title;
	private String description;
	private TaskStatus status;
	private LocalDate scheduledDate;
	private int carryOverCount;
	private boolean carryOverPending;  // day_end 시 PLANNED였던 task, 사용자 선택 대기
	private int switchCount;           // 이 task에 진입한 총 횟수
	private Instant createdAt;
	private Instant lastStartedAt;
	private Instant completedAt;
	// convertedFromInterruptId (UUID) 는 Phase 2에서 추가

	public void start() {
		transitionTo(TaskStatus.IN_PROGRESS);
	}

	public void complete() {
		transitionTo(TaskStatus.COMPLETED);
	}

	public void block() {
		transitionTo(TaskStatus.BLOCKED);
	}

	public void unblock() {
		transitionTo(TaskStatus.PLANNED);
	}

	public void cancel() {
		transitionTo(TaskStatus.CANCELLED);
	}

	public void carryOver() {
		scheduledDate = scheduledDate.plusDays(1);
		carryOverCount++;
		status = TaskStatus.PLANNED;
	}

	public void incrementSwitchCount() {
		switchCount++;
	}

	private void transitionTo(TaskStatus next) {
		if (!status.canTransitionTo(next)) {
			throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
		}
		this.status = next;
	}
}