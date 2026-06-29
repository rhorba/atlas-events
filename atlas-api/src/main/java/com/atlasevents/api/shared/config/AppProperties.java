package com.atlasevents.api.shared.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "atlas")
public record AppProperties(
        AdminProperties admin,
        JwtProperties jwt,
        CorsProperties cors
) {
    public record AdminProperties(String username, String password) {}
    public record JwtProperties(String secret, int expirationHours) {}
    public record CorsProperties(List<String> allowedOrigins) {}
}
