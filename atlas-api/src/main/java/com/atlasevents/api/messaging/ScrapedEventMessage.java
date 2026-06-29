package com.atlasevents.api.messaging;

import java.time.ZonedDateTime;
import java.util.Map;

public record ScrapedEventMessage(
        Map<String, String> title,
        ZonedDateTime startDate,
        ZonedDateTime endDate,
        String city,
        String venue,
        String category,
        String sourceUrl,
        String sourceName,
        String organizerName,
        String registrationUrl,
        boolean isFree
) {}
