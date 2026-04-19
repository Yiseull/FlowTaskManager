package org.example.flowtestmanager.api.session;

import java.time.Instant;
import java.util.UUID;

public record SessionSummaryResponse(
	UUID id,
	UUID taskId,
	String taskTitle,
	Instant startedAt,
	Instant endedAt,
	long elapsedSeconds
) {}
