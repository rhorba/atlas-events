package com.atlasevents.api.scrapelog.infrastructure;

import com.atlasevents.api.scrapelog.domain.ScrapeLog;

import java.time.ZonedDateTime;
import java.util.UUID;

public record ScrapeLogResponse(
        UUID id,
        String source,
        String url,
        ZonedDateTime startedAt,
        ZonedDateTime finishedAt,
        int eventsFound,
        int eventsInserted,
        boolean success,
        String errorMessage
) {
    public static ScrapeLogResponse from(ScrapeLog log) {
        return new ScrapeLogResponse(
                log.id(), log.source(), log.url(),
                log.startedAt(), log.finishedAt(),
                log.eventsFound(), log.eventsInserted(),
                log.success(), log.errorMessage()
        );
    }
}
