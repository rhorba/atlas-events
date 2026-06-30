package com.atlasevents.api.messaging;

import com.atlasevents.api.messaging.config.RabbitMQConfig;
import com.atlasevents.api.scrapelog.domain.ScrapeLog;
import com.atlasevents.api.scrapelog.domain.ScrapeLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.ZonedDateTime;
import java.util.UUID;

@Component
public class ScrapeResultConsumer {

    private static final Logger log = LoggerFactory.getLogger(ScrapeResultConsumer.class);

    private final ScrapeLogRepository scrapeLogRepository;

    public ScrapeResultConsumer(ScrapeLogRepository scrapeLogRepository) {
        this.scrapeLogRepository = scrapeLogRepository;
    }

    @RabbitListener(queues = RabbitMQConfig.QUEUE_RESULTS)
    public void onScrapeResult(ScrapeResultMessage message) {
        ZonedDateTime finishedAt = message.finishedAt() != null ? message.finishedAt() : ZonedDateTime.now();
        ZonedDateTime startedAt = finishedAt.minusMinutes(5);

        ScrapeLog scrapeLog = new ScrapeLog(
                UUID.randomUUID(),
                message.sourceName(),
                message.url(),
                startedAt,
                finishedAt,
                message.eventsFound(),
                0,
                message.success(),
                message.errorMessage(),
                message.runId()
        );
        scrapeLogRepository.save(scrapeLog);

        log.info("Scrape log saved: source={} found={} success={}",
                message.sourceName(), message.eventsFound(), message.success());
    }
}
