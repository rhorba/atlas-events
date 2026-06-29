# Epics & Stories: Atlas Events
**PRD**: docs/prd-atlas-events.md
**Architecture**: docs/architecture-atlas-events.md
**Test Strategy**: docs/test-strategy-atlas-events.md
**Version**: 1.0 | **Date**: 2026-06-29 | **Author**: Scrum Master + Test Architect

---

## Definition of Done (applies to every story)

- [ ] Code written and merged to `main`
- [ ] All acceptance criteria pass as automated tests
- [ ] Unit + integration coverage ≥ 80% on changed module
- [ ] Lint passes (Checkstyle / ESLint)
- [ ] No Critical or High security findings introduced
- [ ] Deployed to staging and smoke-tested
- [ ] `.logs/activity.md` updated with DONE entry

---

## Epic 1 — Atlas API Foundation
**Goal**: Running Spring Boot API serving events, iCal, and submissions from PostgreSQL.
**Sprints**: 1–2 (2026-06-30 → 2026-07-13)

---

### Story 1.1 — Multi-module Maven scaffold
**Priority**: Must | **Size**: M | **Specialist**: Backend Dev

As a developer, I want a working multi-module Maven project so that atlas-api and atlas-scraper share dependencies and build in CI.

**Acceptance Criteria**:
- Given the repo root, when `mvn clean package -DskipTests` runs, then both `atlas-api` and `atlas-scraper` JARs are produced without error
- Given `mvn verify`, when both modules run, then Surefire + Failsafe reports are generated
- Given `docker compose up`, when all services start, then atlas-api responds on `localhost:8080/actuator/health` with `{"status":"UP"}`

**Technical Notes**:
- Parent `pom.xml` at repo root with `<modules>atlas-api, atlas-scraper</modules>`
- Spring Boot 3.x / Java 21 (temurin), Spring Data JPA, Flyway, Spring Security, Spring AMQP
- `application.yml` uses `@ConfigurationProperties` classes — no raw `@Value` fields
- `.env.example` mounted as env vars in Docker Compose — see docs/devops-atlas-events.md

---

### Story 1.2 — Database schema + Flyway migrations
**Priority**: Must | **Size**: M | **Specialist**: Backend Dev + DBA

As a developer, I want the database schema applied automatically on startup so that the team never runs SQL scripts manually.

**Acceptance Criteria**:
- Given atlas-api starts against an empty PostgreSQL instance, when Flyway runs, then `events`, `event_submissions`, and `scrape_logs` tables exist with all columns from docs/database-atlas-events.md
- Given `V001__create_events.sql` runs, when queried, then the dedup unique index `uq_events_source_title_date` is present
- Given `V004__create_batch_schema.sql` runs, then schema `batch` exists and Spring Batch auto-creates its tables within it
- Given a second startup, when Flyway runs again, then it is a no-op (idempotent)

**Technical Notes**: ADR-5 (Flyway). Migrations in `atlas-api/src/main/resources/db/migration/`. Spring Batch uses `table-prefix: batch.BATCH_`.

---

### Story 1.3 — Event list API with filters
**Priority**: Must | **Size**: L | **Specialist**: Backend Dev

As an attendee, I want to query events filtered by city, category, and date range so that I see only relevant upcoming events.

**Acceptance Criteria**:
- Given 10 approved events across 5 cities, when `GET /api/v1/events` is called with no params, then all 10 events are returned ordered by `start_date ASC`
- Given events in Casablanca (3) and Rabat (2), when `GET /api/v1/events?city=casablanca`, then only 3 events are returned
- Given events on different dates, when `GET /api/v1/events?range=week`, then only events within the next 7 days are returned
- Given `page=0&size=5` with 10 events, when queried, then 5 events are returned and `meta.total=10`
- Given a deleted event (`deleted_at IS NOT NULL`), when queried, then it never appears in results
- Given `size=999`, when queried, then response is capped at 50 (max page size)

**Technical Notes**: ADR-4 (package-by-feature). `EventController` → `EventService` → `EventRepository` (port) → `EventRepositoryAdapter` (Spring Data JPA). Index `idx_events_active_query` covers this query. Use `Pageable` with max size cap.

---

### Story 1.4 — Event detail API
**Priority**: Must | **Size**: S | **Specialist**: Backend Dev

As an attendee, I want to view full details of a single event so that I can decide whether to attend and register.

**Acceptance Criteria**:
- Given an existing event with `id=X`, when `GET /api/v1/events/X`, then all fields are returned including `title`, `description`, `startDate`, `endDate`, `venue`, `organizer`, `registrationUrl`, `isFree`, `category`, `tags`
- Given a non-existent ID, when `GET /api/v1/events/unknown-id`, then the response status is 404
- Given a soft-deleted event, when `GET /api/v1/events/{id}`, then the response status is 404

---

### Story 1.5 — iCal feed endpoint
**Priority**: Must | **Size**: M | **Specialist**: Backend Dev

As an attendee, I want to subscribe to an iCal feed so that upcoming events automatically appear in my calendar app.

**Acceptance Criteria**:
- Given 3 approved upcoming Casablanca events, when `GET /ical?city=casablanca`, then the response `Content-Type` is `text/calendar` and the body contains 3 `VEVENT` entries
- Given `GET /ical` with no params, then all upcoming events are included
- Given any event, when its `VEVENT` is parsed, then `DTSTART` uses timezone `Africa/Casablanca` (not UTC offset)
- Given `GET /ical?city=casablanca&category=startup`, then only matching events are returned

**Technical Notes**: ADR-7 (ical4j). `IcalService` uses `ical4j` library. `ZoneId.of("Africa/Casablanca")` throughout — see test-strategy adversarial edge case.

---

### Story 1.6 — Community submission API
**Priority**: Must | **Size**: M | **Specialist**: Backend Dev

As an event organiser, I want to submit my event so that it can be reviewed and listed on Atlas Events.

**Acceptance Criteria**:
- Given a valid payload (titleFr, startDate, city, category, organiser, registrationUrl), when `POST /api/v1/submissions`, then status 201 and the submission is stored with `status=PENDING`
- Given a payload missing `titleFr`, when `POST /api/v1/submissions`, then status 400 with field-level error for `titleFr`
- Given a `registrationUrl` of `javascript:alert(1)`, when submitted, then status 400 (URL format validation fails)
- Given any submission response, then `contactEmail` is absent from the response body
- Given 11 submissions from the same IP within 1 hour, when the 11th is attempted, then status 429

**Technical Notes**: `@Valid` on `@RequestBody`. `contactEmail` annotated `@JsonIgnore` in response DTO. Bucket4j for rate limiting.

---

### Story 1.7 — Admin authentication
**Priority**: Must | **Size**: M | **Specialist**: Backend Dev

As the admin, I want to log in with a username and password so that I can access the protected admin endpoints.

**Acceptance Criteria**:
- Given correct admin credentials, when `POST /api/v1/auth/login`, then status 200 with `{"token": "...", "expiresAt": "..."}` and the token is a valid JWT (iss=`atlas-events`, exp=1hr)
- Given wrong password, when `POST /api/v1/auth/login`, then status 401 and message is `"Invalid credentials"` — does not reveal which field was wrong
- Given a valid JWT, when `GET /api/v1/admin/submissions`, then status 200
- Given no Authorization header, when `GET /api/v1/admin/submissions`, then status 401
- Given an expired JWT, when any admin endpoint is called, then status 401
- Given 10 consecutive failed login attempts from one IP, then status 429 for 15 minutes

**Technical Notes**: ADR-6 (stateless JWT). `JwtService` + `JwtAuthFilter`. `ADMIN_PASSWORD` compared via `BCryptPasswordEncoder`. Bucket4j login rate limit.

---

## Epic 2 — Scraper Pipeline
**Goal**: atlas-scraper publishes scraped events to RabbitMQ; atlas-api consumes, deduplicates, and persists.
**Sprints**: 3–4 (2026-07-14 → 2026-07-27)

---

### Story 2.1 — Spring Batch + RabbitMQ infrastructure
**Priority**: Must | **Size**: M | **Specialist**: Backend Dev

As a developer, I want Spring Batch wired to RabbitMQ so that scraper jobs can publish events asynchronously.

**Acceptance Criteria**:
- Given atlas-scraper starts, when connected to RabbitMQ, then exchange `events`, queues `events.scraped`, `scrape.results`, `scrape.trigger`, and DLQ `events.dead` are all created
- Given atlas-api starts, when connected to RabbitMQ, then the same queues exist and consumers are registered
- Given a test message published to `events.scraped`, when atlas-api consumer processes it, then a log entry is written at INFO level

**Technical Notes**: ADR-2 (Spring Batch). `RabbitMQConfig.java` beans in both services. Dead-letter exchange config: `x-dead-letter-exchange: events.dead`, max retries 3.

---

### Story 2.2 — 10times.com scraper
**Priority**: Must | **Size**: L | **Specialist**: Backend Dev

As the system, I want to scrape 10times.com for Moroccan events so that they are indexed automatically.

**Acceptance Criteria**:
- Given the 10times fixture HTML (`src/test/resources/fixtures/10times.html`), when `TentimesScraper.scrape(url)` is called, then it returns a non-empty list of `ScrapedEvent` objects with valid `title.fr`, `startDate`, `city`, `category`, and `source.url`
- Given a 10times URL, when the scraper runs and `robots.txt` disallows the path, then the scraper skips the URL and logs `"disallowed by robots.txt"`
- Given the source site returns HTTP 500, when the scraper runs, then the Spring Batch step is marked FAILED, `ScrapeJobResult` is published with `success=false`, and no crash occurs

**Technical Notes**: ADR-3 (Strategy pattern). `TentimesScraper implements EventScraper`. Jsoup for HTML parsing. `RobotsChecker` called before HTTP fetch. Fixture HTML stored from a real crawl.

---

### Story 2.3 — AllConferenceAlert scraper
**Priority**: Must | **Size**: M | **Specialist**: Backend Dev

As the system, I want to scrape allconferencealert.com for Moroccan events.

**Acceptance Criteria** (mirrors Story 2.2 pattern):
- Given fixture HTML, when `AllConferenceAlertScraper.scrape(url)` is called, then valid `ScrapedEvent` objects are returned
- Given robots.txt check, same skip/log behaviour
- Given HTTP error, same graceful failure behaviour

---

### Story 2.4 — PCNS scraper
**Priority**: Must | **Size**: M | **Specialist**: Backend Dev

As the system, I want to scrape pcns.info for Moroccan events.

**Acceptance Criteria**: mirrors Story 2.3.

---

### Story 2.5 — RabbitMQ consumer + deduplication
**Priority**: Must | **Size**: L | **Specialist**: Backend Dev

As the system, I want atlas-api to consume scraped events, deduplicate them, and persist new ones so that the events table stays clean.

**Acceptance Criteria**:
- Given a valid `ScrapedEvent` message on `events.scraped`, when atlas-api consumes it, then a new row is inserted in the `events` table with `submissionStatus=APPROVED`
- Given a duplicate message (same `source.url`, `title.fr`, `startDate`), when consumed, then no duplicate row is inserted and no error is thrown (silent no-op via `ON CONFLICT DO NOTHING`)
- Given 1000 duplicate messages published simultaneously, when consumed, then exactly 1 row exists (unique constraint holds under concurrency)
- Given a malformed message (missing required field), when consumption fails after 3 retries, then the message is routed to `events.dead` DLQ and an error is logged

**Technical Notes**: `ScrapedEventConsumer` (`@RabbitListener`). PostgreSQL unique constraint `uq_events_source_title_date` + `ON CONFLICT DO NOTHING` in `EventRepositoryAdapter`. DLQ routing via `x-dead-letter-exchange`.

---

### Story 2.6 — Scrape log + admin trigger
**Priority**: Must | **Size**: S | **Specialist**: Backend Dev

As the admin, I want to see scraper run history and trigger a manual scrape so that I can monitor pipeline health.

**Acceptance Criteria**:
- Given a completed scraper job, when `ScrapeJobResult` message is consumed by atlas-api, then a `ScrapeLog` row is created with source, url, eventsFound, eventsInserted, success, and finishedAt
- Given a valid admin JWT, when `POST /api/v1/admin/scrape/trigger`, then a trigger message is published to `scrape.trigger` queue and status 202 is returned
- Given a valid admin JWT, when `GET /api/v1/admin/scrape-logs?source=10times&limit=20`, then the 20 most recent log entries for that source are returned ordered by `startedAt DESC`

---

## Epic 3 — Angular Frontend
**Goal**: Public-facing SPA with event list, calendar, detail, and submission form.
**Sprints**: 5–6 (2026-07-28 → 2026-08-10)

---

### Story 3.1 — Angular scaffold + core services
**Priority**: Must | **Size**: M | **Specialist**: Frontend Dev

As a developer, I want an Angular 17 project with routing, HTTP client, and core services so that feature modules can be built independently.

**Acceptance Criteria**:
- Given `ng serve`, when the app starts, then `localhost:4200` loads without console errors
- Given any page, when the user changes the language toggle to AR, then `<html dir="rtl" lang="ar">` is set and the layout mirrors
- Given the Angular build, when `ng build --configuration production`, then the main bundle is < 500 KB gzipped
- Given any API call, when the request is made, then it targets `environment.apiUrl` — no hardcoded localhost URLs

**Technical Notes**: Angular Material MDC theme configured (`atlas-theme`). `BidiModule` from Angular CDK. `TranslateModule` (ngx-translate) for FR/AR strings. Lazy-loaded routes for all feature modules (ADR-8).

---

### Story 3.2 — Event list page
**Priority**: Must | **Size**: L | **Specialist**: Frontend Dev

As an attendee, I want to browse events with city, category, and date range filters so that I find relevant events quickly.

**Acceptance Criteria**:
- Given the page loads, when events are fetching, then 3 skeleton cards are shown (loading state)
- Given events are loaded, when displayed, then each card shows category badge, date, title, city, and organiser
- Given city filter changes to "Casablanca", when applied, then only Casablanca events are shown and the URL updates to `?city=casablanca`
- Given no events match the current filters, when rendered, then the empty state message is shown with a "Réinitialiser les filtres" link
- Given a shareable URL with `?city=casablanca&category=startup`, when loaded, then the filters are pre-applied
- Given the AR language is active, when the page renders, then all text is right-aligned and the layout mirrors

**Technical Notes**: Event card uses `--color-bg-surface` + `--shadow-sm`. Category badge uses per-category colour tokens from docs/ui-atlas-events.md. iCal subscribe button with dynamic `aria-label`.

---

### Story 3.3 — Event detail page
**Priority**: Must | **Size**: M | **Specialist**: Frontend Dev

As an attendee, I want to view full event details so that I can decide whether to attend and get the registration link.

**Acceptance Criteria**:
- Given an event ID in the URL, when the page loads, then title, dates, city, venue, organiser, description, registration link, and category badge are displayed
- Given a `registrationUrl`, when "S'inscrire" is clicked, then the link opens in a new tab
- Given the "Ajouter au calendrier" button, when clicked, then the single-event `.ics` file is downloaded (or subscribe URL is copied)
- Given a non-existent event ID, when the page loads, then a 404 message and "Retour aux événements" link are shown

---

### Story 3.4 — Calendar view
**Priority**: Must | **Size**: L | **Specialist**: Frontend Dev

As an attendee, I want to see events on a calendar so that I can plan my month at a glance.

**Acceptance Criteria**:
- Given events exist for the current month, when the calendar page loads, then events are displayed as coloured dots/chips on their start dates
- Given a desktop viewport (≥ 1024px), when rendered, then the `dayGridMonth` FullCalendar view is used
- Given a mobile viewport (< 768px), when rendered, then the `listWeek` FullCalendar view is used
- Given a category filter is applied, when the calendar re-renders, then only matching events are shown
- Given an event chip is clicked, when triggered, then navigation goes to `/events/{id}`

**Technical Notes**: `@fullcalendar/angular` + `@fullcalendar/daygrid` + `@fullcalendar/list`. Locale set to `fr` by default; `ar` when AR active. Lazy-loaded route.

---

### Story 3.5 — Submit event form
**Priority**: Must | **Size**: M | **Specialist**: Frontend Dev

As an event organiser, I want to submit my event via a form so that it gets listed after review.

**Acceptance Criteria**:
- Given the form is filled correctly, when "Soumettre l'événement" is clicked, then the submit button shows a spinner and is disabled to prevent double-submit
- Given a successful API response (201), when received, then the success state is shown: "Votre événement a été soumis. Il sera examiné dans les 24 heures."
- Given a field fails validation, when the user leaves the field, then an inline error message appears below it via Mat Error
- Given a 429 rate-limit response, when received, then the error banner shows "Trop de soumissions — réessayez dans une heure"
- Given the success state, when "Soumettre un autre événement" is clicked, then the form resets cleanly

---

### Story 3.6 — FR/AR language toggle
**Priority**: Must | **Size**: S | **Specialist**: Frontend Dev

As a Moroccan user, I want to switch between French and Arabic so that I can use the app in my preferred language.

**Acceptance Criteria**:
- Given the FR/AR toggle in the nav, when AR is selected, then all UI strings switch to Arabic, `<html dir="rtl" lang="ar">` is set, and the chosen language is persisted in `localStorage`
- Given AR is active, when the page reloads, then AR remains active (from localStorage)
- Given AR is active, when CSS is inspected, then all spacing uses CSS logical properties (`margin-inline-start`, not `margin-left`)
- Given the language toggle buttons, when focused, then the active language has a visible focus ring

---

## Epic 4 — Admin Dashboard
**Goal**: JWT-protected admin area for submission moderation, event management, and scraper monitoring.
**Sprint**: 7 (2026-08-11 → 2026-08-17)

---

### Story 4.1 — Admin login page
**Priority**: Must | **Size**: S | **Specialist**: Frontend Dev

As the admin, I want to log in via a browser form so that I can access the admin dashboard.

**Acceptance Criteria**:
- Given the login form, when valid credentials are submitted, then the JWT is stored in `sessionStorage` and the user is redirected to `/admin/submissions`
- Given invalid credentials, when submitted, then the error "Identifiants invalides" is shown
- Given a non-admin user tries to navigate to `/admin/submissions` directly, then they are redirected to `/admin/login`
- Given the admin closes the tab, when they reopen it, then they must log in again (sessionStorage cleared)

---

### Story 4.2 — Submission moderation queue
**Priority**: Must | **Size**: M | **Specialist**: Frontend Dev

As the admin, I want to approve or reject pending submissions so that the event catalogue stays high-quality.

**Acceptance Criteria**:
- Given pending submissions exist, when the queue loads, then each card shows title, city, category, date, organiser, and registration link
- Given "Approuver" is clicked, when the API returns 200, then the card is removed from the queue and a success snackbar appears
- Given "Rejeter" is clicked, when triggered, then an inline note input appears; when confirmed, the submission is rejected and removed from queue
- Given the queue is empty, when rendered, then the empty state "Aucune soumission en attente 🎉" is shown
- Given an approve action fails (network error), when it occurs, then the card remains in the queue and an error snackbar appears

---

### Story 4.3 — Event management (edit + soft-delete)
**Priority**: Must | **Size**: M | **Specialist**: Frontend Dev + Backend Dev

As the admin, I want to edit or remove incorrect events so that the catalogue is accurate.

**Acceptance Criteria**:
- Given the events list in admin, when loaded, then all events (including scraped) are shown with edit and delete actions
- Given "Modifier" is clicked, when the edit form submits, then `PUT /api/v1/admin/events/{id}` is called and the event is updated
- Given "Supprimer" is clicked, when confirmed in a dialog, then `DELETE /api/v1/admin/events/{id}` soft-deletes the event and it disappears from the public list
- Given the delete dialog, when "Annuler" is clicked, then no action is taken

---

### Story 4.4 — Scraper health dashboard
**Priority**: Must | **Size**: S | **Specialist**: Frontend Dev

As the admin, I want to monitor scraper runs so that I can detect pipeline failures quickly.

**Acceptance Criteria**:
- Given scrape logs exist, when the dashboard loads, then a table shows last 20 runs per source with: source, started_at, events_found, events_inserted, status (green chip / red chip)
- Given "Déclencher un scraping" is clicked, when the API returns 202, then a success snackbar "Scraping déclenché" appears
- Given a run with `success=false`, when rendered, then the row is highlighted in red and the error message is shown on expand

---

## Epic 5 — Kubernetes + Go-Live
**Goal**: Both services running on Kubernetes, CI/CD green, monitoring active, production live.
**Sprint**: 8 (2026-08-18 → 2026-08-31)

---

### Story 5.1 — Docker Compose local validation
**Priority**: Must | **Size**: S | **Specialist**: DevOps

As a developer, I want to verify that `docker compose up` brings up all services correctly so that the local dev environment is reliable.

**Acceptance Criteria**:
- Given `docker compose up`, when all containers start, then health checks pass for postgres, rabbitmq, atlas-api, atlas-scraper, and atlas-web
- Given `docker compose up`, when atlas-api starts, then Flyway migrations run and the schema is correct
- Given `docker compose up`, when atlas-web loads at `localhost:4200`, then it fetches events from atlas-api without CORS errors

---

### Story 5.2 — Kubernetes manifests
**Priority**: Must | **Size**: L | **Specialist**: DevOps

As the ops owner, I want all K8s manifests written and validated so that staging and production can be deployed reliably.

**Acceptance Criteria**:
- Given `kubectl apply -k k8s/overlays/staging`, when applied to a clean namespace, then all Deployments, StatefulSets, Services, Ingress, and CronJob are created without errors
- Given `checkov -d k8s/`, when run, then no HIGH or CRITICAL findings are reported
- Given the Ingress, when TLS certificate is issued by cert-manager, then the domain serves HTTPS with a valid Let's Encrypt certificate
- Given the K8s NetworkPolicy, when tested, then external traffic cannot reach PostgreSQL or RabbitMQ directly

---

### Story 5.3 — GitHub Actions CI/CD pipeline
**Priority**: Must | **Size**: M | **Specialist**: DevOps

As the team, I want the full CI pipeline running on GitHub Actions so that every push is automatically validated and deployed.

**Acceptance Criteria**:
- Given a push to `main`, when the pipeline runs, then all 6 stages complete in order (secrets-scan → test → security-scan → build → deploy-staging → deploy-prod gate)
- Given any test module fails coverage < 80%, when CI runs, then the pipeline fails at the `test-*` stage
- Given Trivy finds a Critical CVE, when CI runs, then the pipeline fails at `security-scan`
- Given `deploy-staging` completes, when the staging smoke test runs, then `GET /api/v1/events` returns 200

---

### Story 5.4 — Staging smoke test + Playwright E2E
**Priority**: Must | **Size**: M | **Specialist**: Tester + DevOps

As the team, I want Playwright E2E tests to run against the staging environment so that the full stack is validated before production.

**Acceptance Criteria**:
- Given the staging environment, when the Playwright suite runs, then: event list loads, at least one event is displayed, the event detail page loads, the submit form is reachable, and the admin login flow works end-to-end
- Given the axe-core accessibility scan runs on the event list and submit form pages, then zero WCAG violations are reported
- Given the Playwright report, when uploaded to CI artifacts, then it is retained for 30 days

---

### Story 5.5 — Production go-live
**Priority**: Must | **Size**: M | **Specialist**: DevOps

As the product owner, I want the application live on the production domain so that Moroccan professionals can start using it.

**Acceptance Criteria**:
- Given `kubectl apply -k k8s/overlays/prod` is run after manual approval, when applied, then all services start and atlas-api reports `{"status":"UP"}` at `/actuator/health`
- Given the production domain, when visited, then HTTPS is enforced and the Atlas Events event list loads with real scraped events
- Given the first production scraper run, when completed, then at least 1 event is inserted and visible on the site
- Given Prometheus + Grafana are running, when the production dashboard is opened, then API RPS, error rate, and latency metrics are visible

---

## Sprint Allocation

| Sprint | Dates | Stories | Goal |
|---|---|---|---|
| **Sprint 1** | 2026-06-30 → 2026-07-06 | 1.1, 1.2, 1.3 | Maven scaffold + DB migrations + event list API |
| **Sprint 2** | 2026-07-07 → 2026-07-13 | 1.4, 1.5, 1.6, 1.7 | Event detail + iCal + submissions + admin auth |
| **Sprint 3** | 2026-07-14 → 2026-07-20 | 2.1, 2.2, 2.3 | Spring Batch infra + 10times + AllConferenceAlert |
| **Sprint 4** | 2026-07-21 → 2026-07-27 | 2.4, 2.5, 2.6 | PCNS scraper + dedup consumer + scrape log |
| **Sprint 5** | 2026-07-28 → 2026-08-03 | 3.1, 3.2, 3.6 | Angular scaffold + event list + language toggle |
| **Sprint 6** | 2026-08-04 → 2026-08-10 | 3.3, 3.4, 3.5 | Event detail + calendar + submit form |
| **Sprint 7** | 2026-08-11 → 2026-08-17 | 4.1, 4.2, 4.3, 4.4 | Full admin dashboard |
| **Sprint 8** | 2026-08-18 → 2026-08-31 | 5.1, 5.2, 5.3, 5.4, 5.5 | Docker Compose → K8s → CI/CD → go-live |
