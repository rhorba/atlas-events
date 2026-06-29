package com.atlasevents.api.messaging;

import com.atlasevents.api.messaging.config.RabbitMQConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class ScrapedEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(ScrapedEventConsumer.class);

    @RabbitListener(queues = RabbitMQConfig.QUEUE_SCRAPED)
    public void onScrapedEvent(ScrapedEventMessage message) {
        log.info("Received scraped event: source={} city={} title={}",
                message.sourceName(), message.city(),
                message.title() != null ? message.title().get("fr") : "");
    }
}
