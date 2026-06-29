package com.atlasevents.api.scrapelog.infrastructure;

import com.atlasevents.api.scrapelog.domain.ScrapeLog;
import com.atlasevents.api.scrapelog.domain.ScrapeLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.ZonedDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
class AdminScrapeControllerIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @MockBean
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ScrapeLogRepository scrapeLogRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("DELETE FROM scrape_logs");
        doNothing().when(rabbitTemplate).convertAndSend(any(String.class), any(String.class), any(Object.class));
    }

    @Test
    void triggerScrape_withoutAuth_returns401() {
        ResponseEntity<String> response = restTemplate.postForEntity(
                "/api/v1/admin/scrape/trigger", null, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void triggerScrape_withValidToken_returns202() {
        String token = obtainToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        ResponseEntity<String> response = restTemplate.exchange(
                "/api/v1/admin/scrape/trigger",
                HttpMethod.POST,
                new HttpEntity<>(headers),
                String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);
    }

    @Test
    void triggerScrape_withValidToken_sendsRabbitMessage() {
        String token = obtainToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        restTemplate.exchange("/api/v1/admin/scrape/trigger", HttpMethod.POST,
                new HttpEntity<>(headers), String.class);

        verify(rabbitTemplate).convertAndSend(any(String.class), any(String.class), any(Object.class));
    }

    @Test
    void getLogs_withoutAuth_returns401() {
        ResponseEntity<String> response = restTemplate.getForEntity(
                "/api/v1/admin/scrape/logs", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void getLogs_withValidToken_returns200() {
        String token = obtainToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        ResponseEntity<String> response = restTemplate.exchange(
                "/api/v1/admin/scrape/logs",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getLogs_withExistingLogs_returnsLogs() {
        saveLog("10times", true);
        saveLog("pcns", false);
        String token = obtainToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        ResponseEntity<String> response = restTemplate.exchange(
                "/api/v1/admin/scrape/logs",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("10times");
        assertThat(response.getBody()).contains("pcns");
    }

    @Test
    void getLogs_withSourceFilter_returnsOnlyMatchingLogs() {
        saveLog("10times", true);
        saveLog("pcns", true);
        String token = obtainToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        ResponseEntity<String> response = restTemplate.exchange(
                "/api/v1/admin/scrape/logs?source=10times",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("10times");
        assertThat(response.getBody()).doesNotContain("pcns");
    }

    private void saveLog(String source, boolean success) {
        ZonedDateTime now = ZonedDateTime.now();
        scrapeLogRepository.save(new ScrapeLog(
                UUID.randomUUID(), source, "https://example.com/" + source,
                now.minusMinutes(5), now, 3, 2, success, null));
    }

    private String obtainToken() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String body = """
                {"username": "admin", "password": "test_password"}
                """;
        ResponseEntity<String> response = restTemplate.postForEntity(
                "/api/v1/auth/login", new HttpEntity<>(body, headers), String.class);
        String responseBody = response.getBody();
        int tokenStart = responseBody.indexOf("\"token\":\"") + 9;
        int tokenEnd = responseBody.indexOf("\"", tokenStart);
        return responseBody.substring(tokenStart, tokenEnd);
    }
}
