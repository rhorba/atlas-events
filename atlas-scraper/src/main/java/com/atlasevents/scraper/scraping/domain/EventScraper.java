package com.atlasevents.scraper.scraping.domain;

import org.jsoup.nodes.Document;

import java.io.IOException;
import java.util.List;

public interface EventScraper {
    String getSourceName();
    String getTargetUrl();
    List<ScrapedEvent> scrape() throws IOException;
    List<ScrapedEvent> parseDocument(Document doc, String baseUrl);
}
