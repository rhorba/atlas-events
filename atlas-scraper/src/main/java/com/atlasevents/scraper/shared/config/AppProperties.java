package com.atlasevents.scraper.shared.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "atlas.scraper")
public record AppProperties(
        String tentimesUrl,
        String allConferenceAlertUrl,
        int httpTimeoutMs,
        boolean robotsCheckEnabled
) {}
