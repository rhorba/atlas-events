package com.atlasevents.api.event.infrastructure;

import com.atlasevents.api.event.application.EventService;
import com.atlasevents.api.event.domain.EventPage;
import com.atlasevents.api.shared.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/events")
class EventController {

    private final EventService eventService;

    EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    ResponseEntity<ApiResponse<List<EventResponse>>> listEvents(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String category,
            @RequestParam(required = false, defaultValue = "all") String range,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {

        EventPage result = eventService.queryEvents(city, category, range, page, size);
        List<EventResponse> data = result.events().stream().map(EventResponse::from).toList();
        return ResponseEntity.ok(ApiResponse.of(data, result.total(), result.page(), result.size()));
    }

    @GetMapping("/{id}")
    ResponseEntity<ApiResponse<EventResponse>> getEvent(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.of(EventResponse.from(eventService.getEvent(id))));
    }
}
