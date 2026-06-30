package com.atlasevents.api.submission.infrastructure;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
class SubmissionControllerIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void submit_validPayload_returns201WithId() {
        ResponseEntity<String> response = postSubmission(buildValidPayload());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).contains("data");
    }

    @Test
    void submit_missingRequiredFields_returns400() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String body = """
                {"description": "Missing title and other required fields"}
                """;

        ResponseEntity<String> response = restTemplate.postForEntity(
                "/api/v1/submissions",
                new HttpEntity<>(body, headers),
                String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void submit_invalidEmail_returns400() {
        String body = buildPayloadWithEmail("not-an-email");
        ResponseEntity<String> response = postSubmission(body);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void submit_responseDoesNotContainContactEmail() {
        ResponseEntity<String> response = postSubmission(buildValidPayload());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).doesNotContain("submitter@example.com");
        assertThat(response.getBody()).doesNotContain("contactEmail");
    }

    private ResponseEntity<String> postSubmission(String body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return restTemplate.postForEntity(
                "/api/v1/submissions",
                new HttpEntity<>(body, headers),
                String.class);
    }

    private String buildValidPayload() {
        String start = ZonedDateTime.now().plusDays(10).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        return """
                {
                  "title": "Tech Summit Casablanca",
                  "description": "Annual tech conference",
                  "startDate": "%s",
                  "city": "casablanca",
                  "contactEmail": "submitter@example.com",
                  "isFree": false
                }
                """.formatted(start);
    }

    private String buildPayloadWithEmail(String email) {
        String start = ZonedDateTime.now().plusDays(10).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        return """
                {
                  "title": "Tech Summit Casablanca",
                  "startDate": "%s",
                  "city": "casablanca",
                  "contactEmail": "%s",
                  "isFree": false
                }
                """.formatted(start, email);
    }
}
