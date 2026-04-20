package org.example.flowtaskmanager.api.task;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.example.flowtaskmanager.domain.task.TaskFreshness;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record TodayTasksResponse(
	ActiveTaskDto active,
	List<PlannedTaskDto> planned,
	List<CompletedTaskDto> completed,
	List<BlockedTaskDto> blocked,
	List<CancelledTaskDto> cancelled,
	List<PlannedTaskDto> carryOverPending
) {

	public record ActiveTaskDto(UUID id, String title, int carryOverCount, SessionDto session) {}

	public record PlannedTaskDto(UUID id, String title, int carryOverCount, TaskFreshness freshness) {}

	public record CompletedTaskDto(UUID id, String title, Instant completedAt) {}

	public record BlockedTaskDto(UUID id, String title) {}

	public record CancelledTaskDto(UUID id, String title) {}

	public record SessionDto(UUID id, long elapsedSeconds) {}
}
