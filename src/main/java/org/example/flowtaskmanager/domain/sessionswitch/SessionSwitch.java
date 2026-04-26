package org.example.flowtaskmanager.domain.sessionswitch;

import java.time.Instant;
import java.util.UUID;

import org.example.flowtaskmanager.domain.session.Session;
import org.example.flowtaskmanager.domain.task.SwitchReason;

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
@Table(name = "session_switches")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class SessionSwitch {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "session_id", nullable = false)
	private Session session;

	@Column(name = "from_task_id", nullable = false)
	private UUID fromTaskId;

	@Column(name = "to_task_id", nullable = false)
	private UUID toTaskId;

	@Enumerated(EnumType.STRING)
	@Column(name = "reason", nullable = false)
	private SwitchReason reason;

	@Column(name = "note")
	private String note;

	@Column(name = "switched_at", nullable = false)
	private Instant switchedAt;

	public static SessionSwitch create(Session session, UUID fromTaskId, UUID toTaskId,
		SwitchReason reason, String note) {
		return SessionSwitch.builder()
			.session(session)
			.fromTaskId(fromTaskId)
			.toTaskId(toTaskId)
			.reason(reason)
			.note(note)
			.switchedAt(Instant.now())
			.build();
	}
}
