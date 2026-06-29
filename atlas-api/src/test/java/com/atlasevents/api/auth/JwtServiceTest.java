package com.atlasevents.api.auth;

import com.atlasevents.api.shared.config.AppProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtServiceTest {

    private static final String SECRET = "atlas-events-super-secret-key-for-testing-purposes-only-256bits";
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        AppProperties props = mock(AppProperties.class);
        AppProperties.AdminProperties admin = mock(AppProperties.AdminProperties.class);
        AppProperties.JwtProperties jwt = mock(AppProperties.JwtProperties.class);

        when(props.admin()).thenReturn(admin);
        when(props.jwt()).thenReturn(jwt);
        when(jwt.secret()).thenReturn(SECRET);
        when(jwt.expirationHours()).thenReturn(1);

        jwtService = new JwtService(props);
    }

    @Test
    void generateToken_returnsNonBlankJwt() {
        String token = jwtService.generateToken("admin");
        assertThat(token).isNotBlank();
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Test
    void validateAndExtractSubject_validToken_returnsSubject() {
        String token = jwtService.generateToken("admin");
        String subject = jwtService.validateAndExtractSubject(token);
        assertThat(subject).isEqualTo("admin");
    }

    @Test
    void validateAndExtractSubject_tamperedToken_throwsException() {
        String token = jwtService.generateToken("admin");
        String tampered = token.substring(0, token.length() - 5) + "XXXXX";
        assertThatThrownBy(() -> jwtService.validateAndExtractSubject(tampered))
                .isInstanceOf(Exception.class);
    }

    @Test
    void validateAndExtractSubject_wrongSecret_throwsException() {
        AppProperties other = mock(AppProperties.class);
        AppProperties.JwtProperties otherJwt = mock(AppProperties.JwtProperties.class);
        when(other.jwt()).thenReturn(otherJwt);
        when(otherJwt.secret()).thenReturn("completely-different-secret-key-for-testing-only-256bit");
        when(otherJwt.expirationHours()).thenReturn(1);

        JwtService otherService = new JwtService(other);
        String token = otherService.generateToken("admin");

        assertThatThrownBy(() -> jwtService.validateAndExtractSubject(token))
                .isInstanceOf(Exception.class);
    }

    @Test
    void expiresAt_returnsApproximatelyOneHourFromNow() {
        var expiresAt = jwtService.expiresAt();
        var now = java.time.ZonedDateTime.now();
        assertThat(expiresAt).isAfter(now.plusMinutes(59));
        assertThat(expiresAt).isBefore(now.plusMinutes(61));
    }
}
