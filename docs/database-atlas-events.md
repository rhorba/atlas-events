# Database Design: Atlas Events
**Architecture Reference**: docs/architecture-atlas-events.md
**Security Reference**: docs/security-atlas-events.md
**Version**: 1.0 | **Date**: 2026-06-29 | **Author**: DBA

---

## 1. Database Selection

- **Engine**: PostgreSQL 16
- **Rationale**: Structured relational data, JSONB for multilingual fields and event source metadata, native array support for tags, UUID primary keys, strong ACID guarantees for deduplication unique constraint.
- **Hosting**: K8s StatefulSet with PVC 20Gi for MVP. Migrate to managed (Supabase/RDS) when ops overhead justifies it.
- **Connection pool**: Spring Boot HikariCP default (pool size 10) — adequate at current scale (< 5 RPS).

---

## 2. Entity-Relationship Model

```
events ──(promoted from)──> event_submissions
  │                              │
  │  (one event, one log entry)  │
  └────────────────────────── scrape_logs
                               (independent — tracks scraper runs, not linked by FK)

events
  id (PK)
  ... fields ...
  deleted_at          ← soft delete

event_submissions
  id (PK)
  status              ← pending | approved | rejected
  contact_email       ← PII — optional, never in API responses

scrape_logs
  id (PK)
  source, url
  events_found, events_inserted
  success, error_message
```

No foreign keys between tables by design: `events` populated from two independent paths (scraper pipeline and admin-approved submissions). `scrape_logs` is an audit trail, not a relational parent.

---

## 3. Schema Design

### Table: `events`

```sql
-- Migration: V001__create_events.sql

CREATE TABLE events (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Multilingual fields as JSONB: { "fr": "...", "ar": "...", "en": "..." }
    title               JSONB           NOT NULL,
    description         JSONB,

    start_date          TIMESTAMPTZ     NOT NULL,
    end_date            TIMESTAMPTZ,

    -- Controlled values enforced at app layer (Spring @Valid)
    city                TEXT            NOT NULL,        -- rabat|casablanca|marrakech|tangier|agadir
    category            TEXT            NOT NULL,        -- conference|summit|startup|networking|academic|policy|tech|workshop

    venue               TEXT,
    organizer           TEXT            NOT NULL,
    organizer_url       TEXT,
    registration_url    TEXT,
    is_free             BOOLEAN         NOT NULL DEFAULT FALSE,
    tags                TEXT[]          NOT NULL DEFAULT '{}',
    language            TEXT            NOT NULL DEFAULT 'fr',

    -- Source metadata: { "name": "...", "url": "...", "scrapedAt": "...", "isManual": false }
    source              JSONB           NOT NULL,

    -- Lifecycle
    status              TEXT            NOT NULL DEFAULT 'upcoming',
                                        -- upcoming|today|this_week|past|cancelled
    deleted_at          TIMESTAMPTZ,    -- soft delete; NULL = active

    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Deduplication: same source URL + French title + start date cannot appear twice
CREATE UNIQUE INDEX uq_events_source_title_date
    ON events ((source->>'url'), (title->>'fr'), start_date);

-- Core query indexes
CREATE INDEX idx_events_start_date     ON events (start_date);
CREATE INDEX idx_events_city           ON events (city);
CREATE INDEX idx_events_category       ON events (category);

-- Composite index for the most common public query pattern:
-- WHERE deleted_at IS NULL AND city = ? AND category = ? AND start_date >= ?
CREATE INDEX idx_events_active_query
    ON events (city, category, start_date)
    WHERE deleted_at IS NULL;

-- Partial index for soft-delete filter (used by all public queries)
CREATE INDEX idx_events_not_deleted
    ON events (start_date DESC)
    WHERE deleted_at IS NULL;
```

### Table: `event_submissions`

```sql
-- Migration: V002__create_event_submissions.sql

CREATE TABLE event_submissions (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),

    title_fr            TEXT            NOT NULL,
    start_date          TIMESTAMPTZ     NOT NULL,
    end_date            TIMESTAMPTZ,
    city                TEXT            NOT NULL,
    organizer           TEXT            NOT NULL,
    registration_url    TEXT            NOT NULL,
    category            TEXT            NOT NULL,
    description_fr      TEXT,

    -- PII — optional. NEVER returned in any API response. Delete after review.
    contact_email       TEXT,           -- @JsonIgnore in DTO; see security doc

    status              TEXT            NOT NULL DEFAULT 'pending',
                                        -- pending|approved|rejected
    submitted_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    reviewed_at         TIMESTAMPTZ,
    review_note         TEXT
);

-- Admin moderation queue query: WHERE status = 'pending' ORDER BY submitted_at ASC
CREATE INDEX idx_submissions_status_date
    ON event_submissions (status, submitted_at ASC);
```

### Table: `scrape_logs`

```sql
-- Migration: V003__create_scrape_logs.sql

CREATE TABLE scrape_logs (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    source              TEXT            NOT NULL,   -- scraper name (e.g. "10times")
    url                 TEXT            NOT NULL,   -- target URL scraped
    started_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    finished_at         TIMESTAMPTZ,
    events_found        INTEGER         NOT NULL DEFAULT 0,
    events_inserted     INTEGER         NOT NULL DEFAULT 0,
    success             BOOLEAN         NOT NULL DEFAULT FALSE,
    error_message       TEXT
);

-- Admin scraper health dashboard: ORDER BY started_at DESC, filtered by source
CREATE INDEX idx_scrape_logs_source_date
    ON scrape_logs (source, started_at DESC);

-- TTL cleanup query: WHERE started_at < NOW() - INTERVAL '90 days'
CREATE INDEX idx_scrape_logs_started_at
    ON scrape_logs (started_at);
```

---

## 4. Index Strategy

| Table | Index | Columns | Query Pattern |
|---|---|---|---|
| events | `uq_events_source_title_date` | `source->>'url'`, `title->>'fr'`, `start_date` | Deduplication INSERT guard |
| events | `idx_events_active_query` | `(city, category, start_date)` WHERE `deleted_at IS NULL` | Public event list (main query) |
| events | `idx_events_not_deleted` | `start_date DESC` WHERE `deleted_at IS NULL` | iCal feed, general listing |
| events | `idx_events_start_date` | `start_date` | Date range filter |
| events | `idx_events_city` | `city` | City filter alone |
| events | `idx_events_category` | `category` | Category filter alone |
| event_submissions | `idx_submissions_status_date` | `(status, submitted_at ASC)` | Admin pending queue |
| scrape_logs | `idx_scrape_logs_source_date` | `(source, started_at DESC)` | Admin scraper health view |
| scrape_logs | `idx_scrape_logs_started_at` | `started_at` | 90-day TTL cleanup job |

**Skipped indexes** (not worth the write overhead at current scale):
- `is_free` — low cardinality boolean
- `language` — low cardinality
- `tags` — GIN index added only when tag-based search is a confirmed feature

---

## 5. Migration Plan

All migrations live in `atlas-api/src/main/resources/db/migration/` and run via Flyway on atlas-api startup.
Spring Batch schema lives in a separate Flyway location: `classpath:db/migration/batch` targeting the `batch` schema.

| File | Description | Reversible |
|---|---|---|
| `V001__create_events.sql` | `events` table + all indexes + dedup unique constraint | Yes — `DROP TABLE events CASCADE` |
| `V002__create_event_submissions.sql` | `event_submissions` table + indexes | Yes |
| `V003__create_scrape_logs.sql` | `scrape_logs` table + indexes | Yes |
| `V004__create_batch_schema.sql` | `CREATE SCHEMA IF NOT EXISTS batch` — Spring Batch manages its own tables within | Yes |

**Spring Batch schema config** (`application.yml`):
```yaml
spring:
  batch:
    jdbc:
      initialize-schema: always
      schema: classpath:org/springframework/batch/core/schema-postgresql.sql
      table-prefix: batch.BATCH_
```

**Flyway config** (`application.yml`):
```yaml
spring:
  flyway:
    locations: classpath:db/migration
    baseline-on-migrate: false
    validate-on-migrate: true
    out-of-order: false
```

---

## 6. Access Patterns

| Use Case | Query Pattern | Index Used |
|---|---|---|
| Public event list | `SELECT * FROM events WHERE deleted_at IS NULL AND city = ? AND category = ? AND start_date >= NOW() ORDER BY start_date ASC LIMIT 20 OFFSET ?` | `idx_events_active_query` |
| iCal feed generation | `SELECT * FROM events WHERE deleted_at IS NULL AND (? IS NULL OR city = ?) AND (? IS NULL OR category = ?) AND start_date >= NOW() ORDER BY start_date ASC` | `idx_events_not_deleted` |
| Event detail | `SELECT * FROM events WHERE id = ? AND deleted_at IS NULL` | PK lookup |
| Deduplication on scrape insert | `INSERT ... ON CONFLICT ON CONSTRAINT uq_events_source_title_date DO NOTHING` | `uq_events_source_title_date` |
| Admin submission queue | `SELECT * FROM event_submissions WHERE status = 'pending' ORDER BY submitted_at ASC` | `idx_submissions_status_date` |
| Admin approve submission | `UPDATE event_submissions SET status = 'approved', reviewed_at = NOW() WHERE id = ?` then `INSERT INTO events ...` | PK lookup |
| Admin soft-delete event | `UPDATE events SET deleted_at = NOW(), updated_at = NOW() WHERE id = ?` | PK lookup |
| Scraper health dashboard | `SELECT * FROM scrape_logs WHERE source = ? ORDER BY started_at DESC LIMIT 20` | `idx_scrape_logs_source_date` |
| 90-day log cleanup | `DELETE FROM scrape_logs WHERE started_at < NOW() - INTERVAL '90 days'` | `idx_scrape_logs_started_at` |

---

## 7. Sensitive Data

| Column | Table | Classification | Protection |
|---|---|---|---|
| `contact_email` | `event_submissions` | PII (GDPR / Law 09-08) | `@JsonIgnore` in DTO; never logged; delete post-review; consider AES-256 column encryption post-MVP |
| `source->>'url'` (scraper URLs) | `events` | Internal config | Not sensitive — scraped from public sites |

**Row-level security**: Not needed for MVP — single admin user, no multi-tenancy.

---

## 8. Database Maintenance Notes

- **`updated_at` trigger**: Add a PostgreSQL function + trigger to auto-update `updated_at` on `events` (or handle in JPA `@PreUpdate`). JPA approach preferred for simplicity.
- **VACUUM/ANALYZE**: Let PostgreSQL autovacuum handle it. Revisit if `events` table exceeds 100K rows.
- **Backup**: `pg_dump` daily via K8s CronJob. Retain 30 days. Test restore monthly.
- **Connection timeout**: Set `statement_timeout = 30s` and `lock_timeout = 5s` in PostgreSQL config to prevent runaway queries.
