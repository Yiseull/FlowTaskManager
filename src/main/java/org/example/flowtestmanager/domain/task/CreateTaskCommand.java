package org.example.flowtestmanager.domain.task;

import java.time.LocalDate;

public record CreateTaskCommand(
	String title,
	String description,
	LocalDate scheduledDate,
	boolean startImmediately,
	SwitchReason switchReason,
	String switchNote
) {}
