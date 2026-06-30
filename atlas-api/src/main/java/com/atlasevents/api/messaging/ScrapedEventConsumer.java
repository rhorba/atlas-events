package com.atlasevents.api.messaging;

import com.atlasevents.api.event.domain.EventRepository;
import com.atlasevents.api.event.domain.ScrapedEventInput;
import com.atlasevents.api.messaging.config.RabbitMQConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class ScrapedEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(ScrapedEventConsumer.class);

    private final EventRepository eventRepository;

    public ScrapedEventConsumer(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    @RabbitListener(queues = RabbitMQConfig.QUEUE_SCRAPED)
    public void onScrapedEvent(ScrapedEventMessage message) {
        if (message.title() == null || message.startDate() == null || message.city() == null) {
            throw new IllegalArgumentException("Invalid scraped event: missing required fields (title/startDate/city)");
        }

        ScrapedEventInput input = new ScrapedEventInput(
                message.title(),
                message.startDate(),
                message.endDate(),
                message.city(),
                message.venue(),
                message.category(),
                message.organizerName(),
                message.registrationUrl(),
                message.isFree(),
                message.sourceUrl(),
                message.sourceName()
        );

        boolean inserted = eventRepository.saveScrapedEvent(input);
        if (inserted) {
            log.info("Inserted event: source={} city={} title={}",
                    message.sourceName(), message.city(),
                    message.title().get("fr"));
        } else {
            log.debug("Duplicate event skipped: source={} title={}",
                    message.sourceName(), message.title().get("fr"));
        }
    }
}
