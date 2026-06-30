package com.atlasevents.scraper.batch;

import com.atlasevents.scraper.scraping.domain.ScrapedEvent;
import com.atlasevents.scraper.scraping.infrastructure.EventbriteScraper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.batch.core.*;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
class ScraperJobIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Container
    @ServiceConnection
    static RabbitMQContainer rabbitmq = new RabbitMQContainer("rabbitmq:3-management-alpine");

    @MockBean
    private EventbriteScraper eventbriteScraper;

    @Autowired
    private JobLauncher jobLauncher;

    @Autowired
    private Job scraperJob;

    @BeforeEach
    void setUp() throws Exception {
        when(eventbriteScraper.getSourceName()).thenReturn("eventbrite");
        when(eventbriteScraper.getTargetUrl()).thenReturn("https://www.eventbrite.com");
        when(eventbriteScraper.scrape()).thenReturn(List.of(
                sampleEvent("casablanca"),
                sampleEvent("rabat"),
                sampleEvent("marrakech")
        ));
    }

    @Test
    void scraperJob_completesSuccessfully() throws Exception {
        JobParameters params = new JobParametersBuilder()
                .addLong("run.id", System.currentTimeMillis())
                .toJobParameters();

        JobExecution execution = jobLauncher.run(scraperJob, params);

        assertThat(execution.getStatus()).isEqualTo(BatchStatus.COMPLETED);
        assertThat(execution.getStepExecutions()).hasSize(1);
    }

    @Test
    void scraperJob_eventbriteStepCompleted() throws Exception {
        JobExecution execution = jobLauncher.run(scraperJob, new JobParametersBuilder()
                .addLong("run.id", System.currentTimeMillis())
                .toJobParameters());

        assertThat(execution.getStepExecutions())
                .extracting(StepExecution::getStepName)
                .containsExactlyInAnyOrder("eventbriteStep");

        assertThat(execution.getStepExecutions())
                .allMatch(step -> step.getStatus() == BatchStatus.COMPLETED);
    }

    private static ScrapedEvent sampleEvent(String city) {
        return new ScrapedEvent(
                Map.of("fr", "Test Event " + city),
                ZonedDateTime.now(ZoneId.of("Africa/Casablanca")).plusDays(7),
                null, city, null, "technology",
                "https://www.eventbrite.com/e/" + city, "eventbrite", null, null, false
        );
    }
}
