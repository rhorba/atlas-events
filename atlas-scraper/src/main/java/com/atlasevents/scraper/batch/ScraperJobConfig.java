package com.atlasevents.scraper.batch;

import com.atlasevents.scraper.scraping.infrastructure.EventbriteScraper;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

@Configuration
public class ScraperJobConfig {

    @Bean
    public ScrapeTasklet eventbriteTasklet(EventbriteScraper scraper, RabbitTemplate rabbitTemplate,
                                           MeterRegistry meterRegistry) {
        return new ScrapeTasklet(scraper, rabbitTemplate, meterRegistry);
    }

    @Bean
    public Step eventbriteStep(JobRepository jobRepository,
                               PlatformTransactionManager transactionManager,
                               ScrapeTasklet eventbriteTasklet) {
        return new StepBuilder("eventbriteStep", jobRepository)
                .tasklet(eventbriteTasklet, transactionManager)
                .build();
    }

    @Bean
    public Job scraperJob(JobRepository jobRepository, Step eventbriteStep) {
        return new JobBuilder("scraperJob", jobRepository)
                .start(eventbriteStep)
                .build();
    }
}
