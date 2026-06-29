package com.atlasevents.scraper.batch;

import com.atlasevents.scraper.messaging.ScrapedEventMessage;
import com.atlasevents.scraper.messaging.ScrapeResultMessage;
import com.atlasevents.scraper.messaging.config.RabbitMQConfig;
import com.atlasevents.scraper.scraping.domain.EventScraper;
import com.atlasevents.scraper.scraping.domain.ScrapedEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.batch.core.StepContribution;
import org.springframework.batch.core.StepExecution;
import org.springframework.batch.core.scope.context.ChunkContext;
import org.springframework.batch.repeat.RepeatStatus;

import java.io.IOException;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScrapeTaskletTest {

    @Mock private EventScraper scraper;
    @Mock private RabbitTemplate rabbitTemplate;
    @Mock private StepContribution contribution;
    @Mock private ChunkContext chunkContext;
    @Mock private StepExecution stepExecution;

    private ScrapeTasklet tasklet;

    @BeforeEach
    void setUp() {
        tasklet = new ScrapeTasklet(scraper, rabbitTemplate);
        when(scraper.getSourceName()).thenReturn("test-source");
        when(scraper.getTargetUrl()).thenReturn("https://example.com");
    }

    @Test
    void execute_emptyResult_returnsFinished() throws Exception {
        when(scraper.scrape()).thenReturn(List.of());

        RepeatStatus status = tasklet.execute(contribution, chunkContext);

        assertThat(status).isEqualTo(RepeatStatus.FINISHED);
    }

    @Test
    void execute_withEvents_publishesEventMessages() throws Exception {
        when(scraper.scrape()).thenReturn(List.of(sampleEvent()));

        tasklet.execute(contribution, chunkContext);

        verify(rabbitTemplate).convertAndSend(
                eq(RabbitMQConfig.EXCHANGE), eq(RabbitMQConfig.QUEUE_SCRAPED),
                any(ScrapedEventMessage.class));
    }

    @Test
    void execute_always_publishesResultMessage() throws Exception {
        when(scraper.scrape()).thenReturn(List.of());

        tasklet.execute(contribution, chunkContext);

        verify(rabbitTemplate).convertAndSend(
                eq(RabbitMQConfig.EXCHANGE), eq(RabbitMQConfig.QUEUE_RESULTS),
                any(ScrapeResultMessage.class));
    }

    @Test
    void execute_scraperThrowsException_publishesFailureResult() throws Exception {
        when(scraper.scrape()).thenThrow(new IOException("connection refused"));
        when(contribution.getStepExecution()).thenReturn(stepExecution);

        RepeatStatus status = tasklet.execute(contribution, chunkContext);

        assertThat(status).isEqualTo(RepeatStatus.FINISHED);
        verify(stepExecution).addFailureException(any(IOException.class));
        verify(rabbitTemplate).convertAndSend(
                eq(RabbitMQConfig.EXCHANGE), eq(RabbitMQConfig.QUEUE_RESULTS),
                any(ScrapeResultMessage.class));
    }

    private static ScrapedEvent sampleEvent() {
        return new ScrapedEvent(
                Map.of("fr", "Test Event"),
                ZonedDateTime.now(ZoneId.of("Africa/Casablanca")).plusDays(7),
                null, "casablanca", null, "technology",
                "https://example.com/event", "test-source", null, null, false
        );
    }
}
