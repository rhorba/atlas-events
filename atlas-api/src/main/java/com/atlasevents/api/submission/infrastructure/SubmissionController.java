package com.atlasevents.api.submission.infrastructure;

import com.atlasevents.api.shared.dto.ApiResponse;
import com.atlasevents.api.submission.application.SubmissionCommand;
import com.atlasevents.api.submission.application.SubmissionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/submissions")
class SubmissionController {

    private final SubmissionService submissionService;
    private final SubmissionRateLimiter rateLimiter;

    SubmissionController(SubmissionService submissionService, SubmissionRateLimiter rateLimiter) {
        this.submissionService = submissionService;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping
    ResponseEntity<ApiResponse<UUID>> submit(
            @Valid @RequestBody SubmissionRequest request,
            HttpServletRequest httpRequest) {

        String ip = resolveClientIp(httpRequest);

        if (!rateLimiter.tryConsume(ip)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header(HttpHeaders.RETRY_AFTER, "3600")
                    .body(ApiResponse.error("Rate limit exceeded. Try again in 1 hour."));
        }

        SubmissionCommand command = new SubmissionCommand(
                request.title(),
                request.description(),
                request.startDate(),
                request.endDate(),
                request.city(),
                request.venue(),
                request.organizerName(),
                request.contactEmail(),
                request.eventUrl(),
                request.isFree()
        );

        UUID id = submissionService.submit(command);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(id));
    }

    private static String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
