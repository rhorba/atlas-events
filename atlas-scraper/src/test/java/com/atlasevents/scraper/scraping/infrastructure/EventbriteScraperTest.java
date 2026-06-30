package com.atlasevents.scraper.scraping.infrastructure;

import com.atlasevents.scraper.scraping.domain.ScrapedEvent;
import com.atlasevents.scraper.shared.config.AppProperties;
import com.sun.net.httpserver.HttpServer;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class EventbriteScraperTest {

    private EventbriteScraper scraper;
    private AppProperties props;
    private HttpServer server;

    @BeforeEach
    void setUp() {
        props = mock(AppProperties.class);
        when(props.eventbriteBaseUrl()).thenReturn("https://www.eventbrite.com");
        when(props.httpTimeoutMs()).thenReturn(5000);
        when(props.robotsCheckEnabled()).thenReturn(false);
        scraper = new EventbriteScraper(props);
    }

    @AfterEach
    void tearDown() {
        if (server != null) server.stop(0);
    }

    @Test
    void scrape_acrossCategoryPages_dedupesAndSkipsBadPages() throws Exception {
        server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        server.createContext("/d/morocco/tech--events/", exchange -> respond(exchange, 200,
                buildRawHtml("Atlas Tech Summit", "2026-10-10", "Science & Tech", "Casablanca", "casablanca")));
        server.createContext("/d/morocco/business--events/", exchange -> respond(exchange, 404, "not found"));
        server.createContext("/d/morocco/all-events/", exchange -> respond(exchange, 200,
                "<html><head></head><body><script>var x = 1;</script></body></html>"));
        server.start();

        when(props.eventbriteBaseUrl()).thenReturn("http://localhost:" + server.getAddress().getPort());

        List<ScrapedEvent> events = scraper.scrape();

        assertThat(events).hasSize(1);
        assertThat(events.get(0).title().get("fr")).isEqualTo("Atlas Tech Summit");
    }

    private void respond(com.sun.net.httpserver.HttpExchange exchange, int status, String body) throws java.io.IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "text/html; charset=utf-8");
        exchange.sendResponseHeaders(status, bytes.length);
        try (var os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    @Test
    void parseDocument_fixtureHtml_returnsAllEvents() throws Exception {
        Document doc = loadFixture("fixtures/eventbrite.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.eventbrite.com/d/morocco/tech--events/");

        assertThat(events).hasSize(3);
    }

    @Test
    void parseDocument_firstEvent_hasCorrectTitle() throws Exception {
        Document doc = loadFixture("fixtures/eventbrite.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.eventbrite.com/d/morocco/tech--events/");

        assertThat(events.get(0).title().get("fr")).isEqualTo("Atlas Tech Summit 2026");
    }

    @Test
    void parseDocument_firstEvent_hasCasablancaCity() throws Exception {
        Document doc = loadFixture("fixtures/eventbrite.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.eventbrite.com/d/morocco/tech--events/");

        assertThat(events.get(0).city()).isEqualTo("casablanca");
    }

    @Test
    void parseDocument_firstEvent_hasTechnologyCategory() throws Exception {
        Document doc = loadFixture("fixtures/eventbrite.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.eventbrite.com/d/morocco/tech--events/");

        assertThat(events.get(0).category()).isEqualTo("technology");
    }

    @Test
    void parseDocument_secondEvent_hasBusinessCategory() throws Exception {
        Document doc = loadFixture("fixtures/eventbrite.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.eventbrite.com/d/morocco/tech--events/");

        assertThat(events.get(1).category()).isEqualTo("business");
        assertThat(events.get(1).city()).isEqualTo("rabat");
    }

    @Test
    void parseDocument_allEvents_haveSourceName() throws Exception {
        Document doc = loadFixture("fixtures/eventbrite.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.eventbrite.com/d/morocco/tech--events/");

        assertThat(events).allMatch(e -> "eventbrite".equals(e.sourceName()));
    }

    @Test
    void parseDocument_allEvents_haveStartDate() throws Exception {
        Document doc = loadFixture("fixtures/eventbrite.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.eventbrite.com/d/morocco/tech--events/");

        assertThat(events).allMatch(e -> e.startDate() != null);
    }

    @Test
    void parseDocument_onlineEvent_fallsBackToCountyCity() throws Exception {
        Document doc = loadFixture("fixtures/eventbrite.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.eventbrite.com/d/morocco/tech--events/");
        // Third event has null primary_venue and is_online_event=true → city falls back to county (Marrakech)
        assertThat(events.get(2).city()).isEqualTo("marrakech");
    }

    @Test
    void parseDocument_allEvents_haveEventbriteUrl() throws Exception {
        Document doc = loadFixture("fixtures/eventbrite.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.eventbrite.com/d/morocco/tech--events/");

        assertThat(events).allMatch(e -> e.sourceUrl().startsWith("https://www.eventbrite.com/e/"));
    }

    @Test
    void parseDocument_noServerData_returnsEmpty() {
        Document emptyDoc = Jsoup.parse("<html><body><script>var x = 1;</script></body></html>");

        List<ScrapedEvent> events = scraper.parseDocument(emptyDoc, "https://www.eventbrite.com");

        assertThat(events).isEmpty();
    }

    @Test
    void parseDocument_startupCategory_recognized() {
        Document doc = buildDocWithEvent("Morocco Startup Weekend", "2026-10-10", "startup", "Agadir", "agadir");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.eventbrite.com/d/morocco/business--events/");

        assertThat(events).hasSize(1);
        assertThat(events.get(0).category()).isEqualTo("startup");
    }

    @Test
    void parseDocument_conferenceCategory_recognized() {
        Document doc = buildDocWithEvent("Dev Conference Marrakech", "2026-11-05", "Conference", "Marrakech", "marrakech");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.eventbrite.com/d/morocco/all-events/");

        assertThat(events).hasSize(1);
        assertThat(events.get(0).category()).isEqualTo("conference");
    }

    @Test
    void parseDocument_academicCategory_recognized() {
        Document doc = buildDocWithEvent("Academic Symposium Fes", "2026-12-01", "Education", "Fes", "fes");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.eventbrite.com/d/morocco/all-events/");

        assertThat(events).hasSize(1);
        assertThat(events.get(0).category()).isEqualTo("academic");
    }

    @Test
    void parseDocument_unknownCategory_returnsOther() {
        Document doc = buildDocWithEvent("Yoga Retreat Morocco", "2026-09-20", "Health & Wellness", "Essaouira", "essaouira");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.eventbrite.com/d/morocco/all-events/");

        assertThat(events).hasSize(1);
        assertThat(events.get(0).category()).isEqualTo("other");
    }

    @Test
    void parseDocument_missingStartDate_usesFutureDefault() {
        String html = buildRawHtml("Missing Date Event", null, "Science & Tech", "Casablanca", "casablanca");
        Document doc = Jsoup.parse(html, "https://www.eventbrite.com");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.eventbrite.com/d/morocco/tech--events/");

        assertThat(events).hasSize(1);
        assertThat(events.get(0).startDate()).isAfter(java.time.ZonedDateTime.now());
    }

    @Test
    void parseDocument_nullVenueNoCounty_defaultsMorocco() {
        // Event with null primary_venue and no county location entry
        String json = "{\"search_data\":{\"events\":{\"pagination\":{\"object_count\":1},\"results\":[" +
                "{\"id\":\"9001\",\"name\":\"No Venue Event\",\"url\":\"https://www.eventbrite.com/e/no-venue-9001\"," +
                "\"start_date\":\"2026-09-25\",\"end_date\":null,\"is_online_event\":false," +
                "\"primary_venue\":null,\"locations\":[{\"type\":\"country\",\"id\":\"2\",\"name\":\"Morocco\"}]," +
                "\"tags\":[{\"prefix\":\"EventbriteCategory\",\"display_name\":\"Science & Tech\"}]," +
                "\"summary\":\"Event with no venue\"}]}}}";
        String html = "<html><head></head><body><script>window.__SERVER_DATA__ = " + json + ";</script></body></html>";
        Document doc = Jsoup.parse(html, "https://www.eventbrite.com");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.eventbrite.com/d/morocco/all-events/");

        assertThat(events).hasSize(1);
        assertThat(events.get(0).city()).isEqualTo("morocco");
    }

    @Test
    void getSourceName_returnsEventbrite() {
        assertThat(scraper.getSourceName()).isEqualTo("eventbrite");
    }

    @Test
    void getTargetUrl_returnsConfiguredBaseUrl() {
        assertThat(scraper.getTargetUrl()).isEqualTo("https://www.eventbrite.com");
    }

    private Document buildDocWithEvent(String name, String startDate, String category, String city, String cityLower) {
        String html = buildRawHtml(name, startDate, category, city, cityLower);
        return Jsoup.parse(html, "https://www.eventbrite.com");
    }

    private String buildRawHtml(String name, String startDate, String category, String city, String cityLower) {
        String startDateJson = startDate != null ? "\"" + startDate + "\"" : "null";
        String json = "{\"search_data\":{\"events\":{\"pagination\":{\"object_count\":1},\"results\":[" +
                "{\"id\":\"5001\",\"name\":\"" + name + "\",\"url\":\"https://www.eventbrite.com/e/event-5001\"," +
                "\"start_date\":" + startDateJson + ",\"end_date\":null,\"is_online_event\":false," +
                "\"primary_venue\":{\"_type\":\"venue\",\"name\":\"Venue\",\"address\":{\"city\":\"" + city + "\",\"country\":\"MA\"}}," +
                "\"locations\":[{\"type\":\"county\",\"id\":\"1\",\"name\":\"" + city + "\"}]," +
                "\"tags\":[{\"prefix\":\"EventbriteCategory\",\"display_name\":\"" + category + "\"}]," +
                "\"summary\":\"Test event\"}]}}}";
        return "<html><head></head><body><script>window.__SERVER_DATA__ = " + json + ";</script></body></html>";
    }

    private Document loadFixture(String path) throws Exception {
        try (InputStream in = getClass().getClassLoader().getResourceAsStream(path)) {
            assert in != null : "Fixture not found: " + path;
            String html = new String(in.readAllBytes(), StandardCharsets.UTF_8);
            return Jsoup.parse(html, "https://www.eventbrite.com");
        }
    }
}
