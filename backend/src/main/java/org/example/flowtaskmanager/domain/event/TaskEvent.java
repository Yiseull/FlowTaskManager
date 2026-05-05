package org.example.flowtaskmanager.domain.event;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "task_events")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class TaskEvent {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "task_id", nullable = false)
	private UUID taskId;

	@Column(name = "session_id")
	private UUID sessionId;

	@Enumerated(EnumType.STRING)
	@Column(name = "type", nullable = false)
	private TaskEventType type;

	@Column(name = "metadata", columnDefinition = "text")
	private String metadata;

	@Column(name = "occurred_at", nullable = false)
	private Instant occurredAt;

	public static TaskEvent of(UUID taskId, UUID sessionId, TaskEventType type) {
		return TaskEvent.builder()
			.taskId(taskId)
			.sessionId(sessionId)
			.type(type)
			.occurredAt(Instant.now())
			.build();
	}

	public static TaskEvent of(UUID taskId, TaskEventType type) {
		return of(taskId, null, type);
	}
}
