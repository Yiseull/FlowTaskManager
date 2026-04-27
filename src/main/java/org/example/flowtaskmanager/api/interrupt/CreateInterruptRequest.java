package org.example.flowtaskmanager.api.interrupt;

import org.example.flowtaskmanager.domain.interrupt.InterruptPriority;

public record CreateInterruptRequest(
	String title,
	InterruptPriority priority
) {}
