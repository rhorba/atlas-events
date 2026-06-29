package com.atlasevents.api.event.infrastructure;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.ZonedDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
public class EventJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "title", columnDefinition = "jsonb", nullable = false)
    private Map<String, String> title;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "description", columnDefinition = "jsonb")
    private Map<String, String> description;

    @Column(name = "start_date", nullable = false)
    private ZonedDateTime startDate;

    @Column(name = "end_date")
    private ZonedDateTime endDate;

    @Column(name = "city", nullable = false)
    private String city;

    @Column(name = "category", nullable = false)
    private String category;

    @Column(name = "venue")
    private String venue;

    @Column(name = "organizer", nullable = false)
    private String organizer;

    @Column(name = "organizer_url")
    private String organizerUrl;

    @Column(name = "registration_url")
    private String registrationUrl;

    @Column(name = "is_free", nullable = false)
    private boolean isFree;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "tags", columnDefinition = "text[]")
    private String[] tags;

    @Column(name = "language", nullable = false)
    private String language = "fr";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "source", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> source;

    @Column(name = "status", nullable = false)
    private String status = "upcoming";

    @Column(name = "deleted_at")
    private ZonedDateTime deletedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private ZonedDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = ZonedDateTime.now();
        updatedAt = ZonedDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = ZonedDateTime.now();
    }
}
