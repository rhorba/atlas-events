package com.atlasevents.api.scrapelog.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
interface ScrapeLogJpaRepository extends JpaRepository<ScrapeLogJpaEntity, UUID> {

    @Query("SELECT s FROM ScrapeLogJpaEntity s WHERE s.source = :source ORDER BY s.startedAt DESC LIMIT :limit")
    List<ScrapeLogJpaEntity> findBySourceOrderByStartedAtDesc(@Param("source") String source, @Param("limit") int limit);

    @Query("SELECT s FROM ScrapeLogJpaEntity s ORDER BY s.startedAt DESC LIMIT :limit")
    List<ScrapeLogJpaEntity> findRecentOrderByStartedAtDesc(@Param("limit") int limit);
}
