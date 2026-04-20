package org.example.flowtaskmanager.api.settings;

import org.example.flowtaskmanager.domain.settings.UserSettingsService;
import org.example.flowtaskmanager.global.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/settings")
public class SettingsController {

	private final UserSettingsService userSettingsService;

	public SettingsController(UserSettingsService userSettingsService) {
		this.userSettingsService = userSettingsService;
	}

	@GetMapping
	public ApiResponse<SettingsResponse> getSettings() {
		return ApiResponse.of(new SettingsResponse(userSettingsService.getSettings().getDailyTaskLimit()));
	}

	@PatchMapping
	public ApiResponse<SettingsResponse> updateSettings(@RequestBody UpdateSettingsRequest request) {
		if (request.dailyTaskLimit() == null) {
			return ApiResponse.of(new SettingsResponse(userSettingsService.getSettings().getDailyTaskLimit()));
		}
		return ApiResponse.of(new SettingsResponse(
			userSettingsService.updateDailyTaskLimit(request.dailyTaskLimit()).getDailyTaskLimit()
		));
	}

	public record SettingsResponse(int dailyTaskLimit) {}
	public record UpdateSettingsRequest(Integer dailyTaskLimit) {}
}
