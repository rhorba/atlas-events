# Atlas Events — Morocco-Wide Professional Event Aggregator

RabatEvents works. Morocco has 4 other major cities with scattered event ecosystems and no unified platform.

## Problem

Economic conferences, startup summits, policy forums, and networking events in Casablanca, Marrakech, Tangier, and Agadir are impossible to discover in one place.

## Solution

A unified platform covering 5 Moroccan cities: automated event scraping, city/category-filtered event listings, FullCalendar view, community event submissions, iCal subscription feeds, and bilingual FR/AR support.

## Stack

| Layer | Technology |
|---|---|
| API service | Spring Boot 3.x · Java 21 (eclipse-temurin) |
| Scraper service | Spring Boot 3.x · Spring Batch · Java 21 |
| Frontend | Angular 17+ · Angular Material MDC · FullCalendar |
| Database | PostgreSQL 16 · Spring Data JPA · Flyway migrations |
| Messaging | RabbitMQ 3.x (AMQP) |
| Auth | JWT (HS256) · stateless admin auth |
| iCal | ical4j · RFC 5545 · Africa/Casablanca timezone |
| Testing | JUnit 5 · Mockito · Testcontainers · Jest · Playwright · JaCoCo |
| Infrastructure | Docker · Kubernetes (Kustomize) · GitHub Actions CI/CD |
| Observability | Prometheus · Grafana · Alertmanager |

## Services

- **atlas-api** — REST API serving events, iCal feeds, community submissions, and admin endpoints
- **atlas-scraper** — Spring Batch job that scrapes Eventbrite's Morocco listings (tech, business, all-events categories) and publishes new events to RabbitMQ for atlas-api to persist; triggered on demand via the admin dashboard, not on a schedule
- **atlas-web** — Angular SPA served via Nginx

## Cities

Rabat · Casablanca · Marrakech · Tangier · Agadir

## Key Roles

Event Organizer | Attendee | Admin

## Docs

All foundation documents are in `docs/`:
- `docs/prd-atlas-events.md` — Product Requirements
- `docs/system-design-atlas-events.md` — System Design
- `docs/architecture-atlas-events.md` — Architecture & ADRs
- `docs/security-atlas-events.md` — Security Baseline
- `docs/database-atlas-events.md` — Database Design
- `docs/ux-atlas-events.md` — UX Foundation
- `docs/ui-atlas-events.md` — UI Foundation
- `docs/test-strategy-atlas-events.md` — Test Strategy
- `docs/devops-atlas-events.md` — DevOps & CI/CD
- `docs/stories-atlas-events.md` — Epics & Stories
