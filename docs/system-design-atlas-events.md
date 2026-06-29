# System Design: Atlas Events
**PRD Reference**: docs/prd-atlas-events.md
**Version**: 1.0 | **Date**: 2026-06-29 | **Author**: System Designer

---

## 1. Non-Functional Requirements

| Attribute | Target | Measurement |
|---|---|---|
| Availability | 99.5% / month (~3.6 hr downtime/month) | K8s liveness + readiness probes; uptime monitor |
| Latency (p99) | < 500 ms — event list/calendar queries | Load test at 50 concurrent users |
| Latency (p99) | < 800 ms — iCal feed generation | Load test |
| Throughput | 50 RPS peak (5× avg at 500 DAU) | Stress test; single `atlas-api` pod sufficient |
| Scraper frequency | Every 6 hours per source | K8s CronJob schedule |
| Data volume | < 10 MB/year events data (≤ 10K events at 1 KB avg) | Negligible — no sharding needed |
| Log retention | Scrape logs: 90 days; Events: indefinite | PostgreSQL TTL job |
| RTO | < 15 minutes | K8s pod restart + readiness gate |
| RPO | < 6 hours (one scraper cycle) | PostgreSQL in K8s with PVC; no data enters only via scraper |
| Security | OWASP Top 10 addressed | Security doc + CI SAST scan |
| Accessibility | WCAG 2.1 AA | Automated axe-core + manual RTL check |

### Capacity Estimation
```
DAU (90-day target):        1 000 users
Requests / user / day:      ~20  (browse, filter, view detail, iCal)
Average RPS:                1 000 × 20 / 86 400 ≈ 0.23 RPS
Peak RPS (5× avg):          ~1.2 RPS  → single pod is sufficient

Event records:              500 at launch → 5 000 at 1 year
Storage (events + logs):    < 50 MB — PostgreSQL single-node is fine
DB connections (1 pod):     pool_size = 10 → no PgBouncer needed at MVP
```

---

## 2. Component Topology

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT LAYER                                                   │
│                                                                 │
│  [Angular SPA]        [iCal Clients]      [Admin Browser]       │
│  (served by Nginx     (Apple Calendar,     (same Angular app,   │
│   in K8s Ingress)      Google Calendar)    /admin route)        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  INGRESS LAYER                                                  │
│                                                                 │
│  [Kubernetes Ingress + Nginx]                                   │
│   - TLS termination (cert-manager / Let's Encrypt)             │
│   - Route /api/* → atlas-api Service                           │
│   - Route /ical/* → atlas-api Service                          │
│   - Route /* → Angular static files (ConfigMap / Nginx pod)    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP (cluster-internal)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER                                              │
│                                                                 │
│  ┌─────────────────────────────────────┐                        │
│  │  atlas-api (Spring Boot 3 / Java 21)│                        │
│  │  K8s Deployment — 1 pod (HPA ready)│                        │
│  │                                     │                        │
│  │  • REST API  (/api/v1/*)            │                        │
│  │  • iCal feed (/ical)                │                        │
│  │  • Admin endpoints (JWT-gated)      │                        │
│  │  • RabbitMQ consumer (ScrapedEvent) │                        │
│  │  • Deduplication + persistence      │                        │
│  │  • Spring Boot Actuator (/health)   │                        │
│  └──────────┬──────────────────────────┘                        │
│             │                    ▲                              │
│             │ JDBC               │ AMQP                         │
│             ▼                    │                              │
│  ┌──────────────────┐   ┌────────┴───────────────┐             │
│  │   PostgreSQL 16   │   │   RabbitMQ 3.x         │             │
│  │   K8s StatefulSet │   │   K8s StatefulSet      │             │
│  │   (PVC 20Gi)      │   │   Exchange: events     │             │
│  │                   │   │   Queue: events.scraped │             │
│  │   • events        │   │   Queue: scrape.trigger │             │
│  │   • submissions   │   │   DLQ:   events.dead   │             │
│  │   • scrape_log    │   └────────────────────────┘             │
│  └──────────────────┘            ▲                              │
│                                  │ AMQP (publish)               │
│  ┌───────────────────────────────┴────────────────────┐         │
│  │  atlas-scraper (Spring Boot 3 / Java 21)           │         │
│  │  K8s CronJob — runs every 6 hours                  │         │
│  │                                                    │         │
│  │  • Spring Batch jobs per scraper source            │         │
│  │  • Sources: 10times, allconferencealert, pcns,     │         │
│  │             + city-specific (per sprint)           │         │
│  │  • Robots.txt compliance check                     │         │
│  │  • Publishes ScrapedEvent → events.scraped queue   │         │
│  │  • Publishes ScrapeJobResult → scrape.results      │         │
│  │  • Consumes scrape.trigger (manual runs)           │         │
│  └────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  OBSERVABILITY                                                  │
│                                                                 │
│  [Structured Logs] → stdout → K8s log collector (Loki/EFK)     │
│  [Metrics] → Spring Boot Actuator → Prometheus → Grafana        │
│  [Alerts] → Alertmanager → email/webhook                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Flows

### Read Path — Event List / Calendar / Detail
```
[Angular] ──HTTPS──→ [Ingress] ──HTTP──→ [atlas-api]
                                              │
                                        [QueryService]
                                              │
                                        [PostgreSQL]
                                       (indexed query)
                                              │
                                        [JSON response]
                                              │
                                         ←──────────────
```

### Read Path — iCal Feed
```
[Calendar App] ──HTTPS──→ [Ingress] ──→ [atlas-api /ical?city=X&category=Y]
                                               │
                                        [IcalService — ical4j]
                                               │
                                        [PostgreSQL — approved events]
                                               │
                                        [.ics response, text/calendar]
```

### Write Path — Community Submission
```
[Angular form] ──POST /api/v1/submissions──→ [atlas-api]
                                                   │
                                          [Input validation]
                                                   │
                                          [PostgreSQL — submissions table]
                                          (status = PENDING)
                                                   │
                                          [201 Created response]
```

### Async Scrape Path (core pipeline)
```
[K8s CronJob / manual trigger]
       │
       ▼
[atlas-scraper — Spring Batch Job]
       │ 1. Fetch HTML (Jsoup / OkHttp)
       │ 2. Parse → ScrapedEvent[]
       │ 3. Publish to RabbitMQ: events.scraped
       │ 4. Publish to RabbitMQ: scrape.results (job summary)
       ▼
[RabbitMQ — events.scraped queue]
       │
       ▼
[atlas-api — RabbitMQ consumer]
       │ 1. Receive ScrapedEvent message
       │ 2. Deduplicate (source_url + title_fr + start_date)
       │ 3. Persist to PostgreSQL (status = APPROVED if from scraper)
       │ 4. Write scrape_log entry on job result message
       ▼
[PostgreSQL — events table]
```

### Admin Path
```
[Admin browser] ──POST /api/v1/auth/login──→ [atlas-api]
                                                  │ JWT issued
[Admin browser] ──GET  /api/v1/admin/submissions──→ [atlas-api + JWT filter]
                                                  │
                                            [PostgreSQL]
[Admin browser] ──POST /api/v1/admin/submissions/{id}/approve──→ [atlas-api]
                                                  │
                                       [update submission status]
                                       [insert into events table]
```

---

## 4. Integration Patterns

| Integration | Pattern | Justification |
|---|---|---|
| Angular → atlas-api | REST / JSON | Standard SPA pattern; simple, debuggable |
| atlas-scraper → atlas-api | RabbitMQ AMQP (async) | Decouples scraper lifecycle from API; scraper can run as K8s CronJob without caring if API is busy |
| atlas-api → atlas-api (internal) | In-process Spring services | No inter-service HTTP needed within atlas-api |
| Admin trigger → atlas-scraper | RabbitMQ `scrape.trigger` queue | API publishes trigger message; scraper consumes; no direct HTTP coupling |
| iCal clients → atlas-api | REST (text/calendar response) | Standard iCal subscription protocol |

---

## 5. Scalability Strategy

Current load is minimal (< 5 RPS peak). Scalability decisions:

| Layer | Now | When to Scale |
|---|---|---|
| atlas-api | 1 pod | Add HPA if p99 > 400ms sustained |
| atlas-scraper | 1 CronJob pod | Parallel Spring Batch partitioning if scraper runtime > 4 hrs |
| PostgreSQL | Single StatefulSet | Read replica if read queries > 500 RPS |
| RabbitMQ | Single StatefulSet | Cluster if queue depth > 10K messages persists |
| Angular SPA | Nginx in K8s | CDN if users outside Morocco appear |

**Cache strategy**: None for MVP. Event list queries with proper indexes will be fast enough at this volume. Add Redis if p99 degrades after 10K+ events.

---

## 6. System Design Decision Records

### SDR-1: RabbitMQ as message broker
**NFR Driver**: Scraper decoupling (scraper runs as K8s CronJob → must not need live HTTP target)
**Decision**: RabbitMQ 3.x — user explicitly chose this. Provides durable queues, dead-letter exchange for failed messages, and routing via exchanges.
**Alternatives rejected**: Redis Streams (simpler but no DLQ routing), Kafka (overkill — < 100 messages/day)
**Trade-off**: Adds operational component. Mitigated by running as K8s StatefulSet.
**Re-evaluate when**: Message volume exceeds 100K/day or fan-out to 3+ consumers needed → then Kafka.

### SDR-2: Kubernetes deployment
**NFR Driver**: 99.5% availability; user-chosen architecture
**Decision**: Kubernetes — both services + PostgreSQL + RabbitMQ deployed as K8s workloads. cert-manager for TLS, Nginx Ingress for routing.
**Alternatives rejected**: Docker Compose on VPS (simpler but no self-healing, no HPA), plain VMs.
**Trade-off**: Higher ops complexity. Mitigated by Docker Compose for local dev; K8s introduced at Sprint 8.
**Re-evaluate when**: Team grows past 3 engineers → service mesh (Istio) may be warranted.

### SDR-3: No caching layer at MVP
**NFR Driver**: p99 < 500ms at < 50 RPS — achievable with PostgreSQL indexes alone
**Decision**: Skip Redis. Event list query with indexed city + category + start_date will be < 50ms at current scale.
**Re-evaluate when**: Event count > 50K or DAU > 10K.

### SDR-4: Single-region deployment
**NFR Driver**: Morocco-only audience; budget constraint; 1-developer team
**Decision**: Single region (choose closest — Europe West or Morocco-adjacent VPS/cloud).
**Re-evaluate when**: International traffic appears or 99.99% SLA is required.

### SDR-5: Angular SPA served via Nginx in K8s (not CDN)
**NFR Driver**: Simplicity; sub-1K DAU doesn't justify CDN cost
**Decision**: Angular build artifacts served by a lightweight Nginx pod in K8s. Ingress routes `/` to Nginx, `/api` to atlas-api.
**Re-evaluate when**: First-load performance complaints or DAU > 5K.
