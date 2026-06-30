package com.atlasevents.api.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LoginRateLimiterTest {

    private LoginRateLimiter rateLimiter;

    @BeforeEach
    void setUp() {
        rateLimiter = new LoginRateLimiter();
    }

    @Test
    void notBlocked_initially() {
        assertThat(rateLimiter.isBlocked("127.0.0.1")).isFalse();
    }

    @Test
    void notBlocked_after9Failures() {
        for (int i = 0; i < 9; i++) {
            rateLimiter.recordFailedAttempt("10.0.0.1");
        }
        assertThat(rateLimiter.isBlocked("10.0.0.1")).isFalse();
    }

    @Test
    void blocked_after10Failures() {
        for (int i = 0; i < 10; i++) {
            rateLimiter.recordFailedAttempt("10.0.0.2");
        }
        assertThat(rateLimiter.isBlocked("10.0.0.2")).isTrue();
    }

    @Test
    void reset_clearsBlockedState() {
        for (int i = 0; i < 10; i++) {
            rateLimiter.recordFailedAttempt("10.0.0.3");
        }
        assertThat(rateLimiter.isBlocked("10.0.0.3")).isTrue();
        rateLimiter.reset("10.0.0.3");
        assertThat(rateLimiter.isBlocked("10.0.0.3")).isFalse();
    }

    @Test
    void differentKeys_trackedIndependently() {
        for (int i = 0; i < 10; i++) {
            rateLimiter.recordFailedAttempt("192.168.1.1");
        }
        assertThat(rateLimiter.isBlocked("192.168.1.1")).isTrue();
        assertThat(rateLimiter.isBlocked("192.168.1.2")).isFalse();
    }

    @Test
    void recordFailure_after10_doesNotThrow() {
        for (int i = 0; i < 11; i++) {
            rateLimiter.recordFailedAttempt("10.0.0.4");
        }
        assertThat(rateLimiter.isBlocked("10.0.0.4")).isTrue();
    }
}
