package org.example.flowtaskmanager.domain.settings;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSettingsRepository extends JpaRepository<UserSettings, UUID> {

	Optional<UserSettings> findFirstByOrderByIdAsc();
}
