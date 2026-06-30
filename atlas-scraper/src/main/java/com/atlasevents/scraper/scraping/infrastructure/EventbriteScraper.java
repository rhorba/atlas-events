package com.atlasevents.scraper.scraping.infrastructure;

import com.atlasevents.scraper.scraping.domain.EventScraper;
import com.atlasevents.scraper.scraping.domain.ScrapedEvent;
import com.atlasevents.scraper.shared.config.AppProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;

@Component
public class EventbriteScraper implements EventScraper {

    private static final Logger log = LoggerFactory.getLogger(EventbriteScraper.class);
    private static final String SOURCE_NAME = "eventbrite";
    private static final ZoneId MOROCCO = ZoneId.of("Africa/Casablanca");
    private static final String DATA_MARKER = "window.__SERVER_DATA__ = ";

    private static final List<String> CATEGORY_PATHS = List.of(
            "/d/morocco/tech--events/",
            "/d/morocco/business--events/",
            "/d/morocco/all-events/"
    );

    private final AppProperties properties;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public EventbriteScraper(AppProperties properties) {
        this.properties = properties;
    }

    @Override
    public String getSourceName() {
        return SOURCE_NAME;
    }

    @Override
    public String getTargetUrl() {
        return properties.eventbriteBaseUrl();
    }

    @Override
    public List<ScrapedEvent> scrape() throws IOException {
        String base = properties.eventbriteBaseUrl();
        Map<String, ScrapedEvent> seen = new LinkedHashMap<>();

        for (String path : CATEGORY_PATHS) {
            String url = base + path;
            try {
                log.info("Scraping Eventbrite: {}", url);
                Document doc = Jsoup.connect(url)
                        .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
                        .header("Accept-Language", "en-US,en;q=0.9")
                        .header("Accept", "text/html,application/xhtml+xml,*/*;q=0.8")
                        .timeout(properties.httpTimeoutMs())
                        .get();
                for (ScrapedEvent event : parseDocument(doc, url)) {
                    seen.putIfAbsent(event.sourceUrl(), event);
                }
            } catch (Exception e) {
                log.warn("Failed to scrape Eventbrite {}: {}", url, e.getMessage());
            }
        }
        log.info("Eventbrite: {} unique events across all pages", seen.size());
        return new ArrayList<>(seen.values());
    }

    @Override
    public List<ScrapedEvent> parseDocument(Document doc, String baseUrl) {
        for (Element script : doc.select("script")) {
            String src = script.html();
            int markerIdx = src.indexOf(DATA_MARKER);
            if (markerIdx < 0) continue;

            String raw = src.substring(markerIdx + DATA_MARKER.length()).trim();
            if (raw.endsWith(";")) raw = raw.substring(0, raw.length() - 1);

            try {
                JsonNode root = objectMapper.readTree(raw);
                JsonNode results = root.path("search_data").path("events").path("results");
                if (!results.isArray() || results.isEmpty()) continue;

                List<ScrapedEvent> events = new ArrayList<>();
                for (JsonNode e : results) {
                    try {
                        events.add(parseEvent(e));
                    } catch (Exception ex) {
                        log.debug("Skipping Eventbrite event: {}", ex.getMessage());
                    }
                }
                log.info("Eventbrite: parsed {} events from {}", events.size(), baseUrl);
                return events;
            } catch (Exception ex) {
                log.warn("Failed to parse Eventbrite __SERVER_DATA__ from {}: {}", baseUrl, ex.getMessage());
            }
        }
        log.info("Eventbrite: no usable __SERVER_DATA__ in {}", baseUrl);
        return List.of();
    }

    private ScrapedEvent parseEvent(JsonNode e) {
        String name = e.path("name").asText("Unknown Event");
        String url = e.path("url").asText("");
        String startDateStr = e.path("start_date").asText(null);
        String endDateStr = e.path("end_date").asText(null);
        boolean isOnline = e.path("is_online_event").asBoolean(false);

        String city = extractCity(e);
        String category = extractCategory(e.path("tags"));
        ZonedDateTime startDate = parseDate(startDateStr);
        ZonedDateTime endDate = endDateStr != null ? parseDate(endDateStr) : null;

        return new ScrapedEvent(
                Map.of("fr", name),
                startDate,
                endDate,
                city,
                isOnline ? "Online" : city,
                category,
                url,
                SOURCE_NAME,
                null,
                url.isEmpty() ? null : url,
                false
        );
    }

    private String extractCity(JsonNode event) {
        JsonNode venue = event.path("primary_venue");
        if (!venue.isMissingNode() && !venue.isNull()) {
            String city = venue.path("address").path("city").asText("");
            if (!city.isEmpty()) return city.toLowerCase();
        }
        for (JsonNode loc : event.path("locations")) {
            if ("county".equals(loc.path("type").asText())) {
                return loc.path("name").asText("morocco").toLowerCase();
            }
        }
        return "morocco";
    }

    private String extractCategory(JsonNode tags) {
        for (JsonNode tag : tags) {
            if (!"EventbriteCategory".equals(tag.path("prefix").asText())) continue;
            String name = tag.path("display_name").asText("").toLowerCase();
            if (name.contains("tech") || name.contains("science")) return "technology";
            if (name.contains("startup")) return "startup";
            if (name.contains("business") || name.contains("professional")) return "business";
            if (name.contains("conference") || name.contains("summit")) return "conference";
            if (name.contains("education") || name.contains("academic")) return "academic";
        }
        return "other";
    }

    private ZonedDateTime parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return ZonedDateTime.now(MOROCCO).plusDays(30);
        }
        try {
            return LocalDate.parse(dateStr).atStartOfDay(MOROCCO);
        } catch (Exception e) {
            return ZonedDateTime.now(MOROCCO).plusDays(30);
        }
    }
}
