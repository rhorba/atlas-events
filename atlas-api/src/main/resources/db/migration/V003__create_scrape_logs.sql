CREATE TABLE scrape_logs (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    source              TEXT            NOT NULL,
    url                 TEXT            NOT NULL,
    started_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    finished_at         TIMESTAMPTZ,
    events_found        INTEGER         NOT NULL DEFAULT 0,
    events_inserted     INTEGER         NOT NULL DEFAULT 0,
    success             BOOLEAN         NOT NULL DEFAULT FALSE,
    error_message       TEXT
);

CREATE INDEX idx_scrape_logs_source_date
    ON scrape_logs (source, started_at DESC);

CREATE INDEX idx_scrape_logs_started_at
    ON scrape_logs (started_at);
