package com.atlasevents.scraper.scraping.infrastructure;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RobotsCheckerTest {

    private RobotsChecker checker;

    @BeforeEach
    void setUp() {
        checker = new RobotsChecker();
    }

    @Test
    void isDisallowed_emptyRobotsTxt_returnsFalse() {
        assertThat(checker.isDisallowed("", "/events")).isFalse();
    }

    @Test
    void isDisallowed_disallowAll_returnsTrue() {
        String robots = "User-agent: *\nDisallow: /\n";
        assertThat(checker.isDisallowed(robots, "/events")).isTrue();
    }

    @Test
    void isDisallowed_allowAll_returnsFalse() {
        String robots = "User-agent: *\nDisallow:\n";
        assertThat(checker.isDisallowed(robots, "/events")).isFalse();
    }

    @Test
    void isDisallowed_specificPath_matchingPath_returnsTrue() {
        String robots = "User-agent: *\nDisallow: /private/\n";
        assertThat(checker.isDisallowed(robots, "/private/data")).isTrue();
    }

    @Test
    void isDisallowed_specificPath_nonMatchingPath_returnsFalse() {
        String robots = "User-agent: *\nDisallow: /private/\n";
        assertThat(checker.isDisallowed(robots, "/events")).isFalse();
    }

    @Test
    void isDisallowed_withComments_ignoresComments() {
        String robots = "# robots.txt\nUser-agent: *\n# disallow\nDisallow: /admin\n";
        assertThat(checker.isDisallowed(robots, "/admin/page")).isTrue();
        assertThat(checker.isDisallowed(robots, "/events")).isFalse();
    }

    @Test
    void isDisallowed_multipleBlocks_usesStarBlock() {
        String robots = "User-agent: Googlebot\nDisallow: /private/\n\nUser-agent: *\nDisallow: /secret/\n";
        assertThat(checker.isDisallowed(robots, "/secret/data")).isTrue();
        assertThat(checker.isDisallowed(robots, "/private/data")).isFalse();
    }

    @Test
    void isDisallowed_rootPath_returnsTrue() {
        String robots = "User-agent: *\nDisallow: /\n";
        assertThat(checker.isDisallowed(robots, "/")).isTrue();
    }

    @Test
    void isAllowed_invalidUrl_defaultsToAllowed() {
        boolean result = checker.isAllowed("not-a-valid-url-scheme", 5000);
        assertThat(result).isTrue();
    }
}
