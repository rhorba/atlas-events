package com.atlasevents.api.submission.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

interface SubmissionJpaRepository extends JpaRepository<SubmissionJpaEntity, UUID> {}
