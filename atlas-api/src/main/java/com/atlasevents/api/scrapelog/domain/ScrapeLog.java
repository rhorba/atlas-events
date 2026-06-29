package com.atlasevents.api.scrapelog.domain;

import java.time.ZonedDateTime;
import java.util.UUID;

public record ScrapeLog(
        UUID id,
        String source,
        String url,
        ZonedDateTime startedAt,
        ZonedDateTime finishedAt,
        int eventsFound,
        int eventsInserted,
        boolean success,
        String errorMessage
) {}
