package com.atlasevents.scraper.messaging;

import com.atlasevents.scraper.messaging.config.RabbitMQConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.stereotype.Component;

@Component
public class ScrapeTriggerListener {

    private static final Logger log = LoggerFactory.getLogger(ScrapeTriggerListener.class);

    private final JobLauncher jobLauncher;
    private final Job scraperJob;

    public ScrapeTriggerListener(JobLauncher jobLauncher, Job scraperJob) {
        this.jobLauncher = jobLauncher;
        this.scraperJob = scraperJob;
    }

    @RabbitListener(queues = RabbitMQConfig.QUEUE_TRIGGER)
    public void onTrigger(String message) {
        log.info("Scrape trigger received: {}", message);
        try {
            JobParameters params = new JobParametersBuilder()
                    .addLong("triggeredAt", System.currentTimeMillis())
                    .toJobParameters();
            jobLauncher.run(scraperJob, params);
            log.info("Scrape job launched successfully");
        } catch (Exception e) {
            log.error("Failed to launch scrape job", e);
        }
    }
}
