package org.example.flowtaskmanager.domain.task;

import java.time.LocalDate;
import java.util.UUID;

public record CreateTaskCommand(
	String title,
	String description,
	LocalDate scheduledDate,
	boolean startImmediately,
	SwitchReason switchReason,
	String switchNote,
	UUID convertedFromInterruptId
) {
	public CreateTaskCommand(
		String title,
		String description,
		LocalDate scheduledDate,
		boolean startImmediately,
		SwitchReason switchReason,
		String switchNote
	) {
		this(title, description, scheduledDate, startImmediately, switchReason, switchNote, null);
	}
}
