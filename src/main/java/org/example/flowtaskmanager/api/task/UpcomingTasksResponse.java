package org.example.flowtaskmanager.api.task;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.example.flowtaskmanager.domain.task.TaskFreshness;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record UpcomingTasksResponse(
	List<TaskDto> tasks
) {

	public record TaskDto(
		UUID id,
		String title,
		String status,
		LocalDate scheduledDate,
		int carryOverCount,
		TaskFreshness freshness
	) {}
}
