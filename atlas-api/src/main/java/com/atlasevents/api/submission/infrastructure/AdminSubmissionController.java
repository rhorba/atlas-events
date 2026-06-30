package com.atlasevents.api.submission.infrastructure;

import com.atlasevents.api.submission.domain.EventSubmission;
import com.atlasevents.api.submission.domain.SubmissionRepository;
import com.atlasevents.api.submission.domain.SubmissionStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/submissions")
public class AdminSubmissionController {

    private final SubmissionRepository submissionRepository;

    public AdminSubmissionController(SubmissionRepository submissionRepository) {
        this.submissionRepository = submissionRepository;
    }

    @GetMapping
    public ResponseEntity<List<SubmissionAdminResponse>> list(
            @RequestParam(defaultValue = "PENDING") String status) {
        SubmissionStatus s = SubmissionStatus.valueOf(status.toUpperCase());
        List<SubmissionAdminResponse> body = submissionRepository.findByStatus(s).stream()
                .map(SubmissionAdminResponse::from)
                .toList();
        return ResponseEntity.ok(body);
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<Void> approve(@PathVariable UUID id) {
        submissionRepository.updateStatus(id, SubmissionStatus.APPROVED, null);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<Void> reject(@PathVariable UUID id,
                                       @RequestBody(required = false) RejectRequest body) {
        String note = body != null ? body.note() : null;
        submissionRepository.updateStatus(id, SubmissionStatus.REJECTED, note);
        return ResponseEntity.ok().build();
    }

    record RejectRequest(String note) {}

    record SubmissionAdminResponse(
            UUID id,
            String title,
            String city,
            String organizerName,
            ZonedDateTime startDate,
            String eventUrl,
            String contactEmail,
            boolean isFree,
            SubmissionStatus status,
            String reviewNote,
            ZonedDateTime createdAt
    ) {
        static SubmissionAdminResponse from(EventSubmission s) {
            return new SubmissionAdminResponse(
                    s.id(), s.title(), s.city(), s.organizerName(),
                    s.startDate(), s.eventUrl(), s.contactEmail(),
                    s.isFree(), s.status(), s.reviewNote(), s.createdAt()
            );
        }
    }
}
