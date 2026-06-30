package com.atlasevents.api.submission.application;

import com.atlasevents.api.submission.domain.EventSubmission;
import com.atlasevents.api.submission.domain.SubmissionRepository;
import com.atlasevents.api.submission.domain.SubmissionStatus;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Service;

import java.time.ZonedDateTime;
import java.util.UUID;

@Service
public class SubmissionService {

    private final SubmissionRepository repository;
    private final Counter submissionsCreated;

    public SubmissionService(SubmissionRepository repository, MeterRegistry meterRegistry) {
        this.repository = repository;
        this.submissionsCreated = Counter.builder("atlas.submissions.created")
                .description("Total community event submissions received")
                .register(meterRegistry);
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
        UUID id = repository.save(submission).id();
        submissionsCreated.increment();
        return id;
    }
}
