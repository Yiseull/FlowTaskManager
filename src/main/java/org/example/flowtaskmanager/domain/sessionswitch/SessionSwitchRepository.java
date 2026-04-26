package org.example.flowtaskmanager.domain.sessionswitch;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SessionSwitchRepository extends JpaRepository<SessionSwitch, UUID> {
}
