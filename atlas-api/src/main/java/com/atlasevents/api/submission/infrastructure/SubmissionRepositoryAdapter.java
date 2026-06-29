package com.atlasevents.api.submission.infrastructure;

import com.atlasevents.api.submission.domain.EventSubmission;
import com.atlasevents.api.submission.domain.SubmissionRepository;
import org.springframework.stereotype.Repository;

@Repository
class SubmissionRepositoryAdapter implements SubmissionRepository {

    private final SubmissionJpaRepository jpaRepository;

    SubmissionRepositoryAdapter(SubmissionJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public EventSubmission save(EventSubmission submission) {
        SubmissionJpaEntity entity = toEntity(submission);
        SubmissionJpaEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    private static SubmissionJpaEntity toEntity(EventSubmission s) {
        SubmissionJpaEntity e = new SubmissionJpaEntity();
        e.setId(s.id());
        e.setTitle(s.title());
        e.setDescription(s.description());
        e.setStartDate(s.startDate());
        e.setEndDate(s.endDate());
        e.setCity(s.city());
        e.setVenue(s.venue());
        e.setOrganizerName(s.organizerName());
        e.setContactEmail(s.contactEmail());
        e.setEventUrl(s.eventUrl());
        e.setFree(s.isFree());
        e.setStatus(s.status());
        e.setCreatedAt(s.createdAt());
        return e;
    }

    private static EventSubmission toDomain(SubmissionJpaEntity e) {
        return new EventSubmission(
                e.getId(), e.getTitle(), e.getDescription(),
                e.getStartDate(), e.getEndDate(), e.getCity(),
                e.getVenue(), e.getOrganizerName(), e.getContactEmail(),
                e.getEventUrl(), e.isFree(), e.getStatus(), e.getCreatedAt()
        );
    }
}
