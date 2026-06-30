package com.atlasevents.api.event.infrastructure;

import com.atlasevents.api.event.domain.AdminEventUpdateCommand;
import com.atlasevents.api.event.domain.Event;
import com.atlasevents.api.event.domain.EventPage;
import com.atlasevents.api.event.domain.EventRepository;
import com.atlasevents.api.event.domain.ScrapedEventInput;
import com.atlasevents.api.shared.exception.NotFoundException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Component
class EventRepositoryAdapter implements EventRepository {

    private final EventJpaRepository jpaRepository;
    private final EventMapper mapper;
    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    EventRepositoryAdapter(EventJpaRepository jpaRepository, EventMapper mapper,
                            JdbcTemplate jdbc, ObjectMapper objectMapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    @Override
    public EventPage findActive(String city, String category, ZonedDateTime fromDate, ZonedDateTime toDate, int page, int size) {
        Specification<EventJpaEntity> spec = Specification
                .where(EventSpecifications.notDeleted())
                .and(EventSpecifications.startDateFrom(fromDate))
                .and(EventSpecifications.startDateUpTo(toDate))
                .and(EventSpecifications.cityEquals(city))
                .and(EventSpecifications.categoryEquals(category));

        Page<EventJpaEntity> result = jpaRepository.findAll(
                spec, PageRequest.of(page, size, Sort.by("startDate").ascending()));
        List<Event> events = result.getContent().stream().map(mapper::toDomain).toList();
        return new EventPage(events, result.getTotalElements(), page, size);
    }

    @Override
    public Optional<Event> findById(UUID id) {
        return jpaRepository.findByIdActive(id).map(mapper::toDomain);
    }

    @Override
    public boolean saveScrapedEvent(ScrapedEventInput input) {
        String titleJson = toJson(input.title());
        String sourceJson = toJson(Map.of("url", input.sourceUrl(), "name", input.sourceName()));
        String organizer = input.organizer() != null ? input.organizer() : input.sourceName();
        String venue = input.venue() != null ? input.venue() : "";

        int rows = jdbc.update("""
                INSERT INTO events (id, title, start_date, end_date, city, category, venue, organizer,
                                   registration_url, is_free, source, status, created_at, updated_at)
                VALUES (gen_random_uuid(), ?::jsonb, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, 'upcoming', NOW(), NOW())
                ON CONFLICT DO NOTHING
                """,
                titleJson,
                toTimestamp(input.startDate()),
                toTimestamp(input.endDate()),
                input.city(),
                input.category(),
                venue,
                organizer,
                input.registrationUrl(),
                input.isFree(),
                sourceJson
        );
        return rows > 0;
    }

    @Override
    public List<Event> findAllForAdmin() {
        return jpaRepository.findAll(Sort.by("createdAt").descending())
                .stream().map(mapper::toDomain).toList();
    }

    @Override
    public Event adminUpdate(UUID id, AdminEventUpdateCommand cmd) {
        EventJpaEntity entity = jpaRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Event not found: " + id));
        if (cmd.titleFr() != null) {
            Map<String, String> title = entity.getTitle() != null
                    ? new java.util.HashMap<>(entity.getTitle()) : new java.util.HashMap<>();
            title.put("fr", cmd.titleFr());
            if (cmd.titleAr() != null) title.put("ar", cmd.titleAr());
            entity.setTitle(title);
        }
        if (cmd.city() != null) entity.setCity(cmd.city());
        if (cmd.category() != null) entity.setCategory(cmd.category());
        if (cmd.organizer() != null) entity.setOrganizer(cmd.organizer());
        if (cmd.registrationUrl() != null) entity.setRegistrationUrl(cmd.registrationUrl());
        if (cmd.venue() != null) entity.setVenue(cmd.venue());
        if (cmd.isFree() != null) entity.setFree(cmd.isFree());
        if (cmd.status() != null) entity.setStatus(cmd.status());
        return mapper.toDomain(jpaRepository.save(entity));
    }

    @Override
    public void softDelete(UUID id) {
        EventJpaEntity entity = jpaRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Event not found: " + id));
        entity.setDeletedAt(ZonedDateTime.now());
        jpaRepository.save(entity);
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Cannot serialize to JSON: " + value, e);
        }
    }

    private Timestamp toTimestamp(ZonedDateTime dt) {
        return dt != null ? Timestamp.from(dt.toInstant()) : null;
    }
}
