package com.atlasevents.api.auth;

import com.atlasevents.api.shared.config.AppProperties;
import com.atlasevents.api.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
class AuthController {

    private final AppProperties appProperties;
    private final JwtService jwtService;

    AuthController(AppProperties appProperties, JwtService jwtService) {
        this.appProperties = appProperties;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest request) {
        boolean validUsername = appProperties.admin().username().equals(request.username());
        boolean validPassword = appProperties.admin().password().equals(request.password());

        if (!validUsername || !validPassword) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid credentials"));
        }

        String token = jwtService.generateToken(request.username());
        return ResponseEntity.ok(ApiResponse.of(new AuthResponse(token, jwtService.expiresAt())));
    }
}
