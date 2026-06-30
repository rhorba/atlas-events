package com.atlasevents.api.event.infrastructure;

import com.atlasevents.api.event.domain.AdminEventUpdateCommand;
import com.atlasevents.api.event.domain.Event;
import com.atlasevents.api.event.domain.EventRepository;
import com.atlasevents.api.shared.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/events")
public class AdminEventController {

    private final EventRepository eventRepository;

    public AdminEventController(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EventResponse>>> listAll() {
        List<EventResponse> data = eventRepository.findAllForAdmin().stream()
                .map(EventResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.of(data, data.size(), 0, data.size()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EventResponse>> update(
            @PathVariable UUID id,
            @RequestBody AdminEventRequest req) {
        AdminEventUpdateCommand cmd = new AdminEventUpdateCommand(
                req.titleFr(), req.titleAr(), req.city(), req.category(),
                req.organizer(), req.registrationUrl(), req.venue(), req.isFree(), req.status()
        );
        Event updated = eventRepository.adminUpdate(id, cmd);
        return ResponseEntity.ok(ApiResponse.of(EventResponse.from(updated)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        eventRepository.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    record AdminEventRequest(
            String titleFr,
            String titleAr,
            String city,
            String category,
            String organizer,
            String registrationUrl,
            String venue,
            Boolean isFree,
            String status
    ) {}
}
