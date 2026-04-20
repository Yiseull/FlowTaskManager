package org.example.flowtaskmanager.api.session;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.example.flowtaskmanager.domain.session.Session;
import org.example.flowtaskmanager.domain.session.SessionService;
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
class SessionControllerTest {

	@Mock
	SessionService sessionService;

	@InjectMocks
	SessionController sessionController;

	@Test
	@DisplayName("GET /sessions/current — 현재 세션 정보를 반환한다")
	void getCurrentSession_returnsSession() {
		Session session = stubSession();
		given(sessionService.getCurrentSession()).willReturn(Optional.of(session));

		ApiResponse<CurrentSessionResponse> response = sessionController.getCurrentSession();

		assertThat(response.data().id()).isEqualTo(session.getId());
		assertThat(response.data().taskTitle()).isEqualTo("진행 중인 작업");
		assertThat(response.data().elapsedSeconds()).isGreaterThanOrEqualTo(0);
	}

	@Test
	@DisplayName("GET /sessions/current — 진행 중인 세션이 없으면 NO_ACTIVE_SESSION 예외가 발생한다")
	void getCurrentSession_noActiveSession_throwsException() {
		given(sessionService.getCurrentSession()).willReturn(Optional.empty());

		assertThatThrownBy(() -> sessionController.getCurrentSession())
			.isInstanceOf(AppException.class)
			.satisfies(e -> assertThat(((AppException)e).getErrorCode()).isEqualTo(ErrorCode.NO_ACTIVE_SESSION));
	}

	private Session stubSession() {
		Task task = Task.builder()
			.id(UUID.randomUUID()).title("진행 중인 작업").status(TaskStatus.IN_PROGRESS)
			.scheduledDate(LocalDate.now()).carryOverCount(0).carryOverPending(false)
			.switchCount(1).createdAt(Instant.now()).lastStartedAt(Instant.now()).build();
		return Session.builder()
			.id(UUID.randomUUID()).task(task).startedAt(Instant.now().minusSeconds(600)).build();
	}
}
