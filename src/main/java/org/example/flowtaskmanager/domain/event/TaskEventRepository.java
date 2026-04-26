package org.example.flowtaskmanager.domain.event;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskEventRepository extends JpaRepository<TaskEvent, UUID> {
	List<TaskEvent> findByTaskIdOrderByOccurredAtAsc(UUID taskId);
}
