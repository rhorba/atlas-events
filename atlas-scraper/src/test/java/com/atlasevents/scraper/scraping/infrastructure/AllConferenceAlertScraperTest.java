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

class AllConferenceAlertScraperTest {

    private AllConferenceAlertScraper scraper;
    private AppProperties props;
    private RobotsChecker robotsChecker;

    @BeforeEach
    void setUp() {
        props = mock(AppProperties.class);
        when(props.allConferenceAlertUrl()).thenReturn("https://www.allconferencealert.com/morocco.html");
        when(props.httpTimeoutMs()).thenReturn(5000);
        when(props.robotsCheckEnabled()).thenReturn(false);

        robotsChecker = mock(RobotsChecker.class);
        scraper = new AllConferenceAlertScraper(props, robotsChecker);
    }

    @Test
    void parseDocument_fixtureHtml_returnsAllConferences() throws Exception {
        Document doc = loadFixture("fixtures/allconferencealert.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.allconferencealert.com/morocco.html");

        assertThat(events).hasSize(3);
    }

    @Test
    void parseDocument_firstConference_hasCorrectTitle() throws Exception {
        Document doc = loadFixture("fixtures/allconferencealert.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.allconferencealert.com/morocco.html");

        assertThat(events.get(0).title().get("fr"))
                .contains("International Conference on AI and Data Science Morocco 2026");
    }

    @Test
    void parseDocument_firstConference_hasCasablancaCity() throws Exception {
        Document doc = loadFixture("fixtures/allconferencealert.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.allconferencealert.com/morocco.html");

        assertThat(events.get(0).city()).isEqualTo("casablanca");
    }

    @Test
    void parseDocument_firstConference_hasTechnologyCategory() throws Exception {
        Document doc = loadFixture("fixtures/allconferencealert.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.allconferencealert.com/morocco.html");

        assertThat(events.get(0).category()).isEqualTo("technology");
    }

    @Test
    void parseDocument_allConferences_haveSourceName() throws Exception {
        Document doc = loadFixture("fixtures/allconferencealert.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.allconferencealert.com/morocco.html");

        assertThat(events).allMatch(e -> "allconferencealert".equals(e.sourceName()));
    }

    @Test
    void parseDocument_allConferences_haveStartDate() throws Exception {
        Document doc = loadFixture("fixtures/allconferencealert.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.allconferencealert.com/morocco.html");

        assertThat(events).allMatch(e -> e.startDate() != null);
    }

    @Test
    void parseDocument_businessConference_hasBusinessCategory() throws Exception {
        Document doc = loadFixture("fixtures/allconferencealert.html");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.allconferencealert.com/morocco.html");
        ScrapedEvent businessConf = events.get(2);

        assertThat(businessConf.category()).isEqualTo("business");
        assertThat(businessConf.city()).isEqualTo("tangier");
    }

    @Test
    void parseDocument_emptyTable_returnsEmptyList() {
        String emptyHtml = "<html><body><table class=\"conf-table\"><tbody></tbody></table></body></html>";
        Document emptyDoc = Jsoup.parse(emptyHtml);

        List<ScrapedEvent> events = scraper.parseDocument(emptyDoc, "https://www.allconferencealert.com/morocco.html");

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
        String html = "<html><body><table class=\"conf-table\"><tbody>" +
                "<tr class=\"conf-row\">" +
                "<td class=\"conf-name\"><a href=\"/conf\">Bad Date Conf</a></td>" +
                "<td class=\"conf-date\">not-a-date</td>" +
                "<td class=\"conf-location\">Casablanca, Morocco</td>" +
                "<td class=\"conf-category\">Technology</td>" +
                "</tr></tbody></table></body></html>";
        Document doc = Jsoup.parse(html, "https://www.allconferencealert.com");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.allconferencealert.com/morocco.html");

        assertThat(events).hasSize(1);
        assertThat(events.get(0).startDate()).isAfter(ZonedDateTime.now());
    }

    @Test
    void parseDocument_missingHref_usesBaseUrl() {
        String html = "<html><body><table class=\"conf-table\"><tbody>" +
                "<tr class=\"conf-row\">" +
                "<td class=\"conf-name\"><a>No Link Conf</a></td>" +
                "<td class=\"conf-date\">August 15, 2026</td>" +
                "<td class=\"conf-location\">Rabat</td>" +
                "<td class=\"conf-category\">Business</td>" +
                "</tr></tbody></table></body></html>";
        Document doc = Jsoup.parse(html, "https://www.allconferencealert.com");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.allconferencealert.com/morocco.html");

        assertThat(events).hasSize(1);
        assertThat(events.get(0).sourceUrl()).isEqualTo("https://www.allconferencealert.com/morocco.html");
    }

    @Test
    void parseDocument_emptyCategory_returnsOther() {
        String html = "<html><body><table class=\"conf-table\"><tbody>" +
                "<tr class=\"conf-row\">" +
                "<td class=\"conf-name\"><a href=\"/conf\">No Cat Conf</a></td>" +
                "<td class=\"conf-date\">August 15, 2026</td>" +
                "<td class=\"conf-location\">Marrakech</td>" +
                "<td class=\"conf-category\"></td>" +
                "</tr></tbody></table></body></html>";
        Document doc = Jsoup.parse(html, "https://www.allconferencealert.com");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.allconferencealert.com/morocco.html");

        assertThat(events).hasSize(1);
        assertThat(events.get(0).category()).isEqualTo("other");
    }

    @Test
    void parseDocument_scienceCategory_returnsScience() {
        String html = "<html><body><table class=\"conf-table\"><tbody>" +
                "<tr class=\"conf-row\">" +
                "<td class=\"conf-name\"><a href=\"/conf\">Science Conf</a></td>" +
                "<td class=\"conf-date\">September 10, 2026</td>" +
                "<td class=\"conf-location\">Fes</td>" +
                "<td class=\"conf-category\">Science & Engineering</td>" +
                "</tr></tbody></table></body></html>";
        Document doc = Jsoup.parse(html, "https://www.allconferencealert.com");

        List<ScrapedEvent> events = scraper.parseDocument(doc, "https://www.allconferencealert.com/morocco.html");

        assertThat(events).hasSize(1);
        assertThat(events.get(0).category()).isEqualTo("science");
    }

    private Document loadFixture(String path) throws Exception {
        try (InputStream in = getClass().getClassLoader().getResourceAsStream(path)) {
            assert in != null : "Fixture not found: " + path;
            String html = new String(in.readAllBytes(), StandardCharsets.UTF_8);
            return Jsoup.parse(html, "https://www.allconferencealert.com");
        }
    }
}
