package org.example.flowtestmanager.api.session;

import java.time.Instant;
import java.util.UUID;

public record CurrentSessionResponse(
	UUID id,
	UUID taskId,
	String taskTitle,
	Instant startedAt,
	long elapsedSeconds
) {}
