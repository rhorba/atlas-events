# PRD: Atlas Events
**Version**: 1.0 | **Date**: 2026-06-29 | **Author**: Project Manager | **Status**: Draft

---

## 1. Problem Statement

Morocco's major cities — Casablanca, Marrakech, Tangier, Agadir, and Rabat — host hundreds of economic conferences, startup summits, policy forums, and networking events each year. These events are scattered across dozens of uncoordinated websites, Facebook groups, and local listings with no unified discovery platform. Professionals miss relevant events in their city or region because aggregation simply does not exist at the national scale.

RabatEvents demonstrated the model works for a single city. Atlas Events scales it to all of Morocco.

---

## 2. Goals & Success Metrics

| Goal | Metric | Target | Baseline |
|---|---|---|---|
| Event coverage | Events indexed at launch | ≥ 200 across 5 cities | 0 |
| Growth | Events indexed at 60-day mark | ≥ 500 | 0 |
| Audience | Monthly active users at 90 days | ≥ 1 000 | 0 |
| Freshness | Scraper run frequency | Every 6 hours | — |
| Admin speed | Submission review turnaround | ≤ 24 hours | — |
| Performance | API p99 response time | < 500 ms | — |
| Reliability | Service uptime | ≥ 99.5% SLA | — |

---

## 3. User Stories

### Attendee
- [ ] As an attendee, I want to browse events filtered by city and category so that I find what's relevant to me.
- [ ] As an attendee, I want to view a calendar layout so that I can see upcoming events on a timeline.
- [ ] As an attendee, I want to subscribe to an iCal feed (by city or category) so that events appear in my calendar app automatically.
- [ ] As an attendee, I want to read event details (date, venue, organizer, registration link) in French or Arabic so that I can understand and register.
- [ ] As an attendee, I want to filter by date range (this week, this month, 3 months) so that I plan ahead without noise.

### Event Organizer
- [ ] As an organizer, I want to submit my event via a simple form so that it gets listed on Atlas Events.
- [ ] As an organizer, I want to receive a confirmation that my submission is under review so that I know it was received.

### Admin
- [ ] As an admin, I want to review pending community submissions and approve or reject them so that only legitimate events are listed.
- [ ] As an admin, I want to monitor scraper health (last run, events found, errors) so that I can detect pipeline failures.
- [ ] As an admin, I want to manually trigger a scrape run so that I can refresh data on demand.
- [ ] As an admin, I want to edit or delete any event so that incorrect listings are corrected quickly.

---

## 4. Scope

### In Scope
- Event discovery portal covering 5 cities: Rabat, Casablanca, Marrakech, Tangier, Agadir
- `atlas-scraper` service: Spring Batch jobs scraping at least 3 known sources (10times, allconferencealert, pcns) + city-specific sources
- `atlas-api` service: REST API for events, submissions, iCal feeds, admin operations
- Angular SPA frontend: event list, calendar view, event detail, submission form, admin dashboard
- Bilingual support: French (primary) + Arabic (RTL)
- Community event submission with admin moderation queue
- iCal subscription feeds filterable by city and/or category
- RabbitMQ async pipeline: scraper publishes raw events → API consumes, deduplicates, persists
- Admin authentication (JWT, single admin user for MVP)
- Kubernetes deployment for both services + PostgreSQL + RabbitMQ

### Out of Scope (MVP)
- Attendee user accounts / registration / personalization
- Ticketing or payment processing
- Email/SMS notifications to attendees
- Mobile native apps (iOS / Android)
- Multi-admin role management (single admin user is sufficient for MVP)
- Paid promoted listings
- Analytics dashboard beyond scraper health

---

## 5. Requirements

### Functional
- **FR-1**: Event list page — paginated, filterable by city, category, and date range. Default: upcoming events across all cities.
- **FR-2**: Calendar page — month/week view of events with city/category filter.
- **FR-3**: Event detail page — full event info (title, description, dates, venue, organizer, registration URL) in FR/AR.
- **FR-4**: iCal feed endpoint — `GET /api/v1/ical?city=casablanca&category=startup` returns valid iCal (.ics).
- **FR-5**: Submit event form — title (FR), start/end date, city, organizer, category, registration URL, optional description. Stores as pending submission.
- **FR-6**: Admin login — JWT-protected endpoint. Single admin user configured via env vars.
- **FR-7**: Admin submission queue — list pending submissions, approve or reject with optional note.
- **FR-8**: Admin event management — edit or soft-delete any event.
- **FR-9**: Admin scraper dashboard — view last N scrape runs per source (start time, events found/inserted, success/error).
- **FR-10**: Admin manual scrape trigger — POST endpoint that enqueues a scrape job.
- **FR-11**: Scraper pipeline — `atlas-scraper` runs scheduled Spring Batch jobs, publishes `ScrapedEvent` messages to RabbitMQ queue. `atlas-api` consumer deduplicates and persists.
- **FR-12**: Deduplication — events are deduplicated by (source URL + title_fr + start_date). Duplicate payloads are silently skipped.
- **FR-13**: Language toggle — FR/AR toggle persisted in localStorage, applies RTL layout for Arabic.

### Non-Functional
- **NFR-1**: Performance — API p99 < 500 ms for event list queries; calendar queries < 800 ms.
- **NFR-2**: Availability — 99.5% monthly uptime for `atlas-api`. Scraper downtime does not affect API availability.
- **NFR-3**: Security — OWASP Top 10 addressed. Admin endpoints protected by JWT. Input validation on all endpoints. HTTPS enforced.
- **NFR-4**: Accessibility — WCAG 2.1 AA minimum. RTL layout for Arabic. Keyboard navigable.
- **NFR-5**: Scalability — Kubernetes HPA configured for `atlas-api`. Scraper runs as one-off Job or CronJob.
- **NFR-6**: Data retention — Events stored indefinitely; scrape logs retained 90 days.
- **NFR-7**: Observability — Structured JSON logging (Logback). Health check endpoints on both services.

---

## 6. Constraints & Assumptions

### Constraints
- Stack is fixed: Spring Boot 3.x / Java 21, Angular 17+, PostgreSQL 16, RabbitMQ 3.x, Kubernetes.
- Team size: 1 developer. Documentation-first, sprint-by-sprint.
- Scraping is HTML-only (no paid data feeds). Must respect `robots.txt`.
- No budget for paid cloud services beyond a basic VPS/managed K8s cluster.

### Assumptions
- The 3 existing RabatEvents scrapers (10times, allconferencealert, pcns) cover national events. City-specific sources will be added per city in later sprints.
- Admin is a single trusted user. No need for multi-admin or RBAC in MVP.
- PostgreSQL is self-hosted inside the Kubernetes cluster for MVP; can migrate to managed (RDS/Supabase) later.
- RabbitMQ is deployed inside the Kubernetes cluster for MVP.

---

## 7. Risks

| ID | Risk | Probability | Impact | Severity | Mitigation |
|---|---|---|---|---|---|
| R01 | Scraper breakage when source sites change HTML | High | High | Critical | Modular scraper design; alerting on 0-result runs; manual trigger for recovery |
| R02 | RabbitMQ + K8s operational complexity slows delivery | Medium | High | High | Docker Compose for local dev; introduce K8s after API + scraper are proven |
| R03 | Scraping legality / robots.txt violations | Medium | High | High | Parse and honour robots.txt (implemented in RabatEvents — carry forward) |
| R04 | Poor Arabic content quality from scraped sources | High | Medium | High | FR is primary language; AR translations are optional per event |
| R05 | Duplicate event noise degrading UX | Medium | Medium | Medium | Deduplication rule enforced at DB level (unique constraint) + app level |
| R06 | Single admin bottleneck on submission review | Low | Medium | Low | 24-hour SLA; add multi-admin in post-MVP if needed |

---

## 8. Timeline

| Milestone | Target | Notes |
|---|---|---|
| PRD Approved | 2026-06-29 | This session |
| All Foundation Docs Approved | 2026-06-29 | This session |
| Sprint 1–2: atlas-api + DB | 2026-07-13 | Scaffold, migrations, event CRUD, iCal |
| Sprint 3–4: atlas-scraper + RabbitMQ | 2026-07-27 | Batch jobs, queue integration |
| Sprint 5–6: Angular Frontend | 2026-08-10 | Event list, calendar, detail, submit form |
| Sprint 7: Admin Dashboard | 2026-08-17 | Moderation queue, scraper health |
| Sprint 8: K8s Deployment + Go-Live | 2026-08-31 | CI/CD, hardening, launch |
