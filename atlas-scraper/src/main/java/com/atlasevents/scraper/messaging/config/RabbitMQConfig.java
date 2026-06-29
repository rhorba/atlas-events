package com.atlasevents.scraper.messaging.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE = "events";
    public static final String QUEUE_SCRAPED = "events.scraped";
    public static final String QUEUE_RESULTS = "scrape.results";
    public static final String QUEUE_TRIGGER = "scrape.trigger";
    public static final String QUEUE_DEAD = "events.dead";

    @Bean
    public DirectExchange eventsExchange() {
        return ExchangeBuilder.directExchange(EXCHANGE).durable(true).build();
    }

    @Bean
    public Queue eventsScrapedQueue() {
        return QueueBuilder.durable(QUEUE_SCRAPED)
                .withArgument("x-dead-letter-exchange", QUEUE_DEAD)
                .build();
    }

    @Bean
    public Queue scrapeResultsQueue() {
        return QueueBuilder.durable(QUEUE_RESULTS)
                .withArgument("x-dead-letter-exchange", QUEUE_DEAD)
                .build();
    }

    @Bean
    public Queue scrapeTriggerQueue() {
        return QueueBuilder.durable(QUEUE_TRIGGER)
                .withArgument("x-dead-letter-exchange", QUEUE_DEAD)
                .build();
    }

    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable(QUEUE_DEAD).build();
    }

    @Bean
    public Binding eventsScrapedBinding(Queue eventsScrapedQueue, DirectExchange eventsExchange) {
        return BindingBuilder.bind(eventsScrapedQueue).to(eventsExchange).with(QUEUE_SCRAPED);
    }

    @Bean
    public Binding scrapeResultsBinding(Queue scrapeResultsQueue, DirectExchange eventsExchange) {
        return BindingBuilder.bind(scrapeResultsQueue).to(eventsExchange).with(QUEUE_RESULTS);
    }

    @Bean
    public Binding scrapeTriggerBinding(Queue scrapeTriggerQueue, DirectExchange eventsExchange) {
        return BindingBuilder.bind(scrapeTriggerQueue).to(eventsExchange).with(QUEUE_TRIGGER);
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
                                          Jackson2JsonMessageConverter messageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter);
        return template;
    }
}
