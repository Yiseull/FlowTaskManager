package org.example.flowtaskmanager.domain.interrupt;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface InterruptRepository extends JpaRepository<Interrupt, UUID> {

	List<Interrupt> findAllByOrderByCreatedAtDesc();

	List<Interrupt> findByStatusOrderByCreatedAtDesc(InterruptStatus status);
}
