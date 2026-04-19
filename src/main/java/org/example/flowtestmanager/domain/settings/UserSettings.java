package org.example.flowtestmanager.domain.settings;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_settings")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class UserSettings {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(name = "daily_task_limit", nullable = false)
	private int dailyTaskLimit;

	public static UserSettings createDefault() {
		return UserSettings.builder()
			.dailyTaskLimit(5)
			.build();
	}

	public void updateDailyTaskLimit(int dailyTaskLimit) {
		this.dailyTaskLimit = dailyTaskLimit;
	}
}
