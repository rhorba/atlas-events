package com.atlasevents.api.scrapelog.domain;

import java.util.List;

public interface ScrapeLogRepository {

    ScrapeLog save(ScrapeLog log);

    List<ScrapeLog> findBySource(String source, int limit);

    List<ScrapeLog> findRecent(int limit);
}
