package com.atlasevents.scraper.scraping.infrastructure;

import com.atlasevents.scraper.scraping.domain.EventScraper;
import com.atlasevents.scraper.scraping.domain.ScrapedEvent;
import com.atlasevents.scraper.shared.config.AppProperties;
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
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
public class PcnsScraper implements EventScraper {

    private static final Logger log = LoggerFactory.getLogger(PcnsScraper.class);
    private static final String SOURCE_NAME = "pcns";
    private static final ZoneId MOROCCO = ZoneId.of("Africa/Casablanca");
    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.FRENCH);

    private final AppProperties properties;
    private final RobotsChecker robotsChecker;

    public PcnsScraper(AppProperties properties, RobotsChecker robotsChecker) {
        this.properties = properties;
        this.robotsChecker = robotsChecker;
    }

    @Override
    public String getSourceName() {
        return SOURCE_NAME;
    }

    @Override
    public String getTargetUrl() {
        return properties.pcnsUrl();
    }

    @Override
    public List<ScrapedEvent> scrape() throws IOException {
        String url = properties.pcnsUrl();
        if (properties.robotsCheckEnabled() && !robotsChecker.isAllowed(url, properties.httpTimeoutMs())) {
            log.warn("disallowed by robots.txt: {}", url);
            return List.of();
        }
        log.info("Scraping PCNS: {}", url);
        Document doc = Jsoup.connect(url)
                .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
                .header("Accept-Language", "fr-MA,fr;q=0.9,en;q=0.8")
                .timeout(properties.httpTimeoutMs()).get();
        return parseDocument(doc, url);
    }

    @Override
    public List<ScrapedEvent> parseDocument(Document doc, String baseUrl) {
        List<ScrapedEvent> events = new ArrayList<>();
        for (Element article : doc.select("article.pcns-event")) {
            try {
                events.add(parseArticle(article, baseUrl));
            } catch (Exception e) {
                log.debug("Skipping unparseable PCNS event: {}", e.getMessage());
            }
        }
        log.info("PCNS: parsed {} events", events.size());
        return events;
    }

    private ScrapedEvent parseArticle(Element article, String baseUrl) {
        String title = article.select(".pcns-title a").text().trim();
        String href = article.select(".pcns-title a").attr("abs:href");
        if (href.isEmpty()) href = baseUrl;

        String dateText = article.select(".pcns-date").text().trim();
        ZonedDateTime startDate = parseDate(dateText);

        String location = article.select(".pcns-location").text().trim();
        String city = extractCity(location);

        String category = article.select(".pcns-category").text().trim();
        if (category.isEmpty()) category = "other";

        return new ScrapedEvent(
                Map.of("fr", title),
                startDate,
                null,
                city,
                location,
                normalizeCategory(category),
                href,
                SOURCE_NAME,
                null,
                href,
                false
        );
    }

    private ZonedDateTime parseDate(String dateText) {
        try {
            LocalDate date = LocalDate.parse(dateText, DATE_FORMAT);
            return date.atStartOfDay(MOROCCO);
        } catch (DateTimeParseException e) {
            log.debug("Could not parse date '{}', defaulting to now+30d", dateText);
            return ZonedDateTime.now(MOROCCO).plusDays(30);
        }
    }

    private String extractCity(String location) {
        if (location == null || location.isBlank()) return "morocco";
        String[] parts = location.split(",");
        return parts[0].trim().toLowerCase();
    }

    private String normalizeCategory(String category) {
        return switch (category.toLowerCase()) {
            case "informatique", "technologie", "ia", "intelligence artificielle" -> "technology";
            case "mathématiques", "physique", "chimie", "biologie", "sciences" -> "science";
            case "économie", "gestion", "finance" -> "business";
            case "droit", "politique", "diplomatie" -> "policy";
            default -> "other";
        };
    }
}
