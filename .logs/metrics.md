# METRICS — Atlas Events

## Sprint 9 — 2026-06-30
| Metric | Value | Gate | Status |
|---|---|---|---|
| Custom Micrometer counters | 4 (submissions.created, scraper.events.found, runs.total, runs.failed) | Story 6.1 | ✓ |
| Prometheus scrape targets | 2 (atlas-api :8080, atlas-scraper :8081) | Story 6.2 | ✓ |
| Alert rules | 5 (ApiErrorRateHigh, ApiLatencyHigh, ApiPodNotReady, ScraperJobsFailing, ScraperNoEventsFound) | Story 6.2 | ✓ |
| Grafana dashboards | 3 pre-provisioned (JVM, API, Scraper) | Story 6.3 | ✓ |
| k8s monitoring manifests | 16 files (namespace, RBAC, 5× prometheus, 7× grafana, ingress, kustomization) | Stories 6.2–6.4 | ✓ |
| atlas-scraper unit tests | 53 (7 in ScrapeTaskletTest incl. 3 counter assertions) | ≥80% cov | ✓ |
| atlas-api unit tests | 32 (2 new in SubmissionServiceTest) | ≥80% cov | ✓ |
| CI run | GREEN (run 28438719310) | — | ✓ |
| CI fixes needed | 2 (package-lock sync, MockBean null tag) | — | resolved |
| Stories complete | 6.1 + 6.2 + 6.3 + 6.4 + 6.5 | Sprint 9 | ✓ |

## Sprint 8 — 2026-06-30
| Metric | Value | Gate | Status |
|---|---|---|---|
| Dockerfiles | 3 (api, scraper, web) | Story 5.1 | ✓ |
| docker-compose services | 5 (postgres, rabbitmq, atlas-api, atlas-scraper, atlas-web) | Story 5.1 | ✓ |
| k8s base manifests | 11 files (namespace, 3×deploy, 3×svc/configmap, ingress, networkpolicy, cronjob, kustomization) | Story 5.2 | ✓ |
| k8s overlays | 2 (staging + prod) with replica + resource patches | Story 5.2 | ✓ |
| CI jobs added | build-images (matrix 3 services), deploy-staging, deploy-prod, test-e2e | Story 5.3 | ✓ |
| Playwright specs | 5 (event-list, event-detail, submit, admin-login, accessibility) | Story 5.4 | ✓ |
| axe-core WCAG scan | WCAG 2.0 A + AA, 3 pages | Story 5.4 | ✓ |
| DEPLOY.md sections | 8 (prereqs, first-time setup, CI/CD, manual deploy, smoke test, rollback, secrets, scrape trigger) | Story 5.5 | ✓ |
| Branch | feature/sprint-8 (new — not sprint-5) | User requirement | ✓ |
| Checkov compliance | non-root, resource limits, liveness/readiness probes, no :latest in k8s, drop ALL caps | Story 5.2 | ✓ |
| Compile errors | 0 | 0 | ✓ |
| Stories complete | 5.1 + 5.2 + 5.3 + 5.4 + 5.5 | Sprint 8 | ✓ |

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

