package com.atlasevents.api.event.infrastructure;

import com.atlasevents.api.event.domain.Event;
import com.atlasevents.api.event.domain.EventCategory;
import com.atlasevents.api.event.domain.EventStatus;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
class EventMapper {

    Event toDomain(EventJpaEntity entity) {
        return new Event(
                entity.getId(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getCity(),
                entity.getVenue(),
                entity.getOrganizer(),
                entity.getOrganizerUrl(),
                entity.getRegistrationUrl(),
                entity.isFree(),
                parseCategory(entity.getCategory()),
                parseTags(entity.getTags()),
                entity.getSource(),
                parseStatus(entity.getStatus()),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private EventCategory parseCategory(String value) {
        try {
            return EventCategory.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return EventCategory.CONFERENCE;
        }
    }

    private EventStatus parseStatus(String value) {
        try {
            return EventStatus.valueOf(value.toUpperCase().replace('-', '_'));
        } catch (IllegalArgumentException e) {
            return EventStatus.UPCOMING;
        }
    }

    private List<String> parseTags(String[] tags) {
        return tags != null ? Arrays.asList(tags) : List.of();
    }
}
