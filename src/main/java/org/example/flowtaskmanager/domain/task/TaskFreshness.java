package org.example.flowtaskmanager.domain.task;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;

import jakarta.annotation.Nullable;

public enum TaskFreshness {
	NORMAL, WARNING, STALE;

	private static final int STALE_THRESHOLD_DAYS = 3;
	private static final int STALE_CARRY_OVER_COUNT = 4;
	private static final int WARNING_CARRY_OVER_COUNT = 2;

	@Nullable
	public static TaskFreshness calculateFreshness(
		final TaskStatus status,
		final Instant lastStartedAt,
		final Instant createdAt,
		final int carryOverCount
	) {
		long daysSinceActive = calculateDaysSinceActive(lastStartedAt, createdAt);

		switch (status) {
			case PLANNED -> {
				if (daysSinceActive >= STALE_THRESHOLD_DAYS) {
					return TaskFreshness.STALE;
				} else if (carryOverCount >= STALE_CARRY_OVER_COUNT) {
					return TaskFreshness.STALE;
				} else if (carryOverCount >= WARNING_CARRY_OVER_COUNT) {
					return TaskFreshness.WARNING;
				}
			}
			case IN_PROGRESS -> {
				return null;
			}
		}
		return TaskFreshness.NORMAL;
	}

	private static long calculateDaysSinceActive(final Instant lastStartedAt, final Instant createdAt) {
		Instant lastActiveAt = lastStartedAt != null ? lastStartedAt : createdAt;
		return ChronoUnit.DAYS.between(lastActiveAt.atZone(ZoneOffset.UTC).toLocalDate(), LocalDate.now());
	}
}
