package com.atlasevents.scraper.batch;

import com.atlasevents.scraper.scraping.infrastructure.AllConferenceAlertScraper;
import com.atlasevents.scraper.scraping.infrastructure.TentimesScraper;
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
    public ScrapeTasklet tentimesTasklet(TentimesScraper scraper, RabbitTemplate rabbitTemplate) {
        return new ScrapeTasklet(scraper, rabbitTemplate);
    }

    @Bean
    public ScrapeTasklet allConferenceAlertTasklet(AllConferenceAlertScraper scraper,
                                                    RabbitTemplate rabbitTemplate) {
        return new ScrapeTasklet(scraper, rabbitTemplate);
    }

    @Bean
    public Step tentimesStep(JobRepository jobRepository,
                              PlatformTransactionManager transactionManager,
                              ScrapeTasklet tentimesTasklet) {
        return new StepBuilder("tentimesStep", jobRepository)
                .tasklet(tentimesTasklet, transactionManager)
                .build();
    }

    @Bean
    public Step allConferenceAlertStep(JobRepository jobRepository,
                                        PlatformTransactionManager transactionManager,
                                        ScrapeTasklet allConferenceAlertTasklet) {
        return new StepBuilder("allConferenceAlertStep", jobRepository)
                .tasklet(allConferenceAlertTasklet, transactionManager)
                .build();
    }

    @Bean
    public Job scraperJob(JobRepository jobRepository,
                           Step tentimesStep,
                           Step allConferenceAlertStep) {
        return new JobBuilder("scraperJob", jobRepository)
                .start(tentimesStep)
                .next(allConferenceAlertStep)
                .build();
    }
}
