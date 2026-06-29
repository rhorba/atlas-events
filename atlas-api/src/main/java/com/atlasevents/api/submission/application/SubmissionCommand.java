package com.atlasevents.api.submission.application;

import java.time.ZonedDateTime;

public record SubmissionCommand(
        String title,
        String description,
        ZonedDateTime startDate,
        ZonedDateTime endDate,
        String city,
        String venue,
        String organizerName,
        String contactEmail,
        String eventUrl,
        boolean isFree
) {}
