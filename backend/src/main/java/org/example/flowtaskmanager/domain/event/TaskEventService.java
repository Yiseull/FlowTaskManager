package org.example.flowtaskmanager.domain.event;

import java.util.UUID;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TaskEventService {

	private final TaskEventRepository taskEventRepository;

	public void record(UUID taskId, TaskEventType type) {
		taskEventRepository.save(TaskEvent.of(taskId, type));
	}

	public void record(UUID taskId, UUID sessionId, TaskEventType type) {
		taskEventRepository.save(TaskEvent.of(taskId, sessionId, type));
	}
}
