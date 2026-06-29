package com.atlasevents.api.ical.application;

import com.atlasevents.api.event.domain.Event;
import com.atlasevents.api.event.domain.EventRepository;
import net.fortuna.ical4j.model.Calendar;
import net.fortuna.ical4j.model.DateTime;
import net.fortuna.ical4j.model.TimeZone;
import net.fortuna.ical4j.model.TimeZoneRegistry;
import net.fortuna.ical4j.model.TimeZoneRegistryFactory;
import net.fortuna.ical4j.model.component.VEvent;
import net.fortuna.ical4j.model.component.VTimeZone;
import net.fortuna.ical4j.model.property.CalScale;
import net.fortuna.ical4j.model.property.Description;
import net.fortuna.ical4j.model.property.Location;
import net.fortuna.ical4j.model.property.ProdId;
import net.fortuna.ical4j.model.property.Uid;
import net.fortuna.ical4j.model.property.Url;
import net.fortuna.ical4j.model.property.Version;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Date;
import java.util.List;

@Service
public class IcalService {

    private static final ZoneId MOROCCO = ZoneId.of("Africa/Casablanca");
    private static final TimeZoneRegistry TZ_REGISTRY = TimeZoneRegistryFactory.getInstance().createRegistry();
    private static final TimeZone ICAL_TZ = TZ_REGISTRY.getTimeZone("Africa/Casablanca");

    private final EventRepository eventRepository;

    public IcalService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public String buildCalendar(String city, String category) {
        var page = eventRepository.findActive(city, category, ZonedDateTime.now(MOROCCO), null, 0, 200);

        Calendar calendar = new Calendar();
        calendar.getProperties().add(new ProdId("-//Atlas Events//Atlas Events//EN"));
        calendar.getProperties().add(Version.VERSION_2_0);
        calendar.getProperties().add(CalScale.GREGORIAN);

        VTimeZone vTimeZone = ICAL_TZ.getVTimeZone();
        calendar.getComponents().add(vTimeZone);

        for (Event event : page.events()) {
            String title = event.title().getOrDefault("fr", event.title().values().stream().findFirst().orElse("Event"));
            Date start = toDate(event.startDate());
            Date end = event.endDate() != null ? toDate(event.endDate()) : toDate(event.startDate().plusHours(2));

            VEvent vEvent = new VEvent(new DateTime(start), new DateTime(end), title);
            vEvent.getProperties().add(new Uid(event.id().toString()));

            String desc = event.description() != null
                    ? event.description().getOrDefault("fr", event.description().values().stream().findFirst().orElse(""))
                    : "";
            if (!desc.isBlank()) {
                vEvent.getProperties().add(new Description(desc));
            }

            String location = buildLocation(event);
            if (!location.isBlank()) {
                vEvent.getProperties().add(new Location(location));
            }

            if (event.registrationUrl() != null && !event.registrationUrl().isBlank()) {
                try {
                    vEvent.getProperties().add(new Url(URI.create(event.registrationUrl())));
                } catch (IllegalArgumentException ignored) {
                }
            }

            calendar.getComponents().add(vEvent);
        }

        return calendar.toString();
    }

    private static Date toDate(ZonedDateTime zdt) {
        return Date.from(zdt.withZoneSameInstant(MOROCCO).toInstant());
    }

    private static String buildLocation(Event event) {
        StringBuilder sb = new StringBuilder();
        if (event.venue() != null && !event.venue().isBlank()) sb.append(event.venue());
        if (event.city() != null && !event.city().isBlank()) {
            if (!sb.isEmpty()) sb.append(", ");
            sb.append(event.city());
        }
        return sb.toString();
    }
}
