package com.atlasevents.api.submission.infrastructure;

import com.atlasevents.api.submission.domain.SubmissionStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "event_submissions")
@Getter
@Setter
@NoArgsConstructor
class SubmissionJpaEntity {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "start_date", nullable = false)
    private ZonedDateTime startDate;

    @Column(name = "end_date")
    private ZonedDateTime endDate;

    @Column(nullable = false)
    private String city;

    private String venue;

    @Column(name = "organizer_name")
    private String organizerName;

    @Column(name = "contact_email", nullable = false)
    private String contactEmail;

    @Column(name = "event_url")
    private String eventUrl;

    @Column(name = "is_free", nullable = false)
    private boolean isFree;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubmissionStatus status;

    @Column(name = "review_note")
    private String reviewNote;

    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = ZonedDateTime.now();
        if (status == null) status = SubmissionStatus.PENDING;
    }
}
