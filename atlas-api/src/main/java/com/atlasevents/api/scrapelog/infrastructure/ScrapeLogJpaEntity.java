package com.atlasevents.api.scrapelog.infrastructure;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "scrape_logs")
@Getter
@Setter
@NoArgsConstructor
class ScrapeLogJpaEntity {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String source;

    @Column(nullable = false)
    private String url;

    @Column(name = "started_at", nullable = false)
    private ZonedDateTime startedAt;

    @Column(name = "finished_at")
    private ZonedDateTime finishedAt;

    @Column(name = "events_found", nullable = false)
    private int eventsFound;

    @Column(name = "events_inserted", nullable = false)
    private int eventsInserted;

    @Column(nullable = false)
    private boolean success;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "run_id")
    private UUID runId;

    @PrePersist
    void prePersist() {
        if (startedAt == null) startedAt = ZonedDateTime.now();
    }
}
