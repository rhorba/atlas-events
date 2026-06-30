package com.atlasevents.scraper.messaging;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.launch.JobLauncher;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScrapeTriggerListenerTest {

    @Mock private JobLauncher jobLauncher;
    @Mock private Job scraperJob;
    @Mock private JobExecution jobExecution;

    private ScrapeTriggerListener listener;

    @BeforeEach
    void setUp() {
        listener = new ScrapeTriggerListener(jobLauncher, scraperJob);
    }

    @Test
    void onTrigger_validMessage_launchesScraperJob() throws Exception {
        when(jobLauncher.run(eq(scraperJob), any(JobParameters.class))).thenReturn(jobExecution);

        listener.onTrigger("trigger");

        verify(jobLauncher).run(eq(scraperJob), any(JobParameters.class));
    }

    @Test
    void onTrigger_jobLauncherThrows_doesNotPropagateException() throws Exception {
        when(jobLauncher.run(eq(scraperJob), any(JobParameters.class)))
                .thenThrow(new RuntimeException("batch error"));

        // Should not throw — errors are caught and logged
        listener.onTrigger("trigger");

        verify(jobLauncher).run(eq(scraperJob), any(JobParameters.class));
    }

    @Test
    void onTrigger_nullMessage_launchesScraperJob() throws Exception {
        when(jobLauncher.run(eq(scraperJob), any(JobParameters.class))).thenReturn(jobExecution);

        listener.onTrigger(null);

        verify(jobLauncher).run(eq(scraperJob), any(JobParameters.class));
    }
}
