-- 10times, allconferencealert, and pcns scrapers were removed (Cloudflare-blocked,
-- replaced by EventbriteScraper). Their stale 403/failure log rows otherwise sit at
-- the top of the admin scrape dashboard forever, making a healthy scraper look broken.
DELETE FROM scrape_logs
WHERE source IN ('10times', 'allconferencealert', 'pcns');
