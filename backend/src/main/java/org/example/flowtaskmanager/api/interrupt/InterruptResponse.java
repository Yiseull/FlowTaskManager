package org.example.flowtaskmanager.api.interrupt;

import java.time.Instant;
import java.util.UUID;

import org.example.flowtaskmanager.domain.interrupt.Interrupt;

public record InterruptResponse(
	UUID id,
	String title,
	String priority,
	String status,
	Instant createdAt,
	Instant processedAt
) {
	public static InterruptResponse from(Interrupt interrupt) {
		return new InterruptResponse(
			interrupt.getId(),
			interrupt.getTitle(),
			interrupt.getPriority().name(),
			interrupt.getStatus().name(),
			interrupt.getCreatedAt(),
			interrupt.getProcessedAt()
		);
	}
}
