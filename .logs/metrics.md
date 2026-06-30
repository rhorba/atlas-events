# METRICS — Atlas Events

## Sprint 7 — 2026-06-30
| Metric | Value | Gate | Status |
|---|---|---|---|
| atlas-web Jest tests | 124 (18 suites) | ≥ 80% cov | ✓ |
| atlas-web statement coverage | 94.94% | ≥ 80% | ✓ |
| atlas-web branch coverage | 84.26% | ≥ 80% | ✓ |
| atlas-web function coverage | 95.23% | ≥ 80% | ✓ |
| atlas-web line coverage | 96.09% | ≥ 80% | ✓ |
| New API endpoints | 6 (admin submissions + events) | Stories 4.2–4.3 | ✓ |
| New Angular components | AdminLoginComponent, AdminSubmissionsComponent, AdminEventsComponent, AdminScrapeComponent | Stories 4.1–4.4 | ✓ |
| JWT auth flow | AuthService + authInterceptor + adminGuard | Story 4.1 | ✓ |
| Flyway migration | V006: review_note column | Story 4.2 | ✓ |
| CI run | GREEN 2m23s | — | ✓ |
| Compile errors | 0 | 0 | ✓ |
| Stories complete | 4.1 + 4.2 + 4.3 + 4.4 | Sprint 7 | ✓ |

## Sprint 6 — 2026-06-30
| Metric | Value | Gate | Status |
|---|---|---|---|
| atlas-web Jest tests | 71 (10 suites) | ≥ 80% cov | ✓ |
| atlas-web statement coverage | 92.47% | ≥ 80% | ✓ |
| atlas-web branch coverage | 80.59% | ≥ 80% | ✓ |
| atlas-web function coverage | 94.73% | ≥ 80% | ✓ |
| atlas-web line coverage | 93.54% | ≥ 80% | ✓ |
| New components | EventDetailComponent, CalendarComponent, SubmitFormComponent | Stories 3.3–3.5 | ✓ |
| New service | SubmissionService | Story 3.5 | ✓ |
| FullCalendar integration | @fullcalendar/angular@6 + daygrid + list | Story 3.4 | ✓ |
| iCal download | Client-side Blob + URL.createObjectURL | Story 3.3 | ✓ |
| i18n keys added | events.detail.*, calendar.*, submit.fields.* | Stories 3.3–3.5 | ✓ |
| Compile errors | 0 | 0 | ✓ |
| Stories complete | 3.3 + 3.4 + 3.5 | Sprint 6 | ✓ |

## Sprint 5 — 2026-06-30
| Metric | Value | Gate | Status |
|---|---|---|---|
| atlas-web Jest tests | 40 (6 suites) | ≥ 80% cov | ✓ |
| atlas-web statement coverage | 86.13% | ≥ 80% | ✓ |
| atlas-web branch coverage | 86.48% | ≥ 80% | ✓ |
| atlas-web function coverage | 92.85% | ≥ 80% | ✓ |
| atlas-api unit tests | 30 | — | ✓ |
| atlas-api ITs (incl. 429 test) | 7 (AuthControllerIT) | — | ✓ |
| atlas-api JaCoCo gate | ≥80% (met) | ≥ 80% | ✓ |
| Login rate limit | 10 fails → 429 / 15 min | Story 1.7 AC | ✓ |
| CI test-web job | Node 20, npm ci, jest --ci | — | ✓ |
| Compile errors | 0 | 0 | ✓ |
| Stories complete | 3.1 + 3.2 + 3.6 + 1.7 | — | ✓ |

## Sprint 3 — 2026-06-29
| Metric | Value | Gate | Status |
|---|---|---|---|
| Test count | 41 (39 unit + 2 integration) | — | ✓ |
| Line coverage (atlas-scraper) | ≥80% (gate met) | ≥ 80% | ✓ |
| Batch schema init | Custom DDL in batch-tables.sql | — | ✓ |
| Compile errors | 0 | 0 | ✓ |
| Stories complete | 2.1 (Batch+RabbitMQ infra) + 2.2 (TentimesScraper) + 2.3 (AllConferenceAlertScraper) | — | ✓ |

## Sprint 2 — 2026-06-29
| Metric | Value | Gate | Status |
|---|---|---|---|
| Test count | 22 (5 unit + 17 integration) | — | ✓ |
| Line coverage (atlas-api) | ≥80% (gate met) | ≥ 80% | ✓ |
| Build time (local verify) | ~76s | — | ✓ |
| Compile errors | 0 | 0 | ✓ |
| Stories complete | 1.5 (iCal) + 1.6 (Submissions) + 1.7 (JWT Auth) | — | ✓ |

## Sprint 1 — 2026-06-29
| Metric | Value | Gate | Status |
|---|---|---|---|
| Test count | 15 (7 unit + 8 integration) | — | ✓ |
| Instruction coverage (atlas-api) | 89% | ≥ 80% | ✓ |
| Build time (local verify) | ~50s | — | ✓ |
| Compile errors | 0 | 0 | ✓ |

