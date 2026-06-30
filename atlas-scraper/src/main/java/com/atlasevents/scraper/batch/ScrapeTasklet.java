package com.atlasevents.scraper.batch;

import com.atlasevents.scraper.messaging.ScrapedEventMessage;
import com.atlasevents.scraper.messaging.ScrapeResultMessage;
import com.atlasevents.scraper.messaging.config.RabbitMQConfig;
import com.atlasevents.scraper.scraping.domain.EventScraper;
import com.atlasevents.scraper.scraping.domain.ScrapedEvent;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Objects;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.batch.core.StepContribution;
import org.springframework.batch.core.scope.context.ChunkContext;
import org.springframework.batch.core.step.tasklet.Tasklet;
import org.springframework.batch.repeat.RepeatStatus;

import java.time.ZonedDateTime;
import java.util.List;

public class ScrapeTasklet implements Tasklet {

    private static final Logger log = LoggerFactory.getLogger(ScrapeTasklet.class);

    private final EventScraper scraper;
    private final RabbitTemplate rabbitTemplate;
    private final Counter eventsFound;
    private final Counter runsTotal;
    private final Counter runsFailed;

    public ScrapeTasklet(EventScraper scraper, RabbitTemplate rabbitTemplate, MeterRegistry meterRegistry) {
        this.scraper = scraper;
        this.rabbitTemplate = rabbitTemplate;
        String source = Objects.requireNonNullElse(scraper.getSourceName(), "unknown");
        this.eventsFound = Counter.builder("atlas.scraper.events.found")
                .description("Total events found by scraper")
                .tag("source", source)
                .register(meterRegistry);
        this.runsTotal = Counter.builder("atlas.scraper.runs.total")
                .description("Total scraper job executions")
                .tag("source", source)
                .register(meterRegistry);
        this.runsFailed = Counter.builder("atlas.scraper.runs.failed")
                .description("Failed scraper job executions")
                .tag("source", source)
                .register(meterRegistry);
    }

    @Override
    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) {
        String sourceName = scraper.getSourceName();
        String url = scraper.getTargetUrl();
        int found = 0;
        boolean success = true;
        String errorMessage = null;

        runsTotal.increment();
        try {
            List<ScrapedEvent> events = scraper.scrape();
            found = events.size();
            eventsFound.increment(found);

            for (ScrapedEvent event : events) {
                ScrapedEventMessage message = toMessage(event);
                rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, RabbitMQConfig.QUEUE_SCRAPED, message);
            }

            log.info("Scrape complete: source={} url={} events={}", sourceName, url, found);
        } catch (Exception e) {
            success = false;
            errorMessage = e.getMessage();
            runsFailed.increment();
            log.error("Scrape failed: source={} url={} error={}", sourceName, url, errorMessage);
            contribution.getStepExecution().addFailureException(e);
        }

        ScrapeResultMessage result = new ScrapeResultMessage(
                sourceName, url, found, success, errorMessage, ZonedDateTime.now());
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, RabbitMQConfig.QUEUE_RESULTS, result);

        return RepeatStatus.FINISHED;
    }

    private ScrapedEventMessage toMessage(ScrapedEvent e) {
        return new ScrapedEventMessage(
                e.title(), e.startDate(), e.endDate(), e.city(), e.venue(),
                e.category(), e.sourceUrl(), e.sourceName(), e.organizerName(),
                e.registrationUrl(), e.isFree()
        );
    }
}
