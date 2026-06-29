package com.atlasevents.api.event.application;

import com.atlasevents.api.event.domain.*;
import com.atlasevents.api.shared.exception.NotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    @Mock
    private EventRepository repository;

    @InjectMocks
    private EventService service;

    @Test
    void queryEvents_noFilters_callsRepositoryWithNullCityAndCategory() {
        EventPage expected = new EventPage(List.of(), 0L, 0, 20);
        when(repository.findActive(isNull(), isNull(), any(), isNull(), eq(0), eq(20)))
                .thenReturn(expected);

        EventPage result = service.queryEvents(null, null, "all", 0, 20);

        assertThat(result.total()).isEqualTo(0L);
        verify(repository).findActive(isNull(), isNull(), any(), isNull(), eq(0), eq(20));
    }

    @Test
    void queryEvents_withCityFilter_passesLowerCasedCity() {
        EventPage expected = new EventPage(List.of(), 0L, 0, 20);
        when(repository.findActive(eq("Casablanca"), isNull(), any(), isNull(), eq(0), eq(20)))
                .thenReturn(expected);

        service.queryEvents("Casablanca", null, "all", 0, 20);

        verify(repository).findActive(eq("Casablanca"), isNull(), any(), isNull(), eq(0), eq(20));
    }

    @Test
    void queryEvents_rangeWeek_passesNonNullToDate() {
        EventPage expected = new EventPage(List.of(), 0L, 0, 20);
        when(repository.findActive(any(), any(), any(), notNull(), eq(0), eq(20)))
                .thenReturn(expected);

        service.queryEvents(null, null, "week", 0, 20);

        verify(repository).findActive(isNull(), isNull(), any(),
                argThat(date -> date.isAfter(ZonedDateTime.now().plusDays(6))),
                eq(0), eq(20));
    }

    @Test
    void queryEvents_rangeMonth_passesToDateOneMonthAhead() {
        EventPage expected = new EventPage(List.of(), 0L, 0, 20);
        when(repository.findActive(any(), any(), any(), notNull(), anyInt(), anyInt()))
                .thenReturn(expected);

        service.queryEvents(null, null, "month", 0, 20);

        verify(repository).findActive(isNull(), isNull(), any(),
                argThat(date -> date.isAfter(ZonedDateTime.now().plusDays(28))),
                eq(0), eq(20));
    }

    @Test
    void queryEvents_oversizedPage_capsAtFifty() {
        EventPage expected = new EventPage(List.of(), 0L, 0, 50);
        when(repository.findActive(any(), any(), any(), any(), anyInt(), eq(50)))
                .thenReturn(expected);

        service.queryEvents(null, null, "all", 0, 999);

        verify(repository).findActive(any(), any(), any(), any(), eq(0), eq(50));
    }

    @Test
    void getEvent_knownId_returnsEvent() {
        UUID id = UUID.randomUUID();
        Event event = testEvent(id);
        when(repository.findById(id)).thenReturn(Optional.of(event));

        Event result = service.getEvent(id);

        assertThat(result.id()).isEqualTo(id);
        assertThat(result.city()).isEqualTo("casablanca");
    }

    @Test
    void getEvent_unknownId_throwsNotFoundException() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getEvent(id))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining(id.toString());
    }

    private Event testEvent(UUID id) {
        return new Event(
                id,
                Map.of("fr", "Summit Test"),
                null,
                ZonedDateTime.now().plusDays(1),
                null,
                "casablanca",
                null,
                "Test Org",
                null,
                "https://example.com",
                false,
                EventCategory.CONFERENCE,
                List.of(),
                Map.of("name", "manual", "url", "https://example.com", "isManual", true),
                EventStatus.UPCOMING,
                ZonedDateTime.now(),
                ZonedDateTime.now()
        );
    }
}
