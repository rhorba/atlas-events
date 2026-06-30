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

    contact_email       TEXT,

    status              TEXT            NOT NULL DEFAULT 'pending',
    submitted_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    reviewed_at         TIMESTAMPTZ,
    review_note         TEXT
);

CREATE INDEX idx_submissions_status_date
    ON event_submissions (status, submitted_at ASC);
