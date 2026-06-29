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

class PcnsScraperTest {

    private PcnsScraper scraper;
    private AppProperties props;
    private RobotsChecker robotsChecker;

    @BeforeEach
    void setUp() {
        props = mock(AppProperties.class);
        when(props.pcnsUrl()).thenReturn("https://www.pcns.ma/evenements.aspx");
        when(props.httpTimeoutMs()).thenReturn(5000);
        when(props.robotsCheckEnabled()).thenReturn(false);

        robotsChecker = mock(RobotsChecker.class);
        scraper = new PcnsScraper(props, robotsChecker);
    }

    @Test
    void parseDocument_fixtureHtml_returnsAllEvents() throws Exception {
        Document doc = loadFixture("fixtures/pcns.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.pcns.ma/evenements.aspx");

        assertThat(events).hasSize(3);
    }

    @Test
    void parseDocument_firstEvent_hasCorrectTitle() throws Exception {
        Document doc = loadFixture("fixtures/pcns.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.pcns.ma/evenements.aspx");

        assertThat(events.get(0).title().get("fr"))
                .contains("Conférence Internationale de Mathématiques Appliquées 2026");
    }

    @Test
    void parseDocument_firstEvent_hasCasablancaCity() throws Exception {
        Document doc = loadFixture("fixtures/pcns.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.pcns.ma/evenements.aspx");

        assertThat(events.get(0).city()).isEqualTo("casablanca");
    }

    @Test
    void parseDocument_firstEvent_hasScienceCategory() throws Exception {
        Document doc = loadFixture("fixtures/pcns.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.pcns.ma/evenements.aspx");

        assertThat(events.get(0).category()).isEqualTo("science");
    }

    @Test
    void parseDocument_allEvents_haveSourceName() throws Exception {
        Document doc = loadFixture("fixtures/pcns.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.pcns.ma/evenements.aspx");

        assertThat(events).allMatch(e -> "pcns".equals(e.sourceName()));
    }

    @Test
    void parseDocument_allEvents_haveStartDate() throws Exception {
        Document doc = loadFixture("fixtures/pcns.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.pcns.ma/evenements.aspx");

        assertThat(events).allMatch(e -> e.startDate() != null);
    }

    @Test
    void parseDocument_thirdEvent_hasTechnologyCategory() throws Exception {
        Document doc = loadFixture("fixtures/pcns.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.pcns.ma/evenements.aspx");

        assertThat(events.get(2).category()).isEqualTo("technology");
        assertThat(events.get(2).city()).isEqualTo("marrakech");
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
                "<article class=\"pcns-event\">" +
                "<h3 class=\"pcns-title\"><a href=\"/event\">Test Event</a></h3>" +
                "<div class=\"pcns-meta\">" +
                "<span class=\"pcns-date\">not-a-date</span>" +
                "<span class=\"pcns-location\">Casablanca</span>" +
                "<span class=\"pcns-category\">Sciences</span>" +
                "</div></article></body></html>";
        Document doc = Jsoup.parse(html);

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.pcns.ma");

        assertThat(events).hasSize(1);
        assertThat(events.get(0).startDate()).isAfter(ZonedDateTime.now());
    }

    @Test
    void parseDocument_emptyCategory_returnsOther() {
        String html = "<html><body>" +
                "<article class=\"pcns-event\">" +
                "<h3 class=\"pcns-title\"><a href=\"/event\">Test Event</a></h3>" +
                "<div class=\"pcns-meta\">" +
                "<span class=\"pcns-date\">15/07/2026</span>" +
                "<span class=\"pcns-location\">Rabat</span>" +
                "<span class=\"pcns-category\"></span>" +
                "</div></article></body></html>";
        Document doc = Jsoup.parse(html);

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.pcns.ma");

        assertThat(events).hasSize(1);
        assertThat(events.get(0).category()).isEqualTo("other");
    }

    @Test
    void parseDocument_emptyHtml_returnsEmptyList() {
        Document doc = Jsoup.parse("<html><body></body></html>");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.pcns.ma/evenements.aspx");

        assertThat(events).isEmpty();
    }

    private Document loadFixture(String path) throws Exception {
        try (InputStream in = getClass().getClassLoader().getResourceAsStream(path)) {
            assert in != null : "Fixture not found: " + path;
            String html = new String(in.readAllBytes(), StandardCharsets.UTF_8);
            return Jsoup.parse(html, "https://www.pcns.ma");
        }
    }
}
