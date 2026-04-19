package org.example.flowtestmanager.api.day;

import java.time.LocalDate;

import org.example.flowtestmanager.domain.day.DaySummary;
import org.example.flowtestmanager.domain.day.DayService;
import org.example.flowtestmanager.global.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/day")
public class DayController {

	private final DayService dayService;

	public DayController(DayService dayService) {
		this.dayService = dayService;
	}

	@PostMapping("/start")
	public ApiResponse<Void> startDay(@RequestBody(required = false) DayStartRequest request) {
		DayStartRequest req = request != null ? request : new DayStartRequest(null, null);
		dayService.processDayStart(req.carryOver(), req.dismiss());
		return ApiResponse.of(null);
	}

	@PostMapping("/end")
	public ApiResponse<Void> endDay() {
		dayService.processDayEnd(LocalDate.now());
		return ApiResponse.of(null);
	}

	@GetMapping("/summary")
	public ApiResponse<DaySummary> getDaySummary() {
		DaySummary summary = dayService.getDaySummary(LocalDate.now());
		return ApiResponse.of(summary);
	}
}
