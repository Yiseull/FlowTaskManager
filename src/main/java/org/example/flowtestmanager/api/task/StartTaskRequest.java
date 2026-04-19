package org.example.flowtestmanager.api.task;

import org.example.flowtestmanager.domain.task.SwitchReason;

public record StartTaskRequest(
	SwitchReason switchReason,
	String switchNote
) {}
