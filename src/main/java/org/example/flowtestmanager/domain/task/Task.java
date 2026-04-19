package org.example.flowtestmanager.domain.task;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.example.flowtestmanager.global.exception.AppException;
import org.example.flowtestmanager.global.exception.ErrorCode;

import jakarta.persistence.Access;
import jakarta.persistence.AccessType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tasks")
@Getter
@Access(AccessType.FIELD)
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class Task {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false)
	private String title;

	private String description;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private TaskStatus status;

	@Column(name = "scheduled_date")
	private LocalDate scheduledDate;

	@Column(name = "carry_over_count", nullable = false)
	private int carryOverCount;

	@Column(name = "carry_over_pending", nullable = false)
	private boolean carryOverPending;

	@Column(name = "switch_count", nullable = false)
	private int switchCount;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "last_started_at")
	private Instant lastStartedAt;

	@Column(name = "completed_at")
	private Instant completedAt;

	@Version
	private Long version;

	public static Task create(String title, String description, LocalDate scheduledDate) {
		return Task.builder()
			.title(title)
			.description(description)
			.status(TaskStatus.PLANNED)
			.scheduledDate(scheduledDate)
			.carryOverCount(0)
			.carryOverPending(false)
			.switchCount(0)
			.createdAt(Instant.now())
			.build();
	}

	public void start() {
		transitionTo(TaskStatus.IN_PROGRESS);
		this.lastStartedAt = Instant.now();
	}

	public void complete() {
		transitionTo(TaskStatus.COMPLETED);
		this.completedAt = Instant.now();
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

	public void pause() {
		if (this.status != TaskStatus.IN_PROGRESS) {
			throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
		}
		this.status = TaskStatus.PLANNED;
	}

	public void carryOver() {
		scheduledDate = scheduledDate.plusDays(1);
		carryOverCount++;
		carryOverPending = false;
		status = TaskStatus.PLANNED;
	}

	public void setCarryOverPending(boolean carryOverPending) {
		this.carryOverPending = carryOverPending;
	}

	public void incrementSwitchCount() {
		switchCount++;
	}

	public Optional<TaskFreshness> calculateFreshness() {
		return Optional.ofNullable(TaskFreshness.calculateFreshness(status, lastStartedAt, createdAt, carryOverCount));
	}

	private void transitionTo(TaskStatus next) {
		if (!status.canTransitionTo(next)) {
			throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
		}
		this.status = next;
	}
}
