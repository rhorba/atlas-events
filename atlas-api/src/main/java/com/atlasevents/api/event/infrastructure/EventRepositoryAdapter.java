package com.atlasevents.api.event.infrastructure;

import com.atlasevents.api.event.domain.Event;
import com.atlasevents.api.event.domain.EventPage;
import com.atlasevents.api.event.domain.EventRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
class EventRepositoryAdapter implements EventRepository {

    private final EventJpaRepository jpaRepository;
    private final EventMapper mapper;

    EventRepositoryAdapter(EventJpaRepository jpaRepository, EventMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
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
}
