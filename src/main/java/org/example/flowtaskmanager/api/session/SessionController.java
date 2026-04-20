package org.example.flowtaskmanager.api.session;

import org.example.flowtaskmanager.domain.session.Session;
import org.example.flowtaskmanager.domain.session.SessionService;
import org.example.flowtaskmanager.global.exception.AppException;
import org.example.flowtaskmanager.global.exception.ErrorCode;
import org.example.flowtaskmanager.global.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/sessions")
public class SessionController {

	private final SessionService sessionService;

	public SessionController(SessionService sessionService) {
		this.sessionService = sessionService;
	}

	@GetMapping("/current")
	public ApiResponse<CurrentSessionResponse> getCurrentSession() {
		Session session = sessionService.getCurrentSession()
			.orElseThrow(() -> new AppException(ErrorCode.NO_ACTIVE_SESSION));
		return ApiResponse.of(new CurrentSessionResponse(
			session.getId(),
			session.getTask().getId(),
			session.getTask().getTitle(),
			session.getStartedAt(),
			session.elapsedSeconds()
		));
	}

	@GetMapping("/{id}/summary")
	public ApiResponse<SessionSummaryResponse> getSessionSummary(@PathVariable UUID id) {
		Session session = sessionService.getSession(id)
			.orElseThrow(() -> new AppException(ErrorCode.NO_ACTIVE_SESSION));
		return ApiResponse.of(new SessionSummaryResponse(
			session.getId(),
			session.getTask().getId(),
			session.getTask().getTitle(),
			session.getStartedAt(),
			session.getEndedAt(),
			session.elapsedSeconds()
		));
	}
}
