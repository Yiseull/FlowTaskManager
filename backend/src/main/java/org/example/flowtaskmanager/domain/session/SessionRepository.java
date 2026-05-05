package org.example.flowtaskmanager.domain.session;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SessionRepository extends JpaRepository<Session, UUID> {

	Optional<Session> findFirstByEndedAtIsNull();

	Optional<Session> findFirstByTaskIdAndEndedAtIsNull(UUID taskId);

	@Query("SELECT s FROM Session s WHERE s.task.id = :taskId AND s.startedAt >= :start AND s.startedAt < :end")
	List<Session> findByTaskIdAndDateRange(
		@Param("taskId") UUID taskId,
		@Param("start") Instant start,
		@Param("end") Instant end
	);

	@Query("SELECT s FROM Session s WHERE s.startedAt >= :start AND s.startedAt < :end")
	List<Session> findByDateRange(@Param("start") Instant start, @Param("end") Instant end);
}
