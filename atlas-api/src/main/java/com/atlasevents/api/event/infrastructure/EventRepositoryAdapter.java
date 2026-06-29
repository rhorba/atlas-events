package com.atlasevents.api.event.infrastructure;

import com.atlasevents.api.event.domain.Event;
import com.atlasevents.api.event.domain.EventPage;
import com.atlasevents.api.event.domain.EventRepository;
import com.atlasevents.api.event.domain.ScrapedEventInput;
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
