package com.atlasevents.api.scrapelog.infrastructure;

import com.atlasevents.api.scrapelog.domain.ScrapeLog;
import com.atlasevents.api.scrapelog.domain.ScrapeLogRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
class ScrapeLogRepositoryAdapter implements ScrapeLogRepository {

    private final ScrapeLogJpaRepository jpaRepository;
    private final JdbcTemplate jdbc;

    ScrapeLogRepositoryAdapter(ScrapeLogJpaRepository jpaRepository, JdbcTemplate jdbc) {
        this.jpaRepository = jpaRepository;
        this.jdbc = jdbc;
    }

    @Override
    public ScrapeLog save(ScrapeLog log) {
        ScrapeLogJpaEntity entity = toEntity(log);
        return toDomain(jpaRepository.save(entity));
    }

    @Override
    public List<ScrapeLog> findBySource(String source, int limit) {
        return jpaRepository.findBySourceOrderByStartedAtDesc(source, limit)
                .stream().map(this::toDomain).toList();
    }

    @Override
    public List<ScrapeLog> findRecent(int limit) {
        return jpaRepository.findRecentOrderByStartedAtDesc(limit)
                .stream().map(this::toDomain).toList();
    }

    private ScrapeLogJpaEntity toEntity(ScrapeLog log) {
        ScrapeLogJpaEntity entity = new ScrapeLogJpaEntity();
        entity.setId(log.id());
        entity.setSource(log.source());
        entity.setUrl(log.url());
        entity.setStartedAt(log.startedAt());
        entity.setFinishedAt(log.finishedAt());
        entity.setEventsFound(log.eventsFound());
        entity.setEventsInserted(log.eventsInserted());
        entity.setSuccess(log.success());
        entity.setErrorMessage(log.errorMessage());
        entity.setRunId(log.runId());
        return entity;
    }

    private ScrapeLog toDomain(ScrapeLogJpaEntity entity) {
        return new ScrapeLog(
                entity.getId(),
                entity.getSource(),
                entity.getUrl(),
                entity.getStartedAt(),
                entity.getFinishedAt(),
                entity.getEventsFound(),
                countInsertedForRun(entity.getRunId()),
                entity.isSuccess(),
                entity.getErrorMessage(),
                entity.getRunId()
        );
    }

    /**
     * eventsInserted is never written at scrape-result time: the scraper and the
     * per-event inserter are decoupled across two independent queues with no
     * ordering guarantee, so a write-time counter would race. Computing it here
     * against the events table is always accurate by the time anyone reads it.
     */
    private int countInsertedForRun(UUID runId) {
        if (runId == null) return 0;
        Integer count = jdbc.queryForObject(
                "SELECT count(*) FROM events WHERE run_id = ?", Integer.class, runId);
        return count != null ? count : 0;
    }
}
