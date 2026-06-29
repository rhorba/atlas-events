package com.atlasevents.api.auth;

import com.atlasevents.api.shared.config.AppProperties;
import com.atlasevents.api.shared.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
class AuthController {

    private final AppProperties appProperties;
    private final JwtService jwtService;
    private final LoginRateLimiter rateLimiter;

    AuthController(AppProperties appProperties, JwtService jwtService, LoginRateLimiter rateLimiter) {
        this.appProperties = appProperties;
        this.jwtService = jwtService;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping("/login")
    ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody AuthRequest request,
            HttpServletRequest httpRequest) {

        String clientIp = httpRequest.getRemoteAddr();

        if (rateLimiter.isBlocked(clientIp)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(ApiResponse.error("Too many failed login attempts. Please try again in 15 minutes."));
        }

        boolean validUsername = appProperties.admin().username().equals(request.username());
        boolean validPassword = appProperties.admin().password().equals(request.password());

        if (!validUsername || !validPassword) {
            rateLimiter.recordFailedAttempt(clientIp);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid credentials"));
        }

        rateLimiter.reset(clientIp);
        String token = jwtService.generateToken(request.username());
        return ResponseEntity.ok(ApiResponse.of(new AuthResponse(token, jwtService.expiresAt())));
    }
}
