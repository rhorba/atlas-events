package com.atlasevents.api.submission.infrastructure;

import com.atlasevents.api.shared.exception.NotFoundException;
import com.atlasevents.api.submission.domain.EventSubmission;
import com.atlasevents.api.submission.domain.SubmissionRepository;
import com.atlasevents.api.submission.domain.SubmissionStatus;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
class SubmissionRepositoryAdapter implements SubmissionRepository {

    private final SubmissionJpaRepository jpaRepository;

    SubmissionRepositoryAdapter(SubmissionJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public EventSubmission save(EventSubmission submission) {
        return toDomain(jpaRepository.save(toEntity(submission)));
    }

    @Override
    public List<EventSubmission> findByStatus(SubmissionStatus status) {
        return jpaRepository.findByStatusOrderByCreatedAtDesc(status).stream()
                .map(SubmissionRepositoryAdapter::toDomain)
                .toList();
    }

    @Override
    public Optional<EventSubmission> findById(UUID id) {
        return jpaRepository.findById(id).map(SubmissionRepositoryAdapter::toDomain);
    }

    @Override
    public EventSubmission updateStatus(UUID id, SubmissionStatus status, String reviewNote) {
        SubmissionJpaEntity entity = jpaRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Submission not found: " + id));
        entity.setStatus(status);
        entity.setReviewNote(reviewNote);
        return toDomain(jpaRepository.save(entity));
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
        e.setReviewNote(s.reviewNote());
        e.setCreatedAt(s.createdAt());
        return e;
    }

    private static EventSubmission toDomain(SubmissionJpaEntity e) {
        return new EventSubmission(
                e.getId(), e.getTitle(), e.getDescription(),
                e.getStartDate(), e.getEndDate(), e.getCity(),
                e.getVenue(), e.getOrganizerName(), e.getContactEmail(),
                e.getEventUrl(), e.isFree(), e.getStatus(), e.getReviewNote(), e.getCreatedAt()
        );
    }
}
