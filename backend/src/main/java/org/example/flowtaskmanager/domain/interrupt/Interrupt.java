package org.example.flowtaskmanager.domain.interrupt;

import java.time.Instant;
import java.util.UUID;

import org.example.flowtaskmanager.domain.session.Session;

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
@Table(name = "interrupts")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class Interrupt {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "session_id", nullable = false)
	private Session session;

	@Column(nullable = false)
	private String title;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private InterruptPriority priority;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private InterruptStatus status;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "processed_at")
	private Instant processedAt;

	public static Interrupt create(Session session, String title, InterruptPriority priority) {
		return Interrupt.builder()
			.session(session)
			.title(title)
			.priority(priority != null ? priority : InterruptPriority.LOW)
			.status(InterruptStatus.PENDING)
			.createdAt(Instant.now())
			.build();
	}

	public boolean isProcessed() {
		return status != InterruptStatus.PENDING;
	}

	public void convert() {
		this.status = InterruptStatus.CONVERTED_TO_TASK;
		this.processedAt = Instant.now();
	}

	public void dismiss() {
		this.status = InterruptStatus.DISMISSED;
		this.processedAt = Instant.now();
	}
}
