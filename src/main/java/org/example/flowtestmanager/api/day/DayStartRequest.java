package org.example.flowtestmanager.api.day;

import java.util.List;
import java.util.UUID;

public record DayStartRequest(
	List<UUID> carryOver,
	List<UUID> dismiss
) {
	public List<UUID> carryOver() {
		return carryOver != null ? carryOver : List.of();
	}

	public List<UUID> dismiss() {
		return dismiss != null ? dismiss : List.of();
	}
}
