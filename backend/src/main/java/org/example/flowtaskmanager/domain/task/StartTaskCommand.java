package org.example.flowtaskmanager.domain.task;

import java.util.UUID;

public record StartTaskCommand(
	UUID taskId,
	SwitchReason switchReason,
	String switchNote
) {}
