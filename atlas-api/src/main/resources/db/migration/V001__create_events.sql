CREATE TABLE events (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),

    title               JSONB           NOT NULL,
    description         JSONB,

    start_date          TIMESTAMPTZ     NOT NULL,
    end_date            TIMESTAMPTZ,

    city                TEXT            NOT NULL,
    category            TEXT            NOT NULL,

    venue               TEXT,
    organizer           TEXT            NOT NULL,
    organizer_url       TEXT,
    registration_url    TEXT,
    is_free             BOOLEAN         NOT NULL DEFAULT FALSE,
    tags                TEXT[]          NOT NULL DEFAULT '{}',
    language            TEXT            NOT NULL DEFAULT 'fr',

    source              JSONB           NOT NULL,

    status              TEXT            NOT NULL DEFAULT 'upcoming',
    deleted_at          TIMESTAMPTZ,

    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_events_source_title_date
    ON events ((source->>'url'), (title->>'fr'), start_date);

CREATE INDEX idx_events_start_date     ON events (start_date);
CREATE INDEX idx_events_city           ON events (city);
CREATE INDEX idx_events_category       ON events (category);

CREATE INDEX idx_events_active_query
    ON events (city, category, start_date)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_events_not_deleted
    ON events (start_date DESC)
    WHERE deleted_at IS NULL;
