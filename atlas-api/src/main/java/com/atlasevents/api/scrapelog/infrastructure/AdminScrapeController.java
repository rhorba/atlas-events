package com.atlasevents.api.scrapelog.infrastructure;

import com.atlasevents.api.messaging.config.RabbitMQConfig;
import com.atlasevents.api.scrapelog.domain.ScrapeLog;
import com.atlasevents.api.scrapelog.domain.ScrapeLogRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/scrape")
public class AdminScrapeController {

    private final ScrapeLogRepository scrapeLogRepository;
    private final RabbitTemplate rabbitTemplate;

    public AdminScrapeController(ScrapeLogRepository scrapeLogRepository, RabbitTemplate rabbitTemplate) {
        this.scrapeLogRepository = scrapeLogRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    @PostMapping("/trigger")
    public ResponseEntity<Void> triggerScrape() {
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, RabbitMQConfig.QUEUE_TRIGGER, "trigger");
        return ResponseEntity.accepted().build();
    }

    @GetMapping("/logs")
    public ResponseEntity<List<ScrapeLogResponse>> getLogs(
            @RequestParam(required = false) String source,
            @RequestParam(defaultValue = "20") int limit) {
        List<ScrapeLog> logs = source != null && !source.isBlank()
                ? scrapeLogRepository.findBySource(source, limit)
                : scrapeLogRepository.findRecent(limit);
        return ResponseEntity.ok(logs.stream().map(ScrapeLogResponse::from).toList());
    }
}
