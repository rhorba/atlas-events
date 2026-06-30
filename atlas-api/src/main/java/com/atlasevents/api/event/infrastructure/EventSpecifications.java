package com.atlasevents.api.event.infrastructure;

import org.springframework.data.jpa.domain.Specification;

import java.time.ZonedDateTime;

class EventSpecifications {

    private EventSpecifications() {}

    static Specification<EventJpaEntity> notDeleted() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }

    static Specification<EventJpaEntity> cityEquals(String city) {
        if (city == null) return null;
        return (root, query, cb) -> cb.equal(cb.lower(root.get("city")), city.toLowerCase());
    }

    static Specification<EventJpaEntity> categoryEquals(String category) {
        if (category == null) return null;
        return (root, query, cb) -> cb.equal(cb.lower(root.get("category")), category.toLowerCase());
    }

    static Specification<EventJpaEntity> startDateFrom(ZonedDateTime fromDate) {
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("startDate"), fromDate);
    }

    static Specification<EventJpaEntity> startDateUpTo(ZonedDateTime toDate) {
        if (toDate == null) return null;
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("startDate"), toDate);
    }
}
