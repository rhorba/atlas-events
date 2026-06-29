package com.atlasevents.api.auth;

import com.atlasevents.api.shared.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.ZonedDateTime;
import java.util.Date;

@Service
public class JwtService {

    private static final String ISSUER = "atlas-events";

    private final SecretKey signingKey;
    private final int expirationHours;

    public JwtService(AppProperties properties) {
        this.signingKey = Keys.hmacShaKeyFor(
                properties.jwt().secret().getBytes(StandardCharsets.UTF_8));
        this.expirationHours = properties.jwt().expirationHours();
    }

    public String generateToken(String subject) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + (long) expirationHours * 3600 * 1000);
        return Jwts.builder()
                .subject(subject)
                .issuer(ISSUER)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    public String validateAndExtractSubject(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        if (!ISSUER.equals(claims.getIssuer())) {
            throw new IllegalArgumentException("Invalid token issuer");
        }
        return claims.getSubject();
    }

    public ZonedDateTime expiresAt() {
        return ZonedDateTime.now().plusHours(expirationHours);
    }
}
