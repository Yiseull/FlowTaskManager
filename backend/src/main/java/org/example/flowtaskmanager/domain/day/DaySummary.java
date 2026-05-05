package org.example.flowtaskmanager.domain.day;

import java.time.LocalDate;

public record DaySummary(
	LocalDate date,
	int completedCount,
	int switchCount,
	long focusMinutes,
	int carryOverCount
) {}
