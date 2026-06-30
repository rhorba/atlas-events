package com.atlasevents.api.submission.domain;

import java.time.ZonedDateTime;
import java.util.UUID;

public record EventSubmission(
        UUID id,
        String title,
        String description,
        ZonedDateTime startDate,
        ZonedDateTime endDate,
        String city,
        String venue,
        String organizerName,
        String contactEmail,
        String eventUrl,
        boolean isFree,
        SubmissionStatus status,
        String reviewNote,
        ZonedDateTime createdAt
) {}
