package org.example.flowtaskmanager.api.task;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.example.flowtaskmanager.domain.session.Session;
import org.example.flowtaskmanager.domain.task.CreateTaskCommand;
import org.example.flowtaskmanager.domain.task.StartTaskCommand;
import org.example.flowtaskmanager.domain.task.Task;
import org.example.flowtaskmanager.domain.task.TaskService;
import org.example.flowtaskmanager.domain.task.TaskStatus;
import org.example.flowtaskmanager.global.exception.AppException;
import org.example.flowtaskmanager.global.exception.ErrorCode;
import org.example.flowtaskmanager.global.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/tasks")
public class TaskController {

	private final TaskService taskService;

	public TaskController(TaskService taskService) {
		this.taskService = taskService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ApiResponse<TaskCreatedResponse> createTask(@RequestBody CreateTaskRequest request) {
		if (request.title() == null || request.title().isBlank()) {
			throw new AppException(ErrorCode.INVALID_REQUEST);
		}
		Task task = taskService.createTask(new CreateTaskCommand(
			request.title(),
			request.description(),
			request.resolvedScheduledDate(),
			request.startImmediately(),
			request.switchReason(),
			request.switchNote()
		));
		return ApiResponse.of(new TaskCreatedResponse(task.getId(), task.getTitle(), task.getStatus().name()));
	}

	@PostMapping("/someday")
	@ResponseStatus(HttpStatus.CREATED)
	public ApiResponse<TaskCreatedResponse> createSomedayTask(@RequestBody CreateSomedayTaskRequest request) {
		if (request.title() == null || request.title().isBlank()) {
			throw new AppException(ErrorCode.INVALID_REQUEST);
		}
		Task task = taskService.createSomedayTask(request.title(), request.description());
		return ApiResponse.of(new TaskCreatedResponse(task.getId(), task.getTitle(), task.getStatus().name()));
	}

	@GetMapping("/today")
	public ApiResponse<TodayTasksResponse> getTodayTasks() {
		List<Task> tasks = taskService.getTodayTasks(LocalDate.now());
		return ApiResponse.of(buildTodayResponse(tasks));
	}

	@GetMapping("/upcoming")
	public ApiResponse<UpcomingTasksResponse> getUpcomingTasks() {
		List<UpcomingTasksResponse.TaskDto> tasks = taskService.getUpcomingTasks(LocalDate.now()).stream()
			.map(t -> new UpcomingTasksResponse.TaskDto(
				t.getId(),
				t.getTitle(),
				t.getStatus().name(),
				t.getScheduledDate(),
				t.getCarryOverCount(),
				t.calculateFreshness().orElse(null)
			))
			.toList();
		return ApiResponse.of(new UpcomingTasksResponse(tasks));
	}

	@GetMapping("/someday")
	public ApiResponse<SomedayTasksResponse> getSomedayTasks() {
		List<SomedayTasksResponse.TaskDto> tasks = taskService.getSomedayTasks().stream()
			.map(t -> new SomedayTasksResponse.TaskDto(
				t.getId(),
				t.getTitle(),
				t.getStatus().name(),
				t.getCarryOverCount(),
				t.calculateFreshness().orElse(null)
			))
			.toList();
		return ApiResponse.of(new SomedayTasksResponse(tasks));
	}

	@PatchMapping("/{id}/start")
	public ApiResponse<StartedTaskResponse> startTask(
		@PathVariable UUID id,
		@RequestBody(required = false) StartTaskRequest request
	) {
		StartTaskRequest req = request != null ? request : new StartTaskRequest(null, null);
		Session session = taskService.startTask(new StartTaskCommand(id, req.switchReason(), req.switchNote()));
		return ApiResponse.of(new StartedTaskResponse(id, session.getId()));
	}

	@PatchMapping("/{id}/complete")
	public ApiResponse<TaskStatusResponse> completeTask(@PathVariable UUID id) {
		Task task = taskService.completeTask(id);
		return ApiResponse.of(new TaskStatusResponse(task.getId(), task.getStatus().name()));
	}

	@PatchMapping("/{id}/block")
	public ApiResponse<TaskStatusResponse> blockTask(@PathVariable UUID id) {
		Task task = taskService.blockTask(id);
		return ApiResponse.of(new TaskStatusResponse(task.getId(), task.getStatus().name()));
	}

	@PatchMapping("/{id}/unblock")
	public ApiResponse<TaskStatusResponse> unblockTask(@PathVariable UUID id) {
		Task task = taskService.unblockTask(id);
		return ApiResponse.of(new TaskStatusResponse(task.getId(), task.getStatus().name()));
	}

	@PatchMapping("/{id}/cancel")
	public ApiResponse<TaskStatusResponse> cancelTask(@PathVariable UUID id) {
		Task task = taskService.cancelTask(id);
		return ApiResponse.of(new TaskStatusResponse(task.getId(), task.getStatus().name()));
	}

	@PatchMapping("/{id}/someday")
	public ApiResponse<TaskScheduleResponse> moveTaskToSomeday(@PathVariable UUID id) {
		Task task = taskService.moveTaskToSomeday(id);
		return ApiResponse.of(new TaskScheduleResponse(task.getId(), task.getStatus().name(), task.getScheduledDate()));
	}

	@PatchMapping("/{id}/schedule")
	public ApiResponse<TaskScheduleResponse> rescheduleTask(
		@PathVariable UUID id,
		@RequestBody RescheduleTaskRequest request
	) {
		if (request == null || request.scheduledDate() == null) {
			throw new AppException(ErrorCode.INVALID_REQUEST);
		}
		Task task = taskService.rescheduleTask(id, request.scheduledDate());
		return ApiResponse.of(new TaskScheduleResponse(task.getId(), task.getStatus().name(), task.getScheduledDate()));
	}

	private TodayTasksResponse buildTodayResponse(List<Task> tasks) {
		TodayTasksResponse.ActiveTaskDto active = null;
		List<TodayTasksResponse.PlannedTaskDto> planned = new java.util.ArrayList<>();
		List<TodayTasksResponse.CompletedTaskDto> completed = new java.util.ArrayList<>();
		List<TodayTasksResponse.BlockedTaskDto> blocked = new java.util.ArrayList<>();
		List<TodayTasksResponse.CancelledTaskDto> cancelled = new java.util.ArrayList<>();
		List<TodayTasksResponse.PlannedTaskDto> carryOverPending = new java.util.ArrayList<>();

		for (Task t : tasks) {
			switch (t.getStatus()) {
				case IN_PROGRESS -> active = new TodayTasksResponse.ActiveTaskDto(
					t.getId(), t.getTitle(), t.getCarryOverCount(), null);
				case PLANNED -> {
					TodayTasksResponse.PlannedTaskDto dto = new TodayTasksResponse.PlannedTaskDto(
						t.getId(), t.getTitle(), t.getCarryOverCount(),
						t.calculateFreshness().orElse(null));
					if (t.isCarryOverPending()) carryOverPending.add(dto);
					else planned.add(dto);
				}
				case COMPLETED -> completed.add(
					new TodayTasksResponse.CompletedTaskDto(t.getId(), t.getTitle(), t.getCompletedAt()));
				case BLOCKED -> blocked.add(
					new TodayTasksResponse.BlockedTaskDto(t.getId(), t.getTitle()));
				case CANCELLED -> cancelled.add(
					new TodayTasksResponse.CancelledTaskDto(t.getId(), t.getTitle()));
			}
		}

		return new TodayTasksResponse(active, planned, completed, blocked, cancelled, carryOverPending);
	}

	public record TaskCreatedResponse(UUID id, String title, String status) {}
	public record StartedTaskResponse(UUID taskId, UUID sessionId) {}
	public record TaskStatusResponse(UUID id, String status) {}
	public record TaskScheduleResponse(UUID id, String status, LocalDate scheduledDate) {}
}
