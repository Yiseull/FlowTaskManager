package org.example.flowtaskmanager.api.day;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

import java.time.LocalDate;
import java.util.List;

import org.example.flowtaskmanager.domain.day.DaySummary;
import org.example.flowtaskmanager.domain.day.DayService;
import org.example.flowtaskmanager.global.response.ApiResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DayControllerTest {

	@Mock
	DayService dayService;

	@InjectMocks
	DayController dayController;

	@Test
	@DisplayName("POST /day/end — processDayEnd를 호출하고 200을 반환한다")
	void endDay_callsProcessDayEnd() {
		willDoNothing().given(dayService).processDayEnd(any(LocalDate.class));

		ApiResponse<Void> response = dayController.endDay();

		assertThat(response.data()).isNull();
		then(dayService).should().processDayEnd(any(LocalDate.class));
	}

	@Test
	@DisplayName("POST /day/start — processDayStart를 호출한다")
	void startDay_callsProcessDayStart() {
		willDoNothing().given(dayService).processDayStart(any(), any());

		dayController.startDay(new DayStartRequest(List.of(), List.of()));

		then(dayService).should().processDayStart(any(), any());
	}

	@Test
	@DisplayName("GET /day/summary — 오늘의 요약을 반환한다")
	void getDaySummary_returnsSummary() {
		DaySummary summary = new DaySummary(LocalDate.now(), 3, 2, 120, 1);
		given(dayService.getDaySummary(any(LocalDate.class))).willReturn(summary);

		ApiResponse<DaySummary> response = dayController.getDaySummary();

		assertThat(response.data().completedCount()).isEqualTo(3);
		assertThat(response.data().switchCount()).isEqualTo(2);
		assertThat(response.data().focusMinutes()).isEqualTo(120);
	}
}
