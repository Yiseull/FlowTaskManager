package org.example.flowtaskmanager.api.interrupt;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.example.flowtaskmanager.domain.interrupt.Interrupt;
import org.example.flowtaskmanager.domain.interrupt.InterruptPriority;
import org.example.flowtaskmanager.domain.interrupt.InterruptService;
import org.example.flowtaskmanager.domain.interrupt.InterruptStatus;
import org.example.flowtaskmanager.domain.task.Task;
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
class InterruptControllerTest {

	@Mock
	InterruptService interruptService;
	@InjectMocks
	InterruptController interruptController;

	@Test
	@DisplayName("POST /interrupts - 정상 생성 시 interrupt를 반환한다")
	void createInterrupt_success_returnsInterrupt() {
		Interrupt interrupt = interrupt("긴급 문의");
		given(interruptService.create("긴급 문의", InterruptPriority.HIGH)).willReturn(interrupt);

		ApiResponse<InterruptResponse> response =
			interruptController.createInterrupt(new CreateInterruptRequest("긴급 문의", InterruptPriority.HIGH));

		assertThat(response.data().title()).isEqualTo("긴급 문의");
		assertThat(response.data().status()).isEqualTo("PENDING");
	}

	@Test
	@DisplayName("POST /interrupts - title이 없으면 INVALID_REQUEST 예외가 발생한다")
	void createInterrupt_missingTitle_throwsException() {
		assertThatThrownBy(() ->
			interruptController.createInterrupt(new CreateInterruptRequest(" ", InterruptPriority.HIGH))
		).isInstanceOf(AppException.class)
			.satisfies(e -> assertThat(((AppException) e).getErrorCode()).isEqualTo(ErrorCode.INVALID_REQUEST));
	}

	@Test
	@DisplayName("GET /interrupts - 목록을 반환한다")
	void getInterrupts_returnsList() {
		given(interruptService.getInterrupts(InterruptStatus.PENDING)).willReturn(List.of(interrupt("긴급 문의")));

		ApiResponse<List<InterruptResponse>> response = interruptController.getInterrupts(InterruptStatus.PENDING);

		assertThat(response.data()).hasSize(1);
		assertThat(response.data().get(0).title()).isEqualTo("긴급 문의");
	}

	@Test
	@DisplayName("PATCH /interrupts/{id}/convert - task로 전환한다")
	void convertInterrupt_returnsTaskId() {
		UUID interruptId = UUID.randomUUID();
		Task task = task("긴급 문의");
		given(interruptService.convert(interruptId, true)).willReturn(task);

		ApiResponse<InterruptController.ConvertInterruptResponse> response =
			interruptController.convertInterrupt(interruptId, new ConvertInterruptRequest(true));

		assertThat(response.data().taskId()).isEqualTo(task.getId());
		assertThat(response.data().interruptId()).isEqualTo(interruptId);
	}

	@Test
	@DisplayName("PATCH /interrupts/{id}/dismiss - dismiss된 interrupt를 반환한다")
	void dismissInterrupt_returnsDismissed() {
		UUID interruptId = UUID.randomUUID();
		Interrupt interrupt = interrupt("긴급 문의");
		interrupt.dismiss();
		given(interruptService.dismiss(interruptId)).willReturn(interrupt);

		ApiResponse<InterruptResponse> response = interruptController.dismissInterrupt(interruptId);

		assertThat(response.data().status()).isEqualTo("DISMISSED");
	}

	private Interrupt interrupt(String title) {
		return Interrupt.builder()
			.id(UUID.randomUUID())
			.session(null)
			.title(title)
			.priority(InterruptPriority.HIGH)
			.status(InterruptStatus.PENDING)
			.createdAt(Instant.now())
			.build();
	}

	private Task task(String title) {
		return Task.builder()
			.id(UUID.randomUUID())
			.title(title)
			.status(TaskStatus.PLANNED)
			.scheduledDate(LocalDate.now())
			.carryOverCount(0)
			.carryOverPending(false)
			.switchCount(0)
			.createdAt(Instant.now())
			.build();
	}
}
