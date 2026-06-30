# ACTIVITY — Atlas Events

## 2026-06-30 — PHASE: SHIP (Sprint 5)
**Branch**: feature/sprint-5
**Stories**: 3.1 (Angular scaffold), 3.2 (Event list page), 3.6 (FR/AR toggle), 1.7 (Login rate limiting)
**Pushed**: git push origin feature/sprint-5 ✓
- atlas-web: Angular 17 standalone scaffold with Jest 29 + jest-preset-angular@14
- EventListComponent: URL-synced city/category/range filters, skeleton cards, error/empty states
- LanguageService + LanguageToggleComponent: FR/AR toggle via ngx-translate v18 standalone API
- LoginRateLimiter (Bucket4j 7.6): 10 failed attempts → 429 for 15 min, keyed by IP
- AuthController updated to inject LoginRateLimiter + HttpServletRequest
- CI: test-web job added (Node 20, npm ci, jest --coverage --ci)
- Coverage: atlas-web 86% statements / 86% branches (40 tests); atlas-api gate met (30 unit + ITs)

## 2026-06-29 — PHASE: EXECUTE → SHIP (Sprint 1)
**Stories**: 1.1 (Maven scaffold), 1.2 (Flyway migrations), 1.3 (Event list API)
**Milestone**: Sprint 1 code complete — atlas-api foundation + event list endpoint
- Root pom.xml (parent, Java 21, Spring Boot 3.4.1, Testcontainers BOM)
- atlas-api: Web, JPA, Security, Validation, Flyway, Actuator, Prometheus
- atlas-scraper: minimal scaffold (Web + Actuator), Spring Batch added Sprint 3
- Flyway migrations V001–V004: events, event_submissions, scrape_logs, batch schema
- Hexagonal architecture: Event domain record + EventRepository port + EventService + EventRepositoryAdapter + JPA Specifications (avoids PostgreSQL null-type-inference bug)
- GET /api/v1/events (city, category, range, page, size filters) + GET /api/v1/events/{id}
- SecurityConfig: public routes permit, admin routes deny (JWT auth wired Sprint 2)
- docker-compose.yml: postgres:16-alpine + rabbitmq:3-management-alpine
- Maven Wrapper (mvnw) added for reproducible builds
- **Tests**: 15 total (7 unit EventServiceTest + 8 integration EventControllerIT + GlobalExceptionHandlerIT via Testcontainers PostgreSQL)
- **Coverage**: 89% instruction (gate: 80%) — CI profile verified ✓
- **Bug fixed**: JPQL `LOWER(:nullParam)` → PostgreSQL `lower(bytea)` error → switched to JPA Specifications
- Push: feature/sprint-1-api-foundation → github.com/rhorba/atlas-events

## 2026-06-29 — PHASE: EXECUTE (Doc 01/10)
**MILESTONE**: PRD drafted → docs/prd-atlas-events.md
- Problem, goals, 13 user stories (Attendee / Organizer / Admin), in/out of scope, 13 FRs, 7 NFRs, 6 risks, timeline through Sprint 8.
- Status: APPROVED by user 2026-06-29.

## 2026-06-29 — PHASE: EXECUTE (Doc 02/10)
HANDOFF: Project Manager → System Designer
Context: PRD approved. NFRs: p99 < 500ms, 99.5% uptime, 6hr scraper, OWASP Top 10. Comprehensive architecture.
Need: System Design doc — NFRs, topology, data flows, SDRs.
**MILESTONE**: System Design APPROVED 2026-06-29.

## 2026-06-29 — PHASE: EXECUTE (Doc 03/10)
HANDOFF: System Designer → Software Architect
**MILESTONE**: Architecture drafted → docs/architecture-atlas-events.md
- 8 ADRs (Hexagonal arch, Spring Batch, Strategy pattern, pkg-by-feature, Flyway, JWT, ical4j, Angular lazy-load)
- Full package structure for atlas-api + atlas-scraper + Angular SPA
- Domain model (Event, EventSubmission, ScrapeLog), API contract (14 endpoints), security + infra summary
- Status: APPROVED 2026-06-29.

## 2026-06-29 — PHASE: EXECUTE (Doc 04/10)
HANDOFF: Software Architect → Security Engineer
**MILESTONE**: Security Baseline drafted → docs/security-atlas-events.md
- STRIDE (11 entries), auth (JWT HS256, 1-hr TTL, rate-limit, lockout), OWASP Top 10 controls, PII inventory (contactEmail only), HTTP security headers, 20+ dev requirements, GDPR notes.
- Status: APPROVED 2026-06-29.

## 2026-06-29 — PHASE: EXECUTE (Doc 05/10)
HANDOFF: Security Engineer → DBA
**MILESTONE**: Database Design drafted → docs/database-atlas-events.md
- 3 tables (events, event_submissions, scrape_logs), full SQL DDL, 9 indexes (incl. partial + JSONB expression), 4 Flyway migrations, Spring Batch batch schema config, 9 access patterns, soft-delete pattern, PII flagging on contact_email.
- Status: APPROVED 2026-06-29.

## 2026-06-29 — PHASE: EXECUTE (Doc 06/10)
HANDOFF: DBA → UX Designer
**MILESTONE**: UX Foundation drafted → docs/ux-atlas-events.md
- 3 personas (Karim/Nadia/Admin), full sitemap (8 routes), 3 core flows (browse+iCal, submit, admin moderation), 5 wireframes (list, detail, submit form, admin queue, RTL layout), screen states table, WCAG 2.1 AA notes.
- Status: APPROVED 2026-06-29.

## 2026-06-29 — PHASE: EXECUTE (Doc 07/10)
HANDOFF: UX Designer → UI Designer
**MILESTONE**: UI Foundation drafted → docs/ui-atlas-events.md
- Framework: Angular Material MDC + FullCalendar + Tailwind. Brand: deep teal-navy + Moroccan amber-gold. Fonts: Plus Jakarta Sans (FR) + IBM Plex Sans Arabic (AR). Full token set (primitive→semantic), 20-component inventory, responsive grid, RTL CSS logical properties, accessibility checks.
- Status: APPROVED 2026-06-29.

## 2026-06-29 — PHASE: EXECUTE (Doc 08/10)
HANDOFF: UI Designer → Test Architect
**MILESTONE**: Test Strategy drafted → docs/test-strategy-atlas-events.md
- Risk table (14 components scored), pyramid targets per module (JUnit5+Mockito+Testcontainers / Jest+Playwright), 6 ATDD feature blocks (28 scenarios), Tier 1+2 adversarial checklist (30+ items), NFR test plan (k6+axe-core), traceability matrix (13 FRs), 8-item release gate.
- Status: APPROVED 2026-06-29.

## 2026-06-29 — PHASE: EXECUTE (Doc 10/10)
HANDOFF: DevOps/DevSecOps → Scrum Master + Test Architect
**MILESTONE**: Epics & Stories drafted → docs/stories-atlas-events.md
- 5 epics (API Foundation / Scraper Pipeline / Angular Frontend / Admin Dashboard / K8s+Go-Live)
- 20 stories, each with Given/When/Then acceptance criteria referencing ATDD scenarios from test-strategy
- Sizes (S/M/L) + sprint allocation across 8 sprints (2026-06-30 → 2026-08-31)
- Definition of Done: coverage ≥ 80%, lint pass, no new Critical/High security findings, staging smoke-tested
- Status: APPROVED 2026-06-29.
- **ALL 10 FOUNDATION DOCUMENTS COMPLETE AND APPROVED.**

## 2026-06-29 — PHASE: SHIP (Sprint 0 — Foundation docs push)
All 10 docs approved. git init → commit 99df1fe → pushed to https://github.com/rhorba/atlas-events (branch: master).
21 files committed: 10 docs + .env.example + 8 log files + CLAUDE.md + README.md. CI: not yet configured (Sprint 8).

## 2026-06-29 — PHASE: SHIP (Sprint 4 — Scraper expansion + admin endpoints)
**Branch**: feature/sprint-4
**Stories**: 2.4 (PcnsScraper), 2.5 (dedup RabbitMQ consumer), 2.6 (scrape log + admin trigger)
- `PcnsScraper`: Jsoup `article.pcns-event` selectors, `dd/MM/yyyy` French locale, strategy normalizeCategory
- `ScraperJobConfig`: 3-step Spring Batch job (tentimesStep → allConferenceAlertStep → pcnsStep)
- `ScrapedEventConsumer`: validates title/startDate/city, calls `saveScrapedEvent` with `ON CONFLICT DO NOTHING`, logs insert vs duplicate
- `RabbitMQConfig`: retry interceptor (3 attempts, 2× backoff, DLQ); `rabbitListenerContainerFactory` guarded with `@ConditionalOnBean(ConnectionFactory.class)` so test profile works
- `ScrapeResultConsumer`: receives `ScrapeResultMessage` from scraper, persists `ScrapeLog` via JPA adapter
- `AdminScrapeController`: `POST /api/v1/admin/scrape/trigger` (202) + `GET /api/v1/admin/scrape/logs?source=&limit=` (JWT-protected)
- `TestMessagingConfig`: test-profile `@Configuration` providing mock `RabbitTemplate` for all ITs without RabbitMQ Testcontainers
- **Tests**: atlas-scraper 52 unit+IT all pass; atlas-api 29 unit+IT all pass
- **Coverage**: both modules ≥ 80% — `All coverage checks have been met` ✓
- **Push**: `git push origin feature/sprint-4` ✓ — branch visible at github.com/rhorba/atlas-events
- **.env.example**: added TENTIMES_URL, ALL_CONFERENCE_ALERT_URL, PCNS_URL, HTTP_TIMEOUT_MS, ROBOTS_CHECK_ENABLED
- **Gaps noted for upcoming sprints**: login rate limiting (Story 1.7 AC: 10 failed → 429); GET /api/v1/admin/submissions endpoint (Story 1.7 + 4.2)

## 2026-06-29 — PHASE: EXECUTE (Doc 09/10)
HANDOFF: Test Architect → DevOps/DevSecOps
**MILESTONE**: DevOps Foundation drafted → docs/devops-atlas-events.md + .env.example
- 3 environments (local/staging/prod), full GitHub Actions pipeline (6 stages, parallel test jobs), 3 Dockerfiles (JRE21-alpine + Nginx non-root), Docker Compose (5 services), K8s manifest outline (Kustomize overlays), K8s secrets strategy, Prometheus+Grafana monitoring (8 alerts, 3 dashboards), 5 security scanning gates.
- .env.example written with all default values.
- Status: Awaiting user approval before Doc 10 (Stories).
**MILESTONE**: System Design drafted → docs/system-design-atlas-events.md
- NFR table (11 attributes), capacity estimate (< 5 RPS peak), full ASCII topology, 4 data flows (read/iCal/write/async scrape/admin), 5 SDRs.
- Status: Awaiting user approval before Doc 03 (Architecture).
