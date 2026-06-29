package com.atlasevents.api.submission.infrastructure;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
class SubmissionRateLimiter {

    private static final int REQUESTS_PER_HOUR = 10;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    boolean tryConsume(String ipAddress) {
        return buckets.computeIfAbsent(ipAddress, this::newBucket).tryConsume(1);
    }

    private Bucket newBucket(String ignored) {
        Bandwidth limit = Bandwidth.classic(REQUESTS_PER_HOUR, Refill.greedy(REQUESTS_PER_HOUR, Duration.ofHours(1)));
        return Bucket.builder().addLimit(limit).build();
    }
}
