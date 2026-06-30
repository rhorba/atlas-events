package com.atlasevents.api.messaging;

import java.time.ZonedDateTime;
import java.util.UUID;

public record ScrapeResultMessage(
        String sourceName,
        String url,
        int eventsFound,
        boolean success,
        String errorMessage,
        ZonedDateTime finishedAt,
        UUID runId
) {}
