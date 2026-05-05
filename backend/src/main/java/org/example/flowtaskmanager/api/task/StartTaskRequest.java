package org.example.flowtaskmanager.api.task;

import org.example.flowtaskmanager.domain.task.SwitchReason;

public record StartTaskRequest(
	SwitchReason switchReason,
	String switchNote
) {}
