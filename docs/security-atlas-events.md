# Security Baseline: Atlas Events
**Architecture Reference**: docs/architecture-atlas-events.md
**Version**: 1.0 | **Date**: 2026-06-29 | **Author**: Security Engineer

---

## 1. Threat Model (5-Minute)

**What are we building?**
A public Morocco-wide event aggregator with a protected admin panel for content moderation and scraper management.

**Who would attack it?**
- Script kiddies — automated scanners probing common vulns (SQLi, path traversal, default creds)
- Spammers — flooding the community submission form with fake or malicious events
- Competitors — scraping the aggregated event catalogue (data theft)
- Curious insiders — attempting to access admin endpoints without credentials

**Worst outcome?**
1. Admin credentials compromised → attacker injects malicious events or deletes the catalogue
2. Submission form abused → spam events overwhelm the moderation queue
3. `contactEmail` data leaked → GDPR exposure (only PII in the system)

**What are we doing about it?**
See STRIDE table and controls below.

---

## 2. STRIDE Analysis

| Threat | Component | Risk | Mitigation | Status |
|---|---|---|---|---|
| **Spoofing** (fake admin identity) | `/api/v1/auth/login` | High | JWT HS256, 1-hr TTL; rate-limit login (5 req/min); brute-force lockout after 10 failures | TODO |
| **Tampering** (malicious submission payload) | `POST /api/v1/submissions` | Medium | Jakarta Bean Validation on all fields; category/city validated against enum; max lengths enforced | TODO |
| **Tampering** (event data in transit) | All HTTPS endpoints | High | TLS 1.2+ enforced at K8s Ingress; HSTS header | TODO |
| **Repudiation** (admin approves/rejects without trace) | Admin moderation endpoints | Medium | `reviewedAt` + `reviewNote` persisted on submission; structured audit log entry on every admin action | TODO |
| **Info Disclosure** (contactEmail in API response) | `GET /api/v1/admin/submissions` | High | `contactEmail` field annotated `@JsonIgnore` in DTO; never returned in any response; never logged | TODO |
| **Info Disclosure** (stack traces in errors) | All error responses | Medium | `GlobalExceptionHandler` returns only `{error, message}` — no stack trace; `spring.mvc.log-request-details=false` in prod | TODO |
| **Info Disclosure** (sensitive config in logs) | Application startup | High | Secrets loaded from K8s Secrets → env vars; `spring.config.import` never logs secret values | TODO |
| **DoS** (submission form spam) | `POST /api/v1/submissions` | High | Rate limit: 10 submissions/IP/hour via Bucket4j; CAPTCHA optional post-MVP | TODO |
| **DoS** (event list hammering) | `GET /api/v1/events` | Low | K8s resource limits per pod; nginx ingress rate limit as backstop | TODO |
| **Elevation of Privilege** (access admin endpoints without JWT) | All `/api/v1/admin/**` | Critical | Spring Security `JwtAuthFilter` validates signature + expiry + issuer on every request; 401 on any failure | TODO |
| **Elevation of Privilege** (JWT secret brute-force) | JWT validation | Medium | `JWT_SECRET` ≥ 32 random bytes (256 bits); sourced from K8s Secret; never in code or logs | TODO |

---

## 3. Authentication Strategy

**Type**: Stateless JWT (HS256)
**Who authenticates**: Single admin user only. No attendee accounts.
**MFA**: Not required for MVP (single-user, internal tool). Add TOTP if second admin is added.
**Password policy**: Admin credentials set via env vars (`ADMIN_USERNAME`, `ADMIN_PASSWORD`). `ADMIN_PASSWORD` must be ≥ 16 chars, set at deploy time, never stored in code.

### JWT Configuration
```
Algorithm:     HS256
Secret:        JWT_SECRET env var — minimum 32 random bytes (256-bit)
Access TTL:    1 hour (exp claim)
Issuer claim:  "atlas-events"  (validated on every request)
Storage:       Browser localStorage — acceptable for single admin; add refresh token post-MVP
```

### Login Flow
```
POST /api/v1/auth/login  { username, password }
  → Compare against ADMIN_USERNAME / ADMIN_PASSWORD (bcrypt-hashed at startup)
  → Rate limit: 5 req/min per IP (Bucket4j)
  → Lock out IP for 15 min after 10 consecutive failures
  → On success: return { token, expiresAt }
  → On failure: return 401 — never reveal which field was wrong
```

### JWT Validation (every protected request)
```
JwtAuthFilter (OncePerRequestFilter):
  1. Extract Bearer token from Authorization header
  2. Validate signature (HS256 with JWT_SECRET)
  3. Validate exp (not expired)
  4. Validate iss = "atlas-events"
  5. On any failure → 401 Unauthorized (no detail in response body)
```

---

## 4. Authorization Model

**Pattern**: Simple roles — binary (admin / public). No RBAC needed for MVP.

| Endpoint group | Access |
|---|---|
| `GET /api/v1/events/**` | Public |
| `GET /ical` | Public |
| `POST /api/v1/submissions` | Public (rate-limited) |
| `POST /api/v1/auth/login` | Public (rate-limited) |
| `GET/POST/PUT/DELETE /api/v1/admin/**` | Admin JWT required |
| `GET /actuator/health` | Public (liveness/readiness probes) |
| `GET /actuator/prometheus` | Internal only (K8s NetworkPolicy blocks external) |

**Resource-level checks**: Not needed for MVP — single admin owns all resources.

---

## 5. Data Protection

### PII Inventory
| Field | Table | Risk | Protection |
|---|---|---|---|
| `contact_email` | `event_submissions` | Medium (GDPR) | `@JsonIgnore` in all DTOs; never logged; column-level note in DB doc |
| Admin username/password | Environment variable | High | K8s Secret; bcrypt hash compared at runtime; plain value never stored |
| JWT secret | Environment variable | Critical | K8s Secret; never logged or exposed in `/actuator` endpoints |

### Encryption in Transit
- HTTPS enforced at K8s Ingress (cert-manager + Let's Encrypt, auto-renew)
- TLS 1.2 minimum; TLS 1.0/1.1 disabled at Nginx Ingress config
- HSTS header: `max-age=31536000; includeSubDomains`
- Internal cluster traffic (atlas-api ↔ PostgreSQL, atlas-api ↔ RabbitMQ): not encrypted for MVP (cluster-internal). Add mTLS via service mesh post-MVP if compliance requires it.

### Encryption at Rest
- PostgreSQL data directory: rely on cloud provider/VPS disk encryption (or manually enable at block device level)
- `contact_email`: consider application-level AES-256 encryption for this column if GDPR audit is anticipated (flagged as post-MVP hardening item)

### Secrets Management
```
K8s Secrets (base64, namespace-scoped):
  - atlas-api-secrets:
      DATABASE_URL, DATABASE_PASSWORD
      JWT_SECRET
      ADMIN_USERNAME, ADMIN_PASSWORD (bcrypt hash)
      RABBITMQ_PASSWORD
  - atlas-scraper-secrets:
      RABBITMQ_PASSWORD
      DATABASE_URL (read-only access for batch schema)

Never in:
  - application.properties / application.yml (committed to git)
  - Dockerfile ENV instructions
  - CI/CD pipeline logs
  - Any API response or log line
```

---

## 6. HTTP Security Headers

Configured in Spring Security `SecurityConfig.java` + Nginx Ingress annotations:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy:   default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
X-Content-Type-Options:    nosniff
X-Frame-Options:           DENY
Referrer-Policy:           strict-origin-when-cross-origin
Permissions-Policy:        geolocation=(), camera=(), microphone=()
```

Note: `unsafe-inline` in CSP is required by Angular's default styling. Replace with nonce-based CSP post-MVP if stricter policy needed.

---

## 7. OWASP Top 10 Controls

| OWASP | Control | Implementation |
|---|---|---|
| **A01 Broken Access Control** | JWT on all admin endpoints; no IDOR (UUIDs, single-admin) | Spring Security `JwtAuthFilter`; K8s NetworkPolicy for Prometheus |
| **A02 Cryptographic Failures** | TLS 1.2+; secrets in K8s Secrets; no plaintext PII | cert-manager; K8s Secrets; `@JsonIgnore` on contactEmail |
| **A03 Injection** | ORM parameterized queries only; no native SQL strings | Spring Data JPA; no `@NativeQuery` with user input |
| **A04 Insecure Design** | Threat model documented; rate limiting on unauthenticated endpoints | This doc; Bucket4j on login + submissions |
| **A05 Security Misconfiguration** | Debug off in prod; no default RabbitMQ/DB creds; non-root containers | `spring.profiles.active=prod`; K8s Secrets; `USER` in Dockerfile |
| **A06 Vulnerable Components** | Trivy SCA scan in CI; Dependabot PRs | GitHub Actions pipeline; fail CI on critical CVEs |
| **A07 Authentication Failures** | Rate limit on login; lockout after 10 failures; short JWT TTL | Bucket4j; in-memory attempt counter (upgrade to Redis post-MVP) |
| **A08 Software & Data Integrity** | CI pipeline with checksums; no deserialization of untrusted AMQP payloads | Validate `ScrapedEvent` message schema before processing |
| **A09 Logging & Monitoring Failures** | Auth events logged (login ok/fail, admin actions); no PII in logs | Logback structured JSON; Grafana alerts on auth failure spike |
| **A10 SSRF** | Scraper URLs are config-only (not user input); admin trigger has no URL param | `ScraperProperties.java` hardcodes target URLs; no user-supplied URL in any endpoint |

---

## 8. Security Requirements for Dev Team

### Backend (atlas-api)
- [ ] `@Valid` annotation on every `@RequestBody` — no unchecked input reaches service layer
- [ ] Category and city parameters validated against enum — never interpolated into queries
- [ ] `contactEmail` annotated `@JsonIgnore` on submission response DTO — verified by unit test
- [ ] `GlobalExceptionHandler` strips all stack traces from error responses in prod profile
- [ ] `spring.security.filter.order` set so `JwtAuthFilter` runs before any controller
- [ ] Actuator endpoints: only `/health` and `/prometheus` exposed; management port bound to cluster-internal address only
- [ ] `ADMIN_PASSWORD` value bcrypt-hashed at application startup (`PasswordEncoder.encode()`) — raw value never stored or logged
- [ ] Rate limiting on `POST /api/v1/auth/login` (5/min) and `POST /api/v1/submissions` (10/hr per IP)

### Backend (atlas-scraper)
- [ ] `RobotsChecker` executed before every scrape — skip URL if disallowed
- [ ] User-Agent header identifies the bot (`AtlasEvents-Scraper/1.0 +https://atlasevents.ma`)
- [ ] `ScrapedEvent` messages validated against schema before publishing to RabbitMQ
- [ ] HTTP client has timeout configured (connect: 5s, read: 10s) — no hanging requests
- [ ] No user-supplied input enters HTTP requests made by scraper

### Frontend (Angular)
- [ ] All API calls go through `api.service.ts` — no direct `fetch`/`XMLHttpRequest`
- [ ] JWT stored in `sessionStorage` (cleared on tab close) for admin — not `localStorage` for security-sensitive operations post-MVP
- [ ] Angular's built-in XSS protection via template binding — never use `[innerHTML]` with unsanitized data
- [ ] HTTP interceptor attaches `Authorization: Bearer <token>` only to `/api/v1/admin/**` routes
- [ ] Admin login form: disable autocomplete on password field (`autocomplete="current-password"`)

### Infrastructure / DevOps
- [ ] All Docker images run as non-root user (`USER 1000` in Dockerfile)
- [ ] K8s NetworkPolicy: block external access to PostgreSQL, RabbitMQ, and Actuator Prometheus ports
- [ ] `JWT_SECRET`, `DATABASE_PASSWORD`, `RABBITMQ_PASSWORD` stored as K8s Secrets — never in ConfigMap
- [ ] CI blocks merge if Trivy finds critical CVEs in dependencies
- [ ] CI blocks merge if Semgrep finds high/critical SAST findings

---

## 9. GDPR Considerations (Morocco Law 09-08 + GDPR alignment)

| Item | Handling |
|---|---|
| Data collected | `contactEmail` only (community submissions) |
| Purpose | Event submission confirmation only |
| Retention | Delete `contact_email` after submission is reviewed (approved/rejected) |
| Right to erasure | Admin can hard-delete a submission record |
| Data minimisation | `contactEmail` is optional field — not required to submit |
| Breach notification | Incident response plan: detect → contain → notify within 72hr if PII exposed |
