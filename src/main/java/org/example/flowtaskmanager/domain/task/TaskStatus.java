package org.example.flowtaskmanager.domain.task;

import java.util.Set;

public enum TaskStatus {
    PLANNED,
    IN_PROGRESS,
    COMPLETED,
    BLOCKED,
    CANCELLED;

    private Set<TaskStatus> allowedTransitions;

    static {
        PLANNED.allowedTransitions = Set.of(IN_PROGRESS, CANCELLED);
        IN_PROGRESS.allowedTransitions = Set.of(COMPLETED, BLOCKED);
        BLOCKED.allowedTransitions = Set.of(PLANNED, CANCELLED);
        COMPLETED.allowedTransitions = Set.of();
        CANCELLED.allowedTransitions = Set.of();
    }

    public boolean canTransitionTo(TaskStatus next) {
        return allowedTransitions.contains(next);
    }
}
