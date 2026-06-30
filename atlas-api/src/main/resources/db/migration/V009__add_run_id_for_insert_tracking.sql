-- events_inserted on scrape_logs was hardcoded to 0 (never wired up). The scraper
-- and the inserter are decoupled across two independent RabbitMQ queues with no
-- ordering guarantee between them, so a write-time counter on scrape_logs would
-- race. Instead, tag each scraped event with the run that produced it and compute
-- the real inserted count at read time via a COUNT against the events table.
ALTER TABLE scrape_logs ADD COLUMN run_id UUID;
ALTER TABLE events ADD COLUMN run_id UUID;

CREATE INDEX idx_events_run_id ON events (run_id) WHERE run_id IS NOT NULL;
