package com.atlasevents.api.event.domain;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record Event(
        UUID id,
        Map<String, String> title,
        Map<String, String> description,
        ZonedDateTime startDate,
        ZonedDateTime endDate,
        String city,
        String venue,
        String organizer,
        String organizerUrl,
        String registrationUrl,
        boolean isFree,
        EventCategory category,
        List<String> tags,
        Map<String, Object> source,
        EventStatus status,
        ZonedDateTime createdAt,
        ZonedDateTime updatedAt
) {}
