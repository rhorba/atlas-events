package com.atlasevents.api.submission.infrastructure;

import com.atlasevents.api.submission.domain.SubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

interface SubmissionJpaRepository extends JpaRepository<SubmissionJpaEntity, UUID> {
    List<SubmissionJpaEntity> findByStatusOrderByCreatedAtDesc(SubmissionStatus status);
}
