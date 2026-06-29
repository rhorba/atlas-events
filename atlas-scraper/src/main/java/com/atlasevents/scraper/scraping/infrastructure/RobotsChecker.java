package com.atlasevents.scraper.scraping.infrastructure;

import org.jsoup.Jsoup;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;

@Component
public class RobotsChecker {

    private static final Logger log = LoggerFactory.getLogger(RobotsChecker.class);
    private static final int FETCH_TIMEOUT_MS = 5000;

    public boolean isAllowed(String url, int timeoutMs) {
        try {
            URI uri = URI.create(url);
            String robotsUrl = uri.getScheme() + "://" + uri.getHost() + "/robots.txt";
            String path = uri.getPath().isEmpty() ? "/" : uri.getPath();

            String robotsTxt = Jsoup.connect(robotsUrl)
                    .ignoreContentType(true)
                    .timeout(FETCH_TIMEOUT_MS)
                    .execute()
                    .body();

            return !isDisallowed(robotsTxt, path);
        } catch (Exception e) {
            log.debug("Could not fetch robots.txt for {}, defaulting to allowed: {}", url, e.getMessage());
            return true;
        }
    }

    boolean isDisallowed(String robotsTxt, String path) {
        boolean inRelevantBlock = false;
        List<String> disallowedPaths = new ArrayList<>();

        for (String line : robotsTxt.split("\n")) {
            line = line.trim();
            if (line.startsWith("#") || line.isEmpty()) continue;

            if (line.toLowerCase().startsWith("user-agent:")) {
                String agent = line.substring("user-agent:".length()).trim();
                inRelevantBlock = agent.equals("*") || agent.equalsIgnoreCase("AtlasEventsBot");
                if (inRelevantBlock) disallowedPaths.clear();
            } else if (inRelevantBlock && line.toLowerCase().startsWith("disallow:")) {
                String disallowed = line.substring("disallow:".length()).trim();
                if (!disallowed.isEmpty()) disallowedPaths.add(disallowed);
            }
        }

        return disallowedPaths.stream().anyMatch(path::startsWith);
    }
}
