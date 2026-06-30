package com.atlasevents.api.submission.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubmissionRepository {
    EventSubmission save(EventSubmission submission);
    List<EventSubmission> findByStatus(SubmissionStatus status);
    Optional<EventSubmission> findById(UUID id);
    EventSubmission updateStatus(UUID id, SubmissionStatus status, String reviewNote);
}
