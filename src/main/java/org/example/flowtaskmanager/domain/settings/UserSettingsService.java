package org.example.flowtaskmanager.domain.settings;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserSettingsService {

	private final UserSettingsRepository userSettingsRepository;

	@Transactional(readOnly = true)
	public UserSettings getSettings() {
		return findOrCreate();
	}

	@Transactional
	public UserSettings updateDailyTaskLimit(int limit) {
		UserSettings settings = findOrCreate();
		settings.updateDailyTaskLimit(limit);
		return settings;
	}

	public UserSettings findOrCreate() {
		return userSettingsRepository.findFirstByOrderByIdAsc()
			.orElseGet(() -> userSettingsRepository.save(UserSettings.createDefault()));
	}
}
