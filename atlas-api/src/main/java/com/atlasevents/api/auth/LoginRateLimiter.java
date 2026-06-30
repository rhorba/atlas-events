package com.atlasevents.api.auth;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bucket4j;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

@Component
class LoginRateLimiter {

    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    boolean isBlocked(String key) {
        return resolveBucket(key).getAvailableTokens() == 0;
    }

    void recordFailedAttempt(String key) {
        resolveBucket(key).tryConsume(1);
    }

    void reset(String key) {
        buckets.remove(key);
    }

    private Bucket resolveBucket(String key) {
        return buckets.computeIfAbsent(key, k ->
                Bucket4j.builder()
                        .addLimit(Bandwidth.classic(10, Refill.intervally(10, Duration.ofMinutes(15))))
                        .build()
        );
    }
}
