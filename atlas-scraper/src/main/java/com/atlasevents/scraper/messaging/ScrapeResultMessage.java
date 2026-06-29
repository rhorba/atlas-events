package com.atlasevents.scraper.messaging;

import java.time.ZonedDateTime;

public record ScrapeResultMessage(
        String sourceName,
        String url,
        int eventsFound,
        boolean success,
        String errorMessage,
        ZonedDateTime finishedAt
) {}
