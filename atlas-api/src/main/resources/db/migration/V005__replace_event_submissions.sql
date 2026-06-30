DROP TABLE IF EXISTS event_submissions;

CREATE TABLE event_submissions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT        NOT NULL,
    description     TEXT,
    start_date      TIMESTAMPTZ NOT NULL,
    end_date        TIMESTAMPTZ,
    city            TEXT        NOT NULL,
    venue           TEXT,
    organizer_name  TEXT,
    contact_email   TEXT        NOT NULL,
    event_url       TEXT,
    is_free         BOOLEAN     NOT NULL DEFAULT false,
    status          TEXT        NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_submissions_status_created
    ON event_submissions (status, created_at DESC);
