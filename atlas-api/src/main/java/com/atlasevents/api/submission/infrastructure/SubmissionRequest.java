package com.atlasevents.api.submission.infrastructure;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.ZonedDateTime;

public record SubmissionRequest(
        @NotBlank String title,
        String description,
        @NotNull ZonedDateTime startDate,
        ZonedDateTime endDate,
        @NotBlank String city,
        String venue,
        String organizerName,
        @NotBlank @Email String contactEmail,
        String eventUrl,
        boolean isFree
) {}
