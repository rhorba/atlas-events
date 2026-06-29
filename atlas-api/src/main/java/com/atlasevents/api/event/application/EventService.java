package com.atlasevents.api.event.application;

import com.atlasevents.api.event.domain.Event;
import com.atlasevents.api.event.domain.EventPage;
import com.atlasevents.api.event.domain.EventRepository;
import com.atlasevents.api.shared.exception.NotFoundException;
import org.springframework.stereotype.Service;

import java.time.ZonedDateTime;
import java.util.UUID;

@Service
public class EventService {

    private static final int MAX_PAGE_SIZE = 50;

    private final EventRepository repository;

    public EventService(EventRepository repository) {
        this.repository = repository;
    }

    public EventPage queryEvents(String city, String category, String range, int page, int size) {
        int cappedSize = Math.min(size, MAX_PAGE_SIZE);
        ZonedDateTime fromDate = ZonedDateTime.now();
        ZonedDateTime toDate = switch (range == null ? "all" : range) {
            case "week"  -> fromDate.plusWeeks(1);
            case "month" -> fromDate.plusMonths(1);
            default      -> null;
        };
        return repository.findActive(city, category, fromDate, toDate, page, cappedSize);
    }

    public Event getEvent(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Event not found: " + id));
    }
}
