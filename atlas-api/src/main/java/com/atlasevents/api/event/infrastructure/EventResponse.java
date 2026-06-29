package com.atlasevents.api.event.infrastructure;

import com.atlasevents.api.event.domain.Event;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record EventResponse(
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
        String category,
        List<String> tags,
        ZonedDateTime createdAt
) {
    static EventResponse from(Event event) {
        return new EventResponse(
                event.id(),
                event.title(),
                event.description(),
                event.startDate(),
                event.endDate(),
                event.city(),
                event.venue(),
                event.organizer(),
                event.organizerUrl(),
                event.registrationUrl(),
                event.isFree(),
                event.category().name().toLowerCase(),
                event.tags(),
                event.createdAt()
        );
    }
}
