package com.atlasevents.api.messaging;

import com.atlasevents.api.scrapelog.domain.ScrapeLog;
import com.atlasevents.api.scrapelog.domain.ScrapeLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.ZonedDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ScrapeResultConsumerTest {

    @Mock
    private ScrapeLogRepository scrapeLogRepository;

    private ScrapeResultConsumer consumer;

    @BeforeEach
    void setUp() {
        consumer = new ScrapeResultConsumer(scrapeLogRepository);
    }

    @Test
    void onScrapeResult_validMessage_savesLog() {
        when(scrapeLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        ScrapeResultMessage message = new ScrapeResultMessage(
                "10times", "https://10times.com", 5, true, null, ZonedDateTime.now(), UUID.randomUUID());

        consumer.onScrapeResult(message);

        verify(scrapeLogRepository).save(any(ScrapeLog.class));
    }

    @Test
    void onScrapeResult_withFinishedAt_usesProvidedTime() {
        when(scrapeLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        ZonedDateTime finishedAt = ZonedDateTime.now().minusHours(1);
        ScrapeResultMessage message = new ScrapeResultMessage(
                "pcns", "https://pcns.ma", 3, true, null, finishedAt, UUID.randomUUID());

        consumer.onScrapeResult(message);

        ArgumentCaptor<ScrapeLog> captor = ArgumentCaptor.forClass(ScrapeLog.class);
        verify(scrapeLogRepository).save(captor.capture());
        assertThat(captor.getValue().finishedAt()).isEqualTo(finishedAt);
    }

    @Test
    void onScrapeResult_nullFinishedAt_usesCurrentTime() {
        when(scrapeLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        ZonedDateTime before = ZonedDateTime.now().minusSeconds(1);
        ScrapeResultMessage message = new ScrapeResultMessage(
                "10times", "https://10times.com", 2, true, null, null, UUID.randomUUID());

        consumer.onScrapeResult(message);

        ArgumentCaptor<ScrapeLog> captor = ArgumentCaptor.forClass(ScrapeLog.class);
        verify(scrapeLogRepository).save(captor.capture());
        assertThat(captor.getValue().finishedAt()).isAfterOrEqualTo(before);
    }

    @Test
    void onScrapeResult_failedScrape_savesWithSuccessFalse() {
        when(scrapeLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        ScrapeResultMessage message = new ScrapeResultMessage(
                "allconferencealert", "https://allconferencealert.com", 0,
                false, "Connection timeout", ZonedDateTime.now(), UUID.randomUUID());

        consumer.onScrapeResult(message);

        ArgumentCaptor<ScrapeLog> captor = ArgumentCaptor.forClass(ScrapeLog.class);
        verify(scrapeLogRepository).save(captor.capture());
        ScrapeLog log = captor.getValue();
        assertThat(log.success()).isFalse();
        assertThat(log.errorMessage()).isEqualTo("Connection timeout");
        assertThat(log.eventsFound()).isZero();
    }

    @Test
    void onScrapeResult_startsAtIsFiveMinutesBeforeFinishedAt() {
        when(scrapeLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        ZonedDateTime finishedAt = ZonedDateTime.now();
        ScrapeResultMessage message = new ScrapeResultMessage(
                "pcns", "https://pcns.ma", 10, true, null, finishedAt, UUID.randomUUID());

        consumer.onScrapeResult(message);

        ArgumentCaptor<ScrapeLog> captor = ArgumentCaptor.forClass(ScrapeLog.class);
        verify(scrapeLogRepository).save(captor.capture());
        ScrapeLog log = captor.getValue();
        assertThat(log.startedAt()).isEqualTo(finishedAt.minusMinutes(5));
    }

    @Test
    void onScrapeResult_setsSourceAndUrl() {
        when(scrapeLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        ScrapeResultMessage message = new ScrapeResultMessage(
                "pcns", "https://www.pcns.ma/evenements.aspx", 7, true, null, ZonedDateTime.now(), UUID.randomUUID());

        consumer.onScrapeResult(message);

        ArgumentCaptor<ScrapeLog> captor = ArgumentCaptor.forClass(ScrapeLog.class);
        verify(scrapeLogRepository).save(captor.capture());
        assertThat(captor.getValue().source()).isEqualTo("pcns");
        assertThat(captor.getValue().url()).isEqualTo("https://www.pcns.ma/evenements.aspx");
    }

    @Test
    void onScrapeResult_setsRunIdFromMessage() {
        when(scrapeLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        UUID runId = UUID.randomUUID();
        ScrapeResultMessage message = new ScrapeResultMessage(
                "eventbrite", "https://www.eventbrite.com", 19, true, null, ZonedDateTime.now(), runId);

        consumer.onScrapeResult(message);

        ArgumentCaptor<ScrapeLog> captor = ArgumentCaptor.forClass(ScrapeLog.class);
        verify(scrapeLogRepository).save(captor.capture());
        assertThat(captor.getValue().runId()).isEqualTo(runId);
    }
}
