package com.atlasevents.api.event.domain;

import java.time.ZonedDateTime;
import java.util.Optional;
import java.util.UUID;

public interface EventRepository {

    EventPage findActive(String city, String category, ZonedDateTime fromDate, ZonedDateTime toDate, int page, int size);

    Optional<Event> findById(UUID id);

    boolean saveScrapedEvent(ScrapedEventInput input);
}
