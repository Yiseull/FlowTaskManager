package org.example.flowtaskmanager.api.task;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.example.flowtaskmanager.domain.session.Session;
import org.example.flowtaskmanager.domain.task.Task;
import org.example.flowtaskmanager.domain.task.TaskService;
import org.example.flowtaskmanager.domain.task.TaskStatus;
import org.example.flowtaskmanager.global.exception.AppException;
import org.example.flowtaskmanager.global.exception.ErrorCode;
import org.example.flowtaskmanager.global.response.ApiResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TaskControllerTest {

	@Mock
	TaskService taskService;

	@InjectMocks
	TaskController taskController;

	// ── POST /tasks ──────────────────────────────────────────────────

	@Test
	@DisplayName("POST /tasks — 정상 생성 시 task 정보를 반환한다")
	void createTask_success_returnsTask() {
		Task task = stubPlannedTask("디자인 시스템 정리");
		given(taskService.createTask(any())).willReturn(task);

		ApiResponse<TaskController.TaskCreatedResponse> response =
			taskController.createTask(new CreateTaskRequest("디자인 시스템 정리", null, null, false, null, null));

		assertThat(response.data().title()).isEqualTo("디자인 시스템 정리");
		assertThat(response.data().status()).isEqualTo("PLANNED");
	}

	@Test
	@DisplayName("POST /tasks — title이 없으면 AppException이 발생한다")
	void createTask_missingTitle_throwsException() {
		assertThatThrownBy(() ->
			taskController.createTask(new CreateTaskRequest(null, null, null, false, null, null))
		).isInstanceOf(AppException.class)
			.satisfies(e -> assertThat(((AppException)e).getErrorCode()).isEqualTo(ErrorCode.INVALID_REQUEST));
	}

	@Test
	@DisplayName("POST /tasks — 일일 한도 초과 시 DAILY_TASK_LIMIT 예외가 전파된다")
	void createTask_dailyLimitExceeded_throwsException() {
		given(taskService.createTask(any())).willThrow(new AppException(ErrorCode.DAILY_TASK_LIMIT));

		assertThatThrownBy(() ->
			taskController.createTask(new CreateTaskRequest("작업", null, null, false, null, null))
		).isInstanceOf(AppException.class)
			.satisfies(e -> assertThat(((AppException)e).getErrorCode()).isEqualTo(ErrorCode.DAILY_TASK_LIMIT));
	}

	// ── GET /tasks/today ─────────────────────────────────────────────

	@Test
	@DisplayName("GET /tasks/today — PLANNED task는 planned 목록에 포함된다")
	void getTodayTasks_plannedTask_inPlannedList() {
		Task planned = stubPlannedTask("회의록 작성");
		given(taskService.getTodayTasks(any(LocalDate.class))).willReturn(List.of(planned));

		ApiResponse<TodayTasksResponse> response = taskController.getTodayTasks();

		assertThat(response.data().planned()).hasSize(1);
		assertThat(response.data().planned().get(0).title()).isEqualTo("회의록 작성");
		assertThat(response.data().active()).isNull();
	}

	@Test
	@DisplayName("GET /tasks/today — IN_PROGRESS task는 active로 반환된다")
	void getTodayTasks_inProgressTask_inActive() {
		Task inProgress = Task.builder()
			.id(UUID.randomUUID()).title("진행 중 작업").status(TaskStatus.IN_PROGRESS)
			.scheduledDate(LocalDate.now()).carryOverCount(0).carryOverPending(false)
			.switchCount(1).createdAt(Instant.now()).lastStartedAt(Instant.now()).build();
		given(taskService.getTodayTasks(any(LocalDate.class))).willReturn(List.of(inProgress));

		ApiResponse<TodayTasksResponse> response = taskController.getTodayTasks();

		assertThat(response.data().active()).isNotNull();
		assertThat(response.data().active().title()).isEqualTo("진행 중 작업");
		assertThat(response.data().planned()).isEmpty();
	}

	// ── PATCH /tasks/:id/start ───────────────────────────────────────

	@Test
	@DisplayName("PATCH /tasks/:id/start — 정상 시작 시 sessionId를 반환한다")
	void startTask_success_returnsSessionId() {
		UUID taskId = UUID.randomUUID();
		Session session = stubSession(taskId);
		given(taskService.startTask(any())).willReturn(session);

		ApiResponse<TaskController.StartedTaskResponse> response =
			taskController.startTask(taskId, new StartTaskRequest(null, null));

		assertThat(response.data().taskId()).isEqualTo(taskId);
		assertThat(response.data().sessionId()).isEqualTo(session.getId());
	}

	@Test
	@DisplayName("PATCH /tasks/:id/start — 전환 사유 누락 시 예외가 전파된다")
	void startTask_noSwitchReason_throwsException() {
		UUID taskId = UUID.randomUUID();
		given(taskService.startTask(any())).willThrow(new AppException(ErrorCode.SWITCH_REASON_REQUIRED));

		assertThatThrownBy(() ->
			taskController.startTask(taskId, new StartTaskRequest(null, null))
		).isInstanceOf(AppException.class)
			.satisfies(e -> assertThat(((AppException)e).getErrorCode()).isEqualTo(ErrorCode.SWITCH_REASON_REQUIRED));
	}

	// ── PATCH /tasks/:id/complete ────────────────────────────────────

	@Test
	@DisplayName("PATCH /tasks/:id/complete — 정상 완료 시 COMPLETED 상태를 반환한다")
	void completeTask_success_returnsCompleted() {
		Task task = Task.builder()
			.id(UUID.randomUUID()).title("완료 작업").status(TaskStatus.COMPLETED)
			.scheduledDate(LocalDate.now()).carryOverCount(0).carryOverPending(false)
			.switchCount(1).createdAt(Instant.now()).completedAt(Instant.now()).build();
		given(taskService.completeTask(any())).willReturn(task);

		ApiResponse<TaskController.TaskStatusResponse> response = taskController.completeTask(task.getId());

		assertThat(response.data().status()).isEqualTo("COMPLETED");
	}

	// ── PATCH /tasks/:id/block ───────────────────────────────────────

	@Test
	@DisplayName("PATCH /tasks/:id/block — 정상 차단 시 BLOCKED 상태를 반환한다")
	void blockTask_success_returnsBlocked() {
		Task task = Task.builder()
			.id(UUID.randomUUID()).title("차단된 작업").status(TaskStatus.BLOCKED)
			.scheduledDate(LocalDate.now()).carryOverCount(0).carryOverPending(false)
			.switchCount(0).createdAt(Instant.now()).build();
		given(taskService.blockTask(any())).willReturn(task);

		ApiResponse<TaskController.TaskStatusResponse> response = taskController.blockTask(task.getId());

		assertThat(response.data().status()).isEqualTo("BLOCKED");
	}

	// ── PATCH /tasks/:id/cancel ──────────────────────────────────────

	@Test
	@DisplayName("PATCH /tasks/:id/cancel — 정상 취소 시 CANCELLED 상태를 반환한다")
	void cancelTask_success_returnsCancelled() {
		Task task = Task.builder()
			.id(UUID.randomUUID()).title("취소된 작업").status(TaskStatus.CANCELLED)
			.scheduledDate(LocalDate.now()).carryOverCount(0).carryOverPending(false)
			.switchCount(0).createdAt(Instant.now()).build();
		given(taskService.cancelTask(any())).willReturn(task);

		ApiResponse<TaskController.TaskStatusResponse> response = taskController.cancelTask(task.getId());

		assertThat(response.data().status()).isEqualTo("CANCELLED");
	}

	// ── helpers ──────────────────────────────────────────────────────

	private Task stubPlannedTask(String title) {
		return Task.builder()
			.id(UUID.randomUUID()).title(title).status(TaskStatus.PLANNED)
			.scheduledDate(LocalDate.now()).carryOverCount(0).carryOverPending(false)
			.switchCount(0).createdAt(Instant.now()).build();
	}

	private Session stubSession(UUID taskId) {
		Task task = Task.builder()
			.id(taskId).title("작업").status(TaskStatus.IN_PROGRESS)
			.scheduledDate(LocalDate.now()).carryOverCount(0).carryOverPending(false)
			.switchCount(1).createdAt(Instant.now()).build();
		return Session.builder().id(UUID.randomUUID()).task(task).startedAt(Instant.now()).build();
	}
}
