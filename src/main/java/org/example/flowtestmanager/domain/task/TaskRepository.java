package org.example.flowtestmanager.domain.task;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, UUID> {

	Optional<Task> findByStatus(TaskStatus status);

	List<Task> findByScheduledDate(LocalDate date);

	int countByScheduledDateAndStatusIn(LocalDate date, List<TaskStatus> statuses);

	List<Task> findByCarryOverPendingTrue();
}
