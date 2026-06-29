package com.atlasevents.api.event.domain;

import java.time.ZonedDateTime;
import java.util.Map;

public record ScrapedEventInput(
        Map<String, String> title,
        ZonedDateTime startDate,
        ZonedDateTime endDate,
        String city,
        String venue,
        String category,
        String organizer,
        String registrationUrl,
        boolean isFree,
        String sourceUrl,
        String sourceName
) {}
