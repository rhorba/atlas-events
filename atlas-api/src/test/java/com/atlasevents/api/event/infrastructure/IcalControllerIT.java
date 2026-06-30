package com.atlasevents.api.event.infrastructure;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.ZonedDateTime;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
class IcalControllerIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private EventJpaRepository eventJpaRepository;

    @BeforeEach
    void setUp() {
        eventJpaRepository.deleteAll();
    }

    @Test
    void ical_noEvents_returnsEmptyCalendar() {
        ResponseEntity<String> response = restTemplate.getForEntity("/ical", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("BEGIN:VCALENDAR");
        assertThat(response.getBody()).contains("END:VCALENDAR");
    }

    @Test
    void ical_withEvents_containsVEvent() {
        saveEvent("casablanca", "conference", "Tech Conf Casablanca");

        ResponseEntity<String> response = restTemplate.getForEntity("/ical", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("BEGIN:VEVENT");
        assertThat(response.getBody()).contains("END:VEVENT");
    }

    @Test
    void ical_cityFilter_onlyMatchingEvents() {
        saveEvent("casablanca", "conference", "Casa Event");
        saveEvent("rabat", "conference", "Rabat Event");

        ResponseEntity<String> response = restTemplate.getForEntity("/ical?city=casablanca", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("Casa Event");
        assertThat(response.getBody()).doesNotContain("Rabat Event");
    }

    @Test
    void ical_contentTypeIsTextCalendar() {
        ResponseEntity<String> response = restTemplate.getForEntity("/ical", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getContentType().toString()).contains("text/calendar");
    }

    private void saveEvent(String city, String category, String title) {
        EventJpaEntity entity = new EventJpaEntity();
        entity.setTitle(Map.of("fr", title));
        entity.setCity(city);
        entity.setCategory(category);
        entity.setOrganizer("Test Org");
        entity.setStartDate(ZonedDateTime.now().plusDays(7));
        entity.setSource(Map.of("name", "manual", "url", "https://example.com/" + UUID.randomUUID(), "isManual", true));
        entity.setFree(false);
        entity.setTags(new String[]{});
        entity.setStatus("upcoming");
        entity.setLanguage("fr");
        eventJpaRepository.save(entity);
    }
}
