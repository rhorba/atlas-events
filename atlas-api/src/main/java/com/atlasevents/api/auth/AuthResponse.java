package com.atlasevents.api.auth;

import java.time.ZonedDateTime;

public record AuthResponse(String token, ZonedDateTime expiresAt) {}
