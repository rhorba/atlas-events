package com.atlasevents.api.submission.application;

import com.atlasevents.api.submission.domain.EventSubmission;
import com.atlasevents.api.submission.domain.SubmissionRepository;
import com.atlasevents.api.submission.domain.SubmissionStatus;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.ZonedDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubmissionServiceTest {

    @Mock private SubmissionRepository repository;

    private SimpleMeterRegistry meterRegistry;
    private SubmissionService service;

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        service = new SubmissionService(repository, meterRegistry);
    }

    @Test
    void submit_persistsSubmissionAndReturnsId() {
        UUID expectedId = UUID.randomUUID();
        EventSubmission saved = new EventSubmission(
                expectedId, "Conf Casablanca", null,
                ZonedDateTime.now().plusDays(10), null,
                "casablanca", null, "Organizer", "org@test.ma",
                "https://example.com", false, SubmissionStatus.PENDING, null, ZonedDateTime.now()
        );
        when(repository.save(any())).thenReturn(saved);

        UUID result = service.submit(aCommand());

        assertThat(result).isEqualTo(expectedId);
    }

    @Test
    void submit_incrementsSubmissionsCreatedCounter() {
        UUID id = UUID.randomUUID();
        EventSubmission saved = new EventSubmission(
                id, "Event", null,
                ZonedDateTime.now().plusDays(5), null,
                "rabat", null, "Org", "org@test.ma",
                "https://example.com", true, SubmissionStatus.PENDING, null, ZonedDateTime.now()
        );
        when(repository.save(any())).thenReturn(saved);

        service.submit(aCommand());
        service.submit(aCommand());

        Counter counter = meterRegistry.find("atlas.submissions.created").counter();
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(2.0);
    }

    private SubmissionCommand aCommand() {
        return new SubmissionCommand(
                "Test Conference", null,
                ZonedDateTime.now().plusDays(10), null,
                "casablanca", null, "Organizer", "org@test.ma",
                "https://example.com", false
        );
    }
}
