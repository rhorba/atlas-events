# DECISIONS — Atlas Events

## DEC-001 — Architecture approach — 2026-06-29
**Decision**: Comprehensive — two Spring Boot services + RabbitMQ + Kubernetes
- `atlas-api`: Spring Boot 3.x / Java 21, REST API, JWT auth, PostgreSQL (Flyway migrations)
- `atlas-scraper`: Spring Boot 3.x / Java 21, Spring Batch jobs per city/source
- Message queue: RabbitMQ for async scrape result delivery
- Frontend: Angular SPA
- Deployment: Kubernetes
**Chosen by**: User
**Alternatives rejected**: 🟢 Simple monolith, 🟡 Balanced (user explicitly chose 🔴 Comprehensive)
**Re-evaluate when**: K8s ops overhead becomes a bottleneck at team size < 3
