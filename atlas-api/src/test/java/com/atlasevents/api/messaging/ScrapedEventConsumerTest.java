package com.atlasevents.api.messaging;

import com.atlasevents.api.event.domain.EventRepository;
import com.atlasevents.api.event.domain.ScrapedEventInput;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.ZonedDateTime;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScrapedEventConsumerTest {

    @Mock
    private EventRepository eventRepository;

    private ScrapedEventConsumer consumer;

    @BeforeEach
    void setUp() {
        consumer = new ScrapedEventConsumer(eventRepository);
    }

    @Test
    void onScrapedEvent_validMessage_savesEvent() {
        ScrapedEventMessage message = validMessage();
        when(eventRepository.saveScrapedEvent(any())).thenReturn(true);

        consumer.onScrapedEvent(message);

        verify(eventRepository).saveScrapedEvent(any(ScrapedEventInput.class));
    }

    @Test
    void onScrapedEvent_validMessage_mapsFieldsCorrectly() {
        ScrapedEventMessage message = validMessage();
        when(eventRepository.saveScrapedEvent(any())).thenReturn(true);
        ArgumentCaptor<ScrapedEventInput> captor = ArgumentCaptor.forClass(ScrapedEventInput.class);

        consumer.onScrapedEvent(message);

        verify(eventRepository).saveScrapedEvent(captor.capture());
        ScrapedEventInput input = captor.getValue();
        assertThat(input.city()).isEqualTo("casablanca");
        assertThat(input.category()).isEqualTo("technology");
        assertThat(input.sourceName()).isEqualTo("10times");
        assertThat(input.runId()).isEqualTo(message.runId());
    }

    @Test
    void onScrapedEvent_duplicateEvent_noException() {
        when(eventRepository.saveScrapedEvent(any())).thenReturn(false);

        consumer.onScrapedEvent(validMessage());

        verify(eventRepository).saveScrapedEvent(any());
    }

    @Test
    void onScrapedEvent_nullTitle_throwsIllegalArgument() {
        ScrapedEventMessage message = new ScrapedEventMessage(
                null, ZonedDateTime.now().plusDays(7), null,
                "casablanca", null, "technology",
                "https://10times.com/event", "10times", null, null, false, UUID.randomUUID());

        assertThatThrownBy(() -> consumer.onScrapedEvent(message))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("missing required fields");
    }

    @Test
    void onScrapedEvent_nullStartDate_throwsIllegalArgument() {
        ScrapedEventMessage message = new ScrapedEventMessage(
                Map.of("fr", "Test"), null, null,
                "casablanca", null, "technology",
                "https://10times.com/event", "10times", null, null, false, UUID.randomUUID());

        assertThatThrownBy(() -> consumer.onScrapedEvent(message))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void onScrapedEvent_nullCity_throwsIllegalArgument() {
        ScrapedEventMessage message = new ScrapedEventMessage(
                Map.of("fr", "Test"), ZonedDateTime.now().plusDays(7), null,
                null, null, "technology",
                "https://10times.com/event", "10times", null, null, false, UUID.randomUUID());

        assertThatThrownBy(() -> consumer.onScrapedEvent(message))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private ScrapedEventMessage validMessage() {
        return new ScrapedEventMessage(
                Map.of("fr", "Tech Summit Casablanca"),
                ZonedDateTime.now().plusDays(7),
                null,
                "casablanca",
                "CCIS",
                "technology",
                "https://10times.com/tech-summit",
                "10times",
                null,
                "https://10times.com/tech-summit/register",
                false,
                UUID.randomUUID());
    }
}
