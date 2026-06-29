package com.atlasevents.api.scrapelog.infrastructure;

import com.atlasevents.api.scrapelog.domain.ScrapeLog;
import com.atlasevents.api.scrapelog.domain.ScrapeLogRepository;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
class ScrapeLogRepositoryAdapter implements ScrapeLogRepository {

    private final ScrapeLogJpaRepository jpaRepository;

    ScrapeLogRepositoryAdapter(ScrapeLogJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
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
                entity.getEventsInserted(),
                entity.isSuccess(),
                entity.getErrorMessage()
        );
    }
}
