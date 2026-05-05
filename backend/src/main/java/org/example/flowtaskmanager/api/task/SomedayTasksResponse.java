package org.example.flowtaskmanager.api.task;

import java.util.List;
import java.util.UUID;

import org.example.flowtaskmanager.domain.task.TaskFreshness;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record SomedayTasksResponse(
	List<TaskDto> tasks
) {

	public record TaskDto(UUID id, String title, String status, int carryOverCount, TaskFreshness freshness) {}
}
