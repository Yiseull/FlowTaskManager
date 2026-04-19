package org.example.flowtestmanager.api.task;

import java.time.LocalDate;

import org.example.flowtestmanager.domain.task.SwitchReason;

public record CreateTaskRequest(
	String title,
	String description,
	LocalDate scheduledDate,
	boolean startImmediately,
	SwitchReason switchReason,
	String switchNote
) {
	public LocalDate resolvedScheduledDate() {
		return scheduledDate != null ? scheduledDate : LocalDate.now();
	}
}
