package com.atlasevents.api.ical.infrastructure;

import com.atlasevents.api.ical.application.IcalService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ical")
class IcalController {

    private final IcalService icalService;

    IcalController(IcalService icalService) {
        this.icalService = icalService;
    }

    @GetMapping
    ResponseEntity<String> getCalendar(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String category) {

        String calendarData = icalService.buildCalendar(city, category);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "text/calendar; charset=UTF-8")
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"atlas-events.ics\"")
                .body(calendarData);
    }
}
