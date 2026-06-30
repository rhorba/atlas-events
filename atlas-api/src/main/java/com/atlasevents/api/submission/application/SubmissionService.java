package com.atlasevents.api.submission.application;

import com.atlasevents.api.submission.domain.EventSubmission;
import com.atlasevents.api.submission.domain.SubmissionRepository;
import com.atlasevents.api.submission.domain.SubmissionStatus;
import org.springframework.stereotype.Service;

import java.time.ZonedDateTime;
import java.util.UUID;

@Service
public class SubmissionService {

    private final SubmissionRepository repository;

    public SubmissionService(SubmissionRepository repository) {
        this.repository = repository;
    }

    public UUID submit(SubmissionCommand command) {
        EventSubmission submission = new EventSubmission(
                UUID.randomUUID(),
                command.title(),
                command.description(),
                command.startDate(),
                command.endDate(),
                command.city(),
                command.venue(),
                command.organizerName(),
                command.contactEmail(),
                command.eventUrl(),
                command.isFree(),
                SubmissionStatus.PENDING,
                null,
                ZonedDateTime.now()
        );
        return repository.save(submission).id();
    }
}
