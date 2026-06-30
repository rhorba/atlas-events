package com.atlasevents.scraper.scraping.infrastructure;

import com.atlasevents.scraper.scraping.domain.ScrapedEvent;
import com.atlasevents.scraper.shared.config.AppProperties;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.ZonedDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TentimesScraperTest {

    private TentimesScraper scraper;
    private AppProperties props;
    private RobotsChecker robotsChecker;

    @BeforeEach
    void setUp() {
        props = mock(AppProperties.class);
        when(props.tentimesUrl()).thenReturn("https://10times.com/morocco");
        when(props.httpTimeoutMs()).thenReturn(5000);
        when(props.robotsCheckEnabled()).thenReturn(false);

        robotsChecker = mock(RobotsChecker.class);
        scraper = new TentimesScraper(props, robotsChecker);
    }

    @Test
    void parseDocument_fixtureHtml_returnsAllEvents() throws Exception {
        Document doc = loadFixture("fixtures/10times.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://10times.com/morocco");

        assertThat(events).hasSize(4);
    }

    @Test
    void parseDocument_firstEvent_hasCorrectTitle() throws Exception {
        Document doc = loadFixture("fixtures/10times.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://10times.com/morocco");

        assertThat(events.get(0).title().get("fr")).isEqualTo("Tech Summit Casablanca 2026");
    }

    @Test
    void parseDocument_firstEvent_hasCasablancaCity() throws Exception {
        Document doc = loadFixture("fixtures/10times.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://10times.com/morocco");

        assertThat(events.get(0).city()).isEqualTo("casablanca");
    }

    @Test
    void parseDocument_firstEvent_hasTechnologyCategory() throws Exception {
        Document doc = loadFixture("fixtures/10times.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://10times.com/morocco");

        assertThat(events.get(0).category()).isEqualTo("technology");
    }

    @Test
    void parseDocument_allEvents_haveSourceName() throws Exception {
        Document doc = loadFixture("fixtures/10times.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://10times.com/morocco");

        assertThat(events).allMatch(e -> "10times".equals(e.sourceName()));
    }

    @Test
    void parseDocument_allEvents_haveStartDate() throws Exception {
        Document doc = loadFixture("fixtures/10times.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://10times.com/morocco");

        assertThat(events).allMatch(e -> e.startDate() != null);
    }

    @Test
    void parseDocument_startupEvent_hasStartupCategory() throws Exception {
        Document doc = loadFixture("fixtures/10times.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://10times.com/morocco");
        ScrapedEvent startupEvent = events.get(1);

        assertThat(startupEvent.category()).isEqualTo("startup");
        assertThat(startupEvent.city()).isEqualTo("rabat");
    }

    @Test
    void parseDocument_emptyHtml_returnsEmptyList() {
        Document emptyDoc = Jsoup.parse("<html><body></body></html>");

        List<ScrapedEvent> events = scraper.parseDocument(emptyDoc, "https://10times.com/morocco");

        assertThat(events).isEmpty();
    }

    @Test
    void scrape_robotsCheckDisallowed_returnsEmpty() throws Exception {
        when(props.robotsCheckEnabled()).thenReturn(true);
        when(robotsChecker.isAllowed(any(), anyInt())).thenReturn(false);

        List<ScrapedEvent> events = scraper.scrape();

        assertThat(events).isEmpty();
    }

    @Test
    void parseDocument_invalidDate_returnsEventWithFutureDate() {
        String html = "<html><body>" +
                "<div class=\"event-item\">" +
                "<h2 class=\"event-title\"><a href=\"/event\">Bad Date Event</a></h2>" +
                "<span class=\"event-date\">not-a-date</span>" +
                "<span class=\"event-location\">Casablanca, Morocco</span>" +
                "<span class=\"event-category\">Technology</span>" +
                "</div></body></html>";
        Document doc = Jsoup.parse(html);

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://10times.com");

        assertThat(events).hasSize(1);
        assertThat(events.get(0).startDate()).isAfter(ZonedDateTime.now());
    }

    @Test
    void parseDocument_missingHref_usesBaseUrl() {
        String html = "<html><body>" +
                "<div class=\"event-item\">" +
                "<h2 class=\"event-title\"><a>No Link Event</a></h2>" +
                "<span class=\"event-date\">15 Jul, 2026</span>" +
                "<span class=\"event-location\">Rabat</span>" +
                "<span class=\"event-category\">Business</span>" +
                "</div></body></html>";
        Document doc = Jsoup.parse(html, "https://10times.com");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://10times.com");

        assertThat(events).hasSize(1);
        assertThat(events.get(0).sourceUrl()).isEqualTo("https://10times.com");
    }

    @Test
    void parseDocument_emptyCategory_returnsOther() {
        String html = "<html><body>" +
                "<div class=\"event-item\">" +
                "<h2 class=\"event-title\"><a href=\"/event\">No Cat Event</a></h2>" +
                "<span class=\"event-date\">15 Jul, 2026</span>" +
                "<span class=\"event-location\">Marrakech</span>" +
                "<span class=\"event-category\"></span>" +
                "</div></body></html>";
        Document doc = Jsoup.parse(html);

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://10times.com");

        assertThat(events).hasSize(1);
        assertThat(events.get(0).category()).isEqualTo("other");
    }

    @Test
    void parseDocument_scienceCategory_returnsScience() {
        String html = "<html><body>" +
                "<div class=\"event-item\">" +
                "<h2 class=\"event-title\"><a href=\"/event\">Science Event</a></h2>" +
                "<span class=\"event-date\">10 Aug, 2026</span>" +
                "<span class=\"event-location\">Fes</span>" +
                "<span class=\"event-category\">Science</span>" +
                "</div></body></html>";
        Document doc = Jsoup.parse(html);

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://10times.com");

        assertThat(events).hasSize(1);
        assertThat(events.get(0).category()).isEqualTo("science");
    }

    private Document loadFixture(String path) throws Exception {
        try (InputStream in = getClass().getClassLoader().getResourceAsStream(path)) {
            assert in != null : "Fixture not found: " + path;
            String html = new String(in.readAllBytes(), StandardCharsets.UTF_8);
            return Jsoup.parse(html, "https://10times.com");
        }
    }
}
