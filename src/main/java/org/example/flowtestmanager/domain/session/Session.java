package org.example.flowtestmanager.domain.session;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.example.flowtestmanager.domain.task.Task;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "sessions")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class Session {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "task_id", nullable = false)
	private Task task;

	@Column(name = "started_at", nullable = false)
	private Instant startedAt;

	@Column(name = "ended_at")
	private Instant endedAt;

	@Enumerated(EnumType.STRING)
	@Column(name = "end_reason")
	private SessionEndReason endReason;

	public static Session start(Task task) {
		return Session.builder()
			.task(task)
			.startedAt(Instant.now())
			.build();
	}

	public void end(SessionEndReason reason) {
		this.endedAt = Instant.now();
		this.endReason = reason;
	}

	public long elapsedSeconds() {
		Instant end = endedAt != null ? endedAt : Instant.now();
		return ChronoUnit.SECONDS.between(startedAt, end);
	}

	public boolean isOpen() {
		return endedAt == null;
	}
}
