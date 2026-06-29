package com.atlasevents.api.submission.domain;

public interface SubmissionRepository {
    EventSubmission save(EventSubmission submission);
}
