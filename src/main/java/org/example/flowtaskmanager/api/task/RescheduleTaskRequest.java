package org.example.flowtaskmanager.api.task;

import java.time.LocalDate;

public record RescheduleTaskRequest(
	LocalDate scheduledDate
) {}
