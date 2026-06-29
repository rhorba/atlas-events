# Architecture: Atlas Events
**PRD Reference**: docs/prd-atlas-events.md
**System Design**: docs/system-design-atlas-events.md
**Version**: 1.0 | **Date**: 2026-06-29 | **Author**: Software Architect

---

## 1. Overview

Atlas Events is composed of two Spring Boot 3 / Java 21 services and one Angular 17 SPA. `atlas-api` uses Hexagonal Architecture (Ports & Adapters) to cleanly separate domain logic from REST, RabbitMQ, and database adapters. `atlas-scraper` uses Spring Batch's natural Reader → Processor → Writer pipeline with a Strategy pattern for individual scrapers. The Angular SPA uses a feature-module layout with a shared core.

---

## 2. Architecture Decision Records

### ADR-1: Hexagonal Architecture for atlas-api
**Status**: Accepted
**Context**: atlas-api has three I/O entry points — HTTP (REST), AMQP (RabbitMQ consumer), and eventually CLI triggers. Business logic (deduplication, submission moderation) must not know which adapter invoked it.
**Decision**: Hexagonal (Ports & Adapters). Domain and application layers have zero Spring/framework imports. Infrastructure adapters implement domain-defined ports (interfaces).
**Consequences**:
  + Domain logic is fully unit-testable without Spring context or DB
  + Swap RabbitMQ for Kafka or polling without touching use cases
  - More initial boilerplate vs plain Spring MVC layering
**Re-evaluate when**: Domain logic becomes trivially simple (pure CRUD) — then flatten to plain layered.

### ADR-2: Spring Batch for atlas-scraper
**Status**: Accepted
**Context**: Scraping is a batch process: fetch → parse → validate → publish. Needs retry, skip, restart, and job execution history out of the box.
**Decision**: Spring Batch with one `Job` per scraper source. Each job has a single `Step`: `ItemReader` (HTTP fetch + HTML parse) → `ItemProcessor` (validate, normalize) → `ItemWriter` (publish to RabbitMQ).
**Consequences**:
  + Built-in retry, skip, restart, and execution log (stored in `BATCH_*` tables)
  + Each scraper source is independently schedulable and independently restartable
  - Spring Batch schema adds ~10 tables to the DB (separate schema `batch`)
**Re-evaluate when**: Scraping volume exceeds thousands of pages per run — then consider async reactive pipeline.

### ADR-3: Strategy Pattern for Scraper Sources
**Status**: Accepted
**Context**: Each scraper source (10times, allconferencealert, pcns, city-specific) has different HTML structure but produces the same `ScrapedEvent` output type.
**Decision**: `EventScraper` interface with one method `scrape(String url): List<ScrapedEvent>`. Each source is a `@Component` implementing this interface. `ScraperRegistry` discovers all beans and maps them to job definitions.
**Consequences**:
  + Adding a new city source = implementing one class, zero changes to pipeline
  + Each scraper is independently unit-testable with fixture HTML
  - Scrapers must normalize to the shared `ScrapedEvent` contract regardless of source quirks
**Re-evaluate when**: Sources require fundamentally different pipeline steps (e.g., authenticated API calls) — then promote to dedicated job types.

### ADR-4: Package by Feature
**Status**: Accepted
**Context**: Package-by-layer (controllers/, services/, repositories/) causes unrelated classes to be coupled in the same package; cross-feature changes touch many packages.
**Decision**: Both services use package-by-feature. Each feature package owns its controller/service/repository/mapper/DTO. Cross-feature dependencies are explicit.
**Consequences**:
  + Feature can be extracted to its own service with minimal refactoring
  + Changes to `event` feature stay inside `event/` package
  - Requires discipline to keep shared utilities in `shared/` only

### ADR-5: Flyway for Database Migrations
**Status**: Accepted
**Context**: Schema must evolve across sprints with rollback capability. Spring Boot auto-DDL is not reproducible across environments.
**Decision**: Flyway with versioned migrations (`V001__initial_schema.sql`, etc.) in `atlas-api/src/main/resources/db/migration/`. atlas-api runs `flyway migrate` on startup. Spring Batch schema migrations in a separate `batch` Flyway location.
**Consequences**:
  + Schema changes are version-controlled, auditable, and reversible
  + Works seamlessly with Spring Boot auto-configuration
  - Each schema change requires a new migration file (discipline needed, not a bug)

### ADR-6: Stateless JWT for Admin Auth
**Status**: Accepted
**Context**: Single admin user. No need for session management, user registration, or OAuth flows.
**Decision**: Spring Security with stateless JWT. Login endpoint returns signed JWT (HS256, secret from env var). `JwtAuthFilter` validates token on every protected request. No session state stored server-side.
**Consequences**:
  + Simple, stateless, scales horizontally without shared session store
  + No database lookup per request (token is self-contained)
  - Token cannot be revoked before expiry (acceptable for single admin MVP)
**Re-evaluate when**: Multi-admin or OAuth2 / SSO required.

### ADR-7: ical4j for iCal Feed Generation
**Status**: Accepted
**Context**: iCal (.ics) format requires RFC 5545-compliant output. Hand-rolling is error-prone.
**Decision**: `ical4j` library. `IcalService` queries approved events, maps to `VEvent` objects, returns `Calendar` serialized as `text/calendar`.
**Consequences**:
  + RFC-compliant output tested against Apple Calendar, Google Calendar
  + Handles timezone (Africa/Casablanca), RRULE, VEVENT encoding correctly
  - Adds one library dependency

### ADR-8: Angular Feature Modules with Lazy Loading
**Status**: Accepted
**Context**: Angular SPA has distinct areas: public event browsing, event submission, admin dashboard. Admin area is rarely accessed and heavier.
**Decision**: Angular standalone components with lazy-loaded route modules for `events`, `calendar`, `submit`, and `admin`. Shared components in `shared/` module. Core singleton services (auth, API interceptor) in `core/`.
**Consequences**:
  + Admin bundle not loaded for public users (faster initial load)
  + Clear boundary between public and protected areas
  - Slightly more routing boilerplate than a flat component tree

---

## 3. Internal Module Structure

### atlas-api

```
com.atlasevents.api/
│
├── event/                          # Event domain feature
│   ├── domain/
│   │   ├── Event.java              # Domain entity (no JPA annotations)
│   │   ├── EventCategory.java      # Enum
│   │   ├── EventStatus.java        # Enum
│   │   └── EventRepository.java    # Port (interface — no Spring Data import)
│   ├── application/
│   │   └── EventService.java       # Use cases: query, approve, soft-delete
│   └── infrastructure/
│       ├── EventJpaEntity.java     # JPA-annotated persistence entity
│       ├── EventJpaRepository.java # Spring Data JPA interface
│       ├── EventRepositoryAdapter.java # Implements domain EventRepository
│       ├── EventController.java    # REST adapter (GET /api/v1/events)
│       └── EventMapper.java        # Domain ↔ JPA ↔ DTO mapping
│
├── submission/                     # Community submission feature
│   ├── domain/
│   │   ├── EventSubmission.java
│   │   ├── SubmissionStatus.java
│   │   └── SubmissionRepository.java   # Port
│   ├── application/
│   │   └── SubmissionService.java  # submit(), approve(), reject()
│   └── infrastructure/
│       ├── SubmissionJpaEntity.java
│       ├── SubmissionJpaRepository.java
│       ├── SubmissionRepositoryAdapter.java
│       └── SubmissionController.java   # POST /api/v1/submissions
│
├── scrape/                         # Scraper log + trigger feature
│   ├── domain/
│   │   ├── ScrapeLog.java
│   │   └── ScrapeLogRepository.java    # Port
│   ├── application/
│   │   └── ScrapeService.java      # recordResult(), triggerScrape()
│   └── infrastructure/
│       ├── ScrapeLogJpaEntity.java
│       ├── ScrapeLogJpaRepository.java
│       ├── ScrapeLogRepositoryAdapter.java
│       └── ScrapeAdminController.java  # Admin scrape endpoints
│
├── ical/                           # iCal feed feature
│   ├── application/
│   │   └── IcalService.java        # builds ical4j Calendar from events
│   └── infrastructure/
│       └── IcalController.java     # GET /ical
│
├── messaging/                      # RabbitMQ adapters (infrastructure)
│   ├── ScrapedEventConsumer.java   # @RabbitListener — events.scraped
│   ├── ScrapeResultConsumer.java   # @RabbitListener — scrape.results
│   ├── ScrapeJobTriggerPublisher.java # publishes to scrape.trigger
│   └── RabbitMQConfig.java         # Queue/Exchange/Binding beans
│
├── auth/                           # Admin auth (cross-cutting)
│   ├── AuthController.java         # POST /api/v1/auth/login
│   ├── JwtService.java             # sign / validate JWT
│   ├── JwtAuthFilter.java          # OncePerRequestFilter
│   └── SecurityConfig.java         # Spring Security config
│
└── shared/                         # Truly shared utilities only
    ├── config/
    │   └── AppProperties.java      # @ConfigurationProperties
    ├── exception/
    │   ├── AtlasException.java
    │   └── GlobalExceptionHandler.java  # @RestControllerAdvice
    ├── dto/
    │   └── ApiResponse.java        # Standard response wrapper
    └── model/
        └── ScrapedEvent.java       # Shared DTO with atlas-scraper (duplicated by design)
```

### atlas-scraper

```
com.atlasevents.scraper/
│
├── scraper/                        # Scraper Strategy implementations
│   ├── EventScraper.java           # Interface: List<ScrapedEvent> scrape(String url)
│   ├── TentimesScraper.java        # @Component — 10times.com
│   ├── AllConferenceAlertScraper.java # @Component
│   ├── PcnsScraper.java            # @Component
│   └── ScraperRegistry.java        # Discovers scrapers, maps to job params
│
├── job/                            # Spring Batch configuration
│   ├── ScrapeJobConfig.java        # One Job per registered scraper
│   ├── ScrapeItemReader.java       # Fetch + parse HTML → ScrapedEvent
│   ├── ScrapeItemProcessor.java    # Validate, normalize, deduplicate check
│   ├── ScrapeItemWriter.java       # Publish to RabbitMQ events.scraped
│   └── ScrapeJobListener.java      # Publish ScrapeJobResult on job end
│
├── http/                           # HTTP + robots utilities
│   ├── HttpClientConfig.java       # OkHttp / RestClient bean config
│   ├── RobotsChecker.java          # Parse robots.txt, check allow/disallow
│   └── RateLimiter.java            # Per-domain rate limiting (Guava)
│
├── messaging/                      # RabbitMQ
│   ├── RabbitMQPublisher.java      # Publishes ScrapedEvent, ScrapeJobResult
│   ├── TriggerConsumer.java        # @RabbitListener — scrape.trigger queue
│   └── RabbitMQConfig.java         # Queue/Exchange/Binding beans
│
└── shared/
    ├── model/
    │   ├── ScrapedEvent.java       # Output DTO (mirrors atlas-api shared model)
    │   └── ScrapeJobResult.java    # Job summary message
    └── config/
        └── ScraperProperties.java  # @ConfigurationProperties (cron, URLs)
```

### Angular SPA (atlas-web)

```
src/app/
│
├── core/                           # Singleton, app-wide
│   ├── auth/
│   │   ├── auth.service.ts         # login(), logout(), JWT storage
│   │   └── auth.guard.ts           # Protects /admin routes
│   ├── api/
│   │   └── api.service.ts          # Base HTTP service (environment.apiUrl)
│   └── interceptors/
│       └── auth.interceptor.ts     # Attaches Bearer token to requests
│
├── shared/                         # Reusable dumb components
│   ├── components/
│   │   ├── event-card/
│   │   ├── city-filter/
│   │   ├── category-badge/
│   │   └── loading-spinner/
│   └── pipes/
│       └── arabic-date.pipe.ts     # Formats dates in AR locale
│
├── features/
│   ├── events/                     # Public event list
│   │   ├── events.routes.ts        # Lazy-loaded route
│   │   ├── events.component.ts
│   │   └── events.service.ts
│   ├── calendar/                   # Calendar view
│   │   ├── calendar.routes.ts
│   │   └── calendar.component.ts   # FullCalendar / angular-calendar
│   ├── event-detail/               # Single event page
│   │   ├── event-detail.routes.ts
│   │   └── event-detail.component.ts
│   ├── submit/                     # Community submission form
│   │   ├── submit.routes.ts
│   │   └── submit.component.ts
│   └── admin/                      # Admin dashboard (lazy, auth-guarded)
│       ├── admin.routes.ts
│       ├── login/
│       ├── submissions/
│       ├── events/
│       └── scraper-health/
│
└── app.routes.ts                   # Root routing with lazy loading
```

---

## 4. Data Model (domain layer)

```
Event
  id: UUID
  title: Map<String, String>        # { "fr": "...", "ar": "..." }
  description: Map<String, String>
  startDate: ZonedDateTime
  endDate: ZonedDateTime (nullable)
  city: String                      # "casablanca" | "rabat" | "marrakech" | "tangier" | "agadir"
  venue: String (nullable)
  organizer: String
  organizerUrl: String (nullable)
  registrationUrl: String (nullable)
  isFree: Boolean
  category: EventCategory
  tags: List<String>
  source: EventSource               # { name, url, scrapedAt, isManual }
  status: EventStatus
  submissionStatus: SubmissionStatus
  language: String
  createdAt: ZonedDateTime
  updatedAt: ZonedDateTime

EventSubmission
  id: UUID
  titleFr: String
  startDate: ZonedDateTime
  endDate: ZonedDateTime (nullable)
  city: String
  organizer: String
  registrationUrl: String
  category: EventCategory
  descriptionFr: String (nullable)
  contactEmail: String (nullable)   # Never exposed publicly
  status: SubmissionStatus
  submittedAt: ZonedDateTime
  reviewedAt: ZonedDateTime (nullable)
  reviewNote: String (nullable)

ScrapeLog
  id: UUID
  source: String
  url: String
  startedAt: ZonedDateTime
  finishedAt: ZonedDateTime (nullable)
  eventsFound: Integer
  eventsInserted: Integer
  success: Boolean
  errorMessage: String (nullable)

Relationships:
  EventSubmission --[approve]--> Event  (admin promotes submission to event)
  ScrapeLog       --[records]-->        (one log per scraper job run)
```

---

## 5. API Design

### Public API (atlas-api)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/events | List events (city, category, range, page) | None |
| GET | /api/v1/events/{id} | Event detail | None |
| GET | /ical | iCal feed (?city=&category=) | None |
| POST | /api/v1/submissions | Submit community event | None |

### Admin API (JWT required)

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/v1/auth/login | Login → JWT |
| GET | /api/v1/admin/submissions | List pending submissions |
| POST | /api/v1/admin/submissions/{id}/approve | Approve submission |
| POST | /api/v1/admin/submissions/{id}/reject | Reject with note |
| GET | /api/v1/admin/events | All events (paginated) |
| PUT | /api/v1/admin/events/{id} | Edit event |
| DELETE | /api/v1/admin/events/{id} | Soft-delete event |
| GET | /api/v1/admin/scrape-logs | Scraper run history |
| POST | /api/v1/admin/scrape/trigger | Trigger manual scrape |

### Health / Ops

| Method | Endpoint | Description |
|---|---|---|
| GET | /actuator/health | Liveness + readiness |
| GET | /actuator/prometheus | Prometheus metrics scrape |

---

## 6. Security Considerations

*(Full detail in `docs/security-atlas-events.md` — summary here)*

- All admin endpoints behind `JwtAuthFilter` (Spring Security). 401 on missing/invalid token.
- Input validation via Jakarta Bean Validation (`@Valid`) at controller layer. No validation in domain.
- SQL injection: prevented by Spring Data JPA parameterized queries. No native SQL strings.
- Scraper respects `robots.txt` via `RobotsChecker` before each job run.
- `contactEmail` on submissions never returned in any API response.
- HTTPS enforced at K8s Ingress layer (cert-manager / Let's Encrypt).
- Security headers (CSP, HSTS, X-Frame-Options) via Spring Security `headers()` config.

---

## 7. Infrastructure Summary

*(Full detail in `docs/devops-atlas-events.md`)*

- **atlas-api**: K8s Deployment, 1 replica, HPA configured (CPU 70%)
- **atlas-scraper**: K8s CronJob (`0 */6 * * *`), `restartPolicy: OnFailure`
- **PostgreSQL 16**: K8s StatefulSet, PVC 20Gi
- **RabbitMQ 3.x**: K8s StatefulSet, management UI on internal port
- **Angular SPA**: Nginx K8s Deployment serving `/dist/atlas-web`
- **CI/CD**: GitHub Actions — lint → test (≥80% coverage) → security scan → Docker build → push → deploy

---

## 8. Technical Risks

| Risk | Mitigation | Owner |
|---|---|---|
| Hexagonal boilerplate overhead slows initial sprints | Scaffold both services in Sprint 1 with full layer structure; templates reused after that | Backend Dev |
| Spring Batch schema conflicts with app schema | Use separate Flyway location `db/migration/batch` and separate schema prefix | DBA |
| ical4j timezone issues for Morocco (Africa/Casablanca) | Unit test all events with explicit timezone; use `ZoneId.of("Africa/Casablanca")` throughout | Tester |
| Angular bundle size bloat (calendar library) | Lazy-load calendar route; measure bundle with `ng build --stats-json` | Frontend Dev |
| RabbitMQ message loss on scraper crash | Publish confirm + persistent messages; DLQ for failed deliveries | Backend Dev |
