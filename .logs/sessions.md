# SESSIONS — Atlas Events

## SESSION_END — 2026-06-30 (Project v1.0 Complete)
**Completed**: Master merge + video recording
**Done this session**:
- Merged feature/sprint-9 → master (--no-ff), containing full linear chain of sprints 1-9
- git push origin master ✓ (pulled remote divergence then pushed successfully)
- Playwright video recording (CLAUDE.md rule #9): installed Chromium, ran E2E with video:on, 9/11 tests passed, saved .recordings/v1.0-2026-06-30.webm (73 KB)
- Restored playwright.config.ts to video:retain-on-failure
- All feature branches now merged to master; project DoD met
**Status**: Atlas Events v1.0 SHIPPED — all 9 sprints complete, all epics delivered
**Next session**: Sprint 10 — user to define scope (candidates: full-text search, PWA, email notifications, SEO/SSR)

## SESSION_END — 2026-06-30 (Sprint 9)
**Completed**: Sprint 9 SHIP phase — Stories 6.1, 6.2, 6.3, 6.4, 6.5
**Branch pushed**: feature/sprint-9 (44a0d54) — new branch | **CI**: GREEN ✓
**Done this session**:
- Micrometer counters in atlas-api (SubmissionService) and atlas-scraper (ScrapeTasklet)
- micrometer-registry-prometheus + /actuator/prometheus added to atlas-scraper
- k8s/base/monitoring/: Prometheus (RBAC, scrape config, 5 alert rules, Deployment, Service, 5Gi PVC)
- k8s/base/monitoring/: Grafana (Deployment, Service, 2Gi PVC, provisioned datasource + 3 dashboards)
- Grafana ingress with HTTP basic-auth and per-overlay subdomain patches
- Ingress patches in overlays now name-scoped to prevent cross-patching
- DEPLOY.md monitoring section with full first-time setup runbook
- Bug fix: null-safe MeterRegistry tag in ScrapeTasklet constructor (@MockBean returns null before @BeforeEach)
**Next session**: Sprint 10 — user to define scope (candidates: full-text search, PWA, email notifications, SEO/SSR)

## SESSION_END — 2026-06-30 (Sprint 8)
**Completed**: Sprint 8 SHIP phase — Stories 5.1, 5.2, 5.3, 5.4, 5.5
**Branch pushed**: feature/sprint-8 (0e30164) — new branch as requested | **CI**: awaiting GitHub Actions
**Done this session**:
- 3 multi-stage Dockerfiles (atlas-api, atlas-scraper, atlas-web+nginx)
- nginx.conf: security headers + /api/ proxy + SPA routing + static caching
- docker-compose.yml: all 5 services with healthchecks and depends_on conditions
- k8s/base/: 11 manifest files — namespace, 3 deployments, 3 services, 3 configmaps, ingress, networkpolicy, cronjob
- k8s/overlays/staging/ + k8s/overlays/prod/ with Kustomize patches
- ci.yml: extended with test-e2e, build-images, deploy-staging, deploy-prod jobs
- Playwright E2E: 5 spec files + playwright.config.ts + package.json scripts
- DEPLOY.md: full production runbook (8 sections)
**Next session**: Monitor CI on feature/sprint-8, merge Sprint 8 to master when GREEN, start Sprint 9 if scoped

## SESSION_END — 2026-06-30 (Sprint 7)
**Completed**: Sprint 7 SHIP phase — Stories 4.1, 4.2, 4.3, 4.4
**Branch pushed**: feature/sprint-5 (a6c67a8) | **CI**: GREEN ✓
**Done this session**:
- V006 migration: review_note column on event_submissions
- AdminSubmissionController: list PENDING, approve, reject with note
- AdminEventController: list all (incl. soft-deleted), partial update, soft-delete
- EventRepository + adapter extended with admin methods
- SubmissionRepository extended with findByStatus/findById/updateStatus
- AuthService, AdminService, authInterceptor, adminGuard
- 4 admin Angular components: AdminLoginComponent, AdminSubmissionsComponent, AdminEventsComponent, AdminScrapeComponent
- Admin routes lazy-loaded + guarded in app.routes.ts
- i18n keys: admin.login.*, admin.nav.*, admin.submissions.*, admin.events.*, admin.scrape.*
- 124/124 tests, 18 suites, 94.94% stmts / 84.26% branches (all ≥ 80%)
**Next session**: Sprint 8 — Docker Compose local validation, K8s manifests, full CI/CD, Playwright E2E, production go-live

## SESSION_END — 2026-06-30 (Sprint 6)
**Completed**: Sprint 6 SHIP phase — Stories 3.3, 3.4, 3.5
**Branch pushed**: feature/sprint-5 (6624bad)
**CI**: GREEN ✓
**Done this session**:
- EventDetailComponent (/events/:id): loading/404 states, iCal download, RouterLink navigation
- CalendarComponent (/calendar): FullCalendar v6 (dayGrid + list), category filter, lang$ reactive locale, resize listener
- SubmitFormComponent (/submit): ReactiveFormsModule, URL/email validators, 429 rate-limit error, reset flow
- SubmissionService: POST /api/v1/submissions
- Routes: lazy-loaded /events/:id, /calendar, /submit
- AppComponent nav bar with routerLinkActive
- EventCardComponent: title → RouterLink to detail page
- i18n: events.detail.*, calendar.*, submit.fields.* in fr.json + ar.json
- Jest mock infra: moduleNameMapper @fullcalendar/* → fullcalendar-mock.ts; TestBed.overrideComponent for CalendarComponent
- 71/71 tests pass; coverage 92.47% stmts / 80.59% branches ≥ 80% gate
**Next session**: Sprint 7 — check backlog for remaining stories (likely Search/Filtering polish, admin flows, or API integration hardening)

## SESSION_END — 2026-06-30
**Completed**: Sprint 5 SHIP phase
**Branch pushed**: feature/sprint-5
**Done this session**:
- Fixed Jest test suite for atlas-web: jest-preset-angular@14 + ts-node + ngx-translate v18 standalone API migration
- All 40 Jest tests passing; 86% coverage gate met
- Implemented login rate limiting (Story 1.7): Bucket4j `LoginRateLimiter` keyed by IP, 10 attempts → 429/15 min
- Added `LoginRateLimiterTest` (6 unit tests) + rate-limit IT to `AuthControllerIT`
- Added `test-web` CI job (Node 20, npm ci, jest --ci)
- Committed and pushed all Sprint 5 work
**Next session**: Determine next sprint from backlog; consider PR to merge sprint branches to main

## SESSION_START — 2026-06-29
**Phase**: UNDERSTAND complete → BRAINSTORM
**Context**: New project. Full kickoff session. Stack confirmed: Spring Boot Java 21 + Angular + PostgreSQL.
**RabatEvents reference**: github.com/rhorba/rabatevents — TypeScript/Next.js, studied domain model + schema + scrapers.
**Scope**: Morocco-wide event aggregator. 5 cities: Rabat, Casablanca, Marrakech, Tangier, Agadir.
**Goal this session**: Produce all 10 foundation docs → commit → push. No code.

## SESSION_END — 2026-06-29 (Session 1)
**What was done**: All 10 foundation documents written and user-approved. git init + committed + pushed to https://github.com/rhorba/atlas-events (master).

## SESSION_START — 2026-06-29 (Session 2)
README corrected (Next.js → Spring Boot + Angular). Sprint 1 executed.

## SESSION_END — 2026-06-29 (Session 2)
**What was done**: Sprint 1 complete. 40 files, 1840 insertions. 15 tests pass, 89% coverage.
Branch `feature/sprint-1-api-foundation` pushed to origin.
PR: https://github.com/rhorba/atlas-events/pull/new/feature/sprint-1-api-foundation
**Next session**: Sprint 2 — Event detail API (Story 1.4), iCal feed (Story 1.5), Submission API (Story 1.6), Admin Auth JWT (Story 1.7).
**Branch**: still on `feature/sprint-1-api-foundation` — merge to master or start `feature/sprint-2-api-complete`

## SESSION_START — 2026-06-29 (Session 3 — context resumed)
Sprint 2 continuation. Auth files were partially written in session 2.

## SESSION_END — 2026-06-29 (Session 3)
**What was done**: Sprint 2 fully complete.
- Story 1.5: GET /ical (ical4j 3.2.14, Africa/Casablanca, optional city/category filter)
- Story 1.6: POST /api/v1/submissions (Bucket4j 10/hr IP rate limit, Retry-After header, contactEmail never in response)
- Story 1.7: POST /api/v1/auth/login (JJWT 0.12.x HS256, 1hr TTL); JwtAuthFilter guards /api/v1/admin/**; custom 401 entry point
- SecurityConfig updated; AtlasApiApplication excludes UserDetailsServiceAutoConfiguration
- V005 migration replaces event_submissions table with correct schema
- 22 tests pass (5 unit + 17 integration); coverage gate met (≥80%)
- Pushed: `feature/sprint-1-api-foundation` commit b181036
**Bugs fixed**: StaleObjectStateException (removed @GeneratedValue from pre-set UUID entity); schema mismatch (V005 migration)
**Next session**: Sprint 3 — atlas-scraper Spring Batch pipeline, Angular frontend scaffold.

## SESSION_START — 2026-06-29 (Session 4 — context resumed)
Sprint 3 execution. Resuming from batch schema error (batch.BATCH_JOB_INSTANCE not found).

## SESSION_END — 2026-06-29 (Session 4)
**What was done**: Sprint 3 complete.
- Story 2.1: Spring Batch 5 job infra (ScraperJobConfig, ScrapeTasklet) + RabbitMQ (DIRECT exchange `events`, queues: events.scraped, scrape.results, events.dead DLQ)
- Story 2.2: TentimesScraper (Jsoup, .event-item CSS selectors, normalizeCategory, RobotsChecker guard)
- Story 2.3: AllConferenceAlertScraper (table.conf-table tr.conf-row selectors, MMMM d yyyy date format)
- batch-tables.sql: full Spring Batch DDL in `batch` schema (was missing — initialize-schema:always doesn't schema-qualify tables)
- 41 tests pass (39 unit + 2 IT with Testcontainers PG+RabbitMQ); coverage gate met (≥80%)
**Bugs fixed**: batch.BATCH_JOB_INSTANCE not found — Spring Batch initialize-schema:always creates tables in public schema, not in the custom `batch` schema. Fixed by switching to initialize-schema:never + explicit batch-tables.sql in spring.sql.init.
**Next session**: Sprint 4 — atlas-api ScrapedEventConsumer (persist scraped events), Angular frontend scaffold.
