package com.atlasevents.api.event.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
interface EventJpaRepository extends JpaRepository<EventJpaEntity, UUID>, JpaSpecificationExecutor<EventJpaEntity> {

    @Query("SELECT e FROM EventJpaEntity e WHERE e.id = :id AND e.deletedAt IS NULL")
    Optional<EventJpaEntity> findByIdActive(@Param("id") UUID id);
}
