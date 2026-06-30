package com.atlasevents.api.event.domain;

public record AdminEventUpdateCommand(
        String titleFr,
        String titleAr,
        String city,
        String category,
        String organizer,
        String registrationUrl,
        String venue,
        Boolean isFree,
        String status
) {}
