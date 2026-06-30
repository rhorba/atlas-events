-- 15 events tagged source 10times/allconferencealert share one identical
-- microsecond created_at timestamp (2026-06-30 13:31:13.756497+00) with no
-- corresponding scrape_logs row -- a one-off manual INSERT, not a real scrape.
-- Those scrapers no longer exist in the codebase (replaced by EventbriteScraper,
-- see a86e043 / V007). Event cards must only ever show genuinely scraped data.
DELETE FROM events
WHERE source ->> 'name' IN ('10times', 'allconferencealert', 'pcns');
