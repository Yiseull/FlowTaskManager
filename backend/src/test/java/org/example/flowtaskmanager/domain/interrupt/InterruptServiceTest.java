package org.example.flowtaskmanager.domain.interrupt;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.example.flowtaskmanager.domain.session.Session;
import org.example.flowtaskmanager.domain.session.SessionService;
import org.example.flowtaskmanager.domain.task.CreateTaskCommand;
import org.example.flowtaskmanager.domain.task.SwitchReason;
import org.example.flowtaskmanager.domain.task.Task;
import org.example.flowtaskmanager.domain.task.TaskService;
import org.example.flowtaskmanager.domain.task.TaskStatus;
import org.example.flowtaskmanager.global.exception.AppException;
import org.example.flowtaskmanager.global.exception.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InterruptServiceTest {

	@Mock
	InterruptRepository interruptRepository;
	@Mock
	SessionService sessionService;
	@Mock
	TaskService taskService;
	@InjectMocks
	InterruptService interruptService;

	@Test
	@DisplayName("활성 세션이 있으면 interrupt를 생성한다")
	void createInterrupt_withActiveSession_savesInterrupt() {
		Session session = session();
		given(sessionService.getCurrentSession()).willReturn(Optional.of(session));
		given(interruptRepository.save(any(Interrupt.class))).willAnswer(inv -> inv.getArgument(0));

		Interrupt interrupt = interruptService.create("긴급 문의", InterruptPriority.HIGH);

		assertThat(interrupt.getTitle()).isEqualTo("긴급 문의");
		assertThat(interrupt.getPriority()).isEqualTo(InterruptPriority.HIGH);
		assertThat(interrupt.getStatus()).isEqualTo(InterruptStatus.PENDING);
	}

	@Test
	@DisplayName("활성 세션이 없으면 interrupt 생성 시 NO_ACTIVE_SESSION 예외가 발생한다")
	void createInterrupt_withoutActiveSession_throwsException() {
		given(sessionService.getCurrentSession()).willReturn(Optional.empty());

		assertThatThrownBy(() -> interruptService.create("긴급 문의", InterruptPriority.HIGH))
			.isInstanceOf(AppException.class)
			.satisfies(e -> assertThat(((AppException) e).getErrorCode()).isEqualTo(ErrorCode.NO_ACTIVE_SESSION));
	}

	@Test
	@DisplayName("status 없이 조회하면 전체 목록을 반환한다")
	void getInterrupts_withoutStatus_returnsAll() {
		List<Interrupt> interrupts = List.of(interrupt("a"), interrupt("b"));
		given(interruptRepository.findAllByOrderByCreatedAtDesc()).willReturn(interrupts);

		List<Interrupt> result = interruptService.getInterrupts(null);

		assertThat(result).hasSize(2);
		then(interruptRepository).should().findAllByOrderByCreatedAtDesc();
	}

	@Test
	@DisplayName("status가 있으면 해당 상태 목록만 반환한다")
	void getInterrupts_withStatus_returnsFiltered() {
		List<Interrupt> interrupts = List.of(interrupt("a"));
		given(interruptRepository.findByStatusOrderByCreatedAtDesc(InterruptStatus.PENDING)).willReturn(interrupts);

		List<Interrupt> result = interruptService.getInterrupts(InterruptStatus.PENDING);

		assertThat(result).hasSize(1);
		then(interruptRepository).should().findByStatusOrderByCreatedAtDesc(InterruptStatus.PENDING);
	}

	@Test
	@DisplayName("convert 시 task를 생성하고 interrupt를 완료 처리한다")
	void convertInterrupt_createsTaskAndMarksConverted() {
		Interrupt interrupt = interrupt("긴급 문의");
		Task task = task("긴급 문의");
		given(interruptRepository.findById(interrupt.getId())).willReturn(Optional.of(interrupt));
		given(taskService.createTask(any(CreateTaskCommand.class))).willReturn(task);

		Task result = interruptService.convert(interrupt.getId(), true);

		assertThat(result.getId()).isEqualTo(task.getId());
		assertThat(interrupt.getStatus()).isEqualTo(InterruptStatus.CONVERTED_TO_TASK);
		assertThat(interrupt.getProcessedAt()).isNotNull();
		then(taskService).should().createTask(argThat(cmd ->
			cmd.title().equals("긴급 문의") &&
			cmd.startImmediately() &&
			cmd.switchReason() == SwitchReason.INTERRUPTED &&
			interrupt.getId().equals(cmd.convertedFromInterruptId())
		));
	}

	@Test
	@DisplayName("dismiss 시 interrupt를 DISMISSED로 변경한다")
	void dismissInterrupt_marksDismissed() {
		Interrupt interrupt = interrupt("긴급 문의");
		given(interruptRepository.findById(interrupt.getId())).willReturn(Optional.of(interrupt));

		Interrupt result = interruptService.dismiss(interrupt.getId());

		assertThat(result.getStatus()).isEqualTo(InterruptStatus.DISMISSED);
		assertThat(result.getProcessedAt()).isNotNull();
	}

	@Test
	@DisplayName("이미 처리된 interrupt를 convert하면 INTERRUPT_ALREADY_PROCESSED 예외가 발생한다")
	void convertInterrupt_processed_throwsException() {
		Interrupt interrupt = interrupt("긴급 문의");
		interrupt.dismiss();
		given(interruptRepository.findById(interrupt.getId())).willReturn(Optional.of(interrupt));

		assertThatThrownBy(() -> interruptService.convert(interrupt.getId(), false))
			.isInstanceOf(AppException.class)
			.satisfies(e -> assertThat(((AppException) e).getErrorCode()).isEqualTo(ErrorCode.INTERRUPT_ALREADY_PROCESSED));
	}

	private Session session() {
		return Session.builder()
			.id(UUID.randomUUID())
			.task(task("진행 중 작업"))
			.startedAt(Instant.now())
			.build();
	}

	private Interrupt interrupt(String title) {
		return Interrupt.builder()
			.id(UUID.randomUUID())
			.session(session())
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
