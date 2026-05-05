package org.example.flowtaskmanager.domain.task;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, UUID> {

	Optional<Task> findByStatus(TaskStatus status);

	List<Task> findByScheduledDate(LocalDate date);

	List<Task> findByScheduledDateAfterAndStatusInOrderByScheduledDateAscCreatedAtAsc(
		LocalDate date,
		List<TaskStatus> statuses
	);

	List<Task> findByScheduledDateIsNullAndStatusIn(List<TaskStatus> statuses);

	int countByScheduledDateAndStatusIn(LocalDate date, List<TaskStatus> statuses);

	List<Task> findByCarryOverPendingTrue();
}
