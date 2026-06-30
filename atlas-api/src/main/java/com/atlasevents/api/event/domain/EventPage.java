package com.atlasevents.api.event.domain;

import java.util.List;

public record EventPage(List<Event> events, long total, int page, int size) {}
