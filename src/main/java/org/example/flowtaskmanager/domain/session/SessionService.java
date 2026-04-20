package org.example.flowtaskmanager.domain.session;

import java.util.Optional;
import java.util.UUID;

import org.example.flowtaskmanager.domain.task.Task;
import org.example.flowtaskmanager.global.exception.AppException;
import org.example.flowtaskmanager.global.exception.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SessionService {

	private final SessionRepository sessionRepository;

	@Transactional
	public Session createSession(Task task) {
		Session session = Session.start(task);
		return sessionRepository.save(session);
	}

	@Transactional
	public Session endCurrentSession(SessionEndReason reason) {
		Session session = sessionRepository.findFirstByEndedAtIsNull()
			.orElseThrow(() -> new AppException(ErrorCode.NO_ACTIVE_SESSION));
		session.end(reason);
		return session;
	}

	@Transactional
	public void endSessionForTask(UUID taskId, SessionEndReason reason) {
		sessionRepository.findFirstByTaskIdAndEndedAtIsNull(taskId)
			.ifPresent(session -> session.end(reason));
	}

	@Transactional(readOnly = true)
	public Optional<Session> getCurrentSession() {
		return sessionRepository.findFirstByEndedAtIsNull();
	}

	@Transactional(readOnly = true)
	public Optional<Session> getSession(UUID id) {
		return sessionRepository.findById(id);
	}
}
