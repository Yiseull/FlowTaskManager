package org.example.flowtaskmanager.domain.interrupt;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.example.flowtaskmanager.domain.session.Session;
import org.example.flowtaskmanager.domain.session.SessionService;
import org.example.flowtaskmanager.domain.task.CreateTaskCommand;
import org.example.flowtaskmanager.domain.task.SwitchReason;
import org.example.flowtaskmanager.domain.task.Task;
import org.example.flowtaskmanager.domain.task.TaskService;
import org.example.flowtaskmanager.global.exception.AppException;
import org.example.flowtaskmanager.global.exception.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InterruptService {

	private final InterruptRepository interruptRepository;
	private final SessionService sessionService;
	private final TaskService taskService;

	@Transactional
	public Interrupt create(String title, InterruptPriority priority) {
		Session session = sessionService.getCurrentSession()
			.orElseThrow(() -> new AppException(ErrorCode.NO_ACTIVE_SESSION));
		return interruptRepository.save(Interrupt.create(session, title, priority));
	}

	@Transactional(readOnly = true)
	public List<Interrupt> getInterrupts(InterruptStatus status) {
		if (status == null) {
			return interruptRepository.findAllByOrderByCreatedAtDesc();
		}
		return interruptRepository.findByStatusOrderByCreatedAtDesc(status);
	}

	@Transactional
	public Task convert(UUID interruptId, boolean startImmediately) {
		Interrupt interrupt = findInterrupt(interruptId);
		validatePending(interrupt);

		Task task = taskService.createTask(new CreateTaskCommand(
			interrupt.getTitle(),
			null,
			LocalDate.now(),
			startImmediately,
			startImmediately ? SwitchReason.INTERRUPTED : null,
			null,
			interrupt.getId()
		));
		interrupt.convert();
		return task;
	}

	@Transactional
	public Interrupt dismiss(UUID interruptId) {
		Interrupt interrupt = findInterrupt(interruptId);
		validatePending(interrupt);
		interrupt.dismiss();
		return interrupt;
	}

	private Interrupt findInterrupt(UUID interruptId) {
		return interruptRepository.findById(interruptId)
			.orElseThrow(() -> new AppException(ErrorCode.INTERRUPT_NOT_FOUND));
	}

	private void validatePending(Interrupt interrupt) {
		if (interrupt.isProcessed()) {
			throw new AppException(ErrorCode.INTERRUPT_ALREADY_PROCESSED);
		}
	}
}
