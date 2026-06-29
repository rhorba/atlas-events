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
class EventControllerIT {

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
    void listEvents_emptyDatabase_returns200WithEmptyList() {
        ResponseEntity<String> response = restTemplate.getForEntity("/api/v1/events", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("\"data\":[]");
        assertThat(response.getBody()).contains("\"total\":0");
    }

    @Test
    void listEvents_withCityFilter_returnsMatchingEvents() {
        saveEvent("casablanca", "conference");
        saveEvent("rabat", "conference");

        ResponseEntity<String> response = restTemplate.getForEntity(
                "/api/v1/events?city=casablanca", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("casablanca");
        assertThat(response.getBody()).doesNotContain("rabat");
    }

    @Test
    void listEvents_deletedEvent_notReturned() {
        EventJpaEntity active = saveEvent("casablanca", "conference");
        EventJpaEntity deleted = saveEvent("casablanca", "conference");
        deleted.setDeletedAt(ZonedDateTime.now().minusDays(1));
        eventJpaRepository.save(deleted);

        ResponseEntity<String> response = restTemplate.getForEntity("/api/v1/events", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("\"total\":1");
    }

    @Test
    void getEvent_unknownId_returns404() {
        ResponseEntity<String> response = restTemplate.getForEntity(
                "/api/v1/events/" + UUID.randomUUID(), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void getEvent_knownId_returns200WithEvent() {
        EventJpaEntity saved = saveEvent("marrakech", "startup");

        ResponseEntity<String> response = restTemplate.getForEntity(
                "/api/v1/events/" + saved.getId(), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("marrakech");
    }

    @Test
    void listEvents_sizeExceedingMax_cappedAtFifty() {
        for (int i = 0; i < 10; i++) saveEvent("casablanca", "conference");

        ResponseEntity<String> response = restTemplate.getForEntity(
                "/api/v1/events?size=999", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    private EventJpaEntity saveEvent(String city, String category) {
        EventJpaEntity entity = new EventJpaEntity();
        entity.setTitle(Map.of("fr", "Test Event " + UUID.randomUUID()));
        entity.setCity(city);
        entity.setCategory(category);
        entity.setOrganizer("Test Org");
        entity.setStartDate(ZonedDateTime.now().plusDays(7));
        entity.setSource(Map.of("name", "manual", "url", "https://example.com/" + UUID.randomUUID(), "isManual", true));
        entity.setFree(false);
        entity.setTags(new String[]{});
        entity.setStatus("upcoming");
        entity.setLanguage("fr");
        return eventJpaRepository.save(entity);
    }
}
