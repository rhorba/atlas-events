import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { EventService } from '../../../core/services/event.service';
import { Event } from '../../../core/models/event.model';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, TranslatePipe, RouterLink],
  template: `
    <main class="detail-page">
      <a class="back-link" routerLink="/events">
        ← {{ 'events.detail.back' | translate }}
      </a>

      <div *ngIf="loading" class="loading" role="status" aria-live="polite">
        <div class="spinner"></div>
      </div>

      <div *ngIf="!loading && notFound" class="not-found" role="alert">
        <p>{{ 'errors.not_found' | translate }}</p>
        <a class="btn-primary" routerLink="/events">
          {{ 'events.detail.not_found_back' | translate }}
        </a>
      </div>

      <article *ngIf="!loading && event" class="event-detail">
        <header class="detail-header">
          <span class="category-badge" [attr.data-category]="event.category">
            {{ 'categories.' + event.category | translate }}
          </span>
          <h1 class="detail-title">{{ event.title.fr }}</h1>
          <p class="detail-meta">
            <span class="detail-date">{{ event.startDate | date:'dd MMMM yyyy' }}</span>
            <ng-container *ngIf="event.endDate">
              <span class="separator">–</span>
              <span class="detail-date">{{ event.endDate | date:'dd MMMM yyyy' }}</span>
            </ng-container>
            <span class="separator">·</span>
            <span class="detail-city">{{ 'cities.' + event.city | translate }}</span>
          </p>
        </header>

        <div class="detail-body">
          <dl class="detail-fields" *ngIf="event.venue || event.organizer">
            <ng-container *ngIf="event.venue">
              <dt>{{ 'events.detail.venue' | translate }}</dt>
              <dd>{{ event.venue }}</dd>
            </ng-container>
            <ng-container *ngIf="event.organizer">
              <dt>{{ 'events.detail.organizer' | translate }}</dt>
              <dd>{{ event.organizer }}</dd>
            </ng-container>
          </dl>

          <p *ngIf="event.description" class="detail-description">{{ event.description }}</p>

          <div *ngIf="event.tags?.length" class="detail-tags">
            <span class="tag-label">{{ 'events.detail.tags' | translate }}:</span>
            <span class="tag" *ngFor="let tag of event.tags">{{ tag }}</span>
          </div>
        </div>

        <footer class="detail-footer">
          <span class="free-badge" *ngIf="event.isFree">
            {{ 'events.detail.free' | translate }}
          </span>
          <a
            *ngIf="event.registrationUrl"
            [href]="event.registrationUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-primary"
            [attr.aria-label]="('events.detail.register' | translate) + ' — ' + event.title.fr">
            {{ 'events.detail.register' | translate }}
          </a>
          <button class="btn-secondary" (click)="downloadIcs()">
            {{ 'events.detail.add_calendar' | translate }}
          </button>
        </footer>
      </article>
    </main>
  `,
  styles: [`
    .detail-page {
      max-width: 800px;
      margin-inline: auto;
      padding: 24px 16px;
    }
    .back-link {
      display: inline-block;
      color: var(--color-primary, #0d6e6e);
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      margin-block-end: 24px;
    }
    .back-link:hover { text-decoration: underline; }
    .loading {
      display: flex;
      justify-content: center;
      padding: 64px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top-color: var(--color-primary, #0d6e6e);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .not-found {
      text-align: center;
      padding: 48px 16px;
      color: var(--color-text-secondary, #718096);
    }
    .event-detail {
      background: var(--color-bg-surface, #fff);
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,.08);
      overflow: hidden;
    }
    .detail-header {
      padding: 24px;
      border-block-end: 1px solid #e2e8f0;
    }
    .category-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      background: var(--color-primary, #0d6e6e);
      color: #fff;
      margin-block-end: 12px;
    }
    [data-category="technology"] { background: #0d6e6e; }
    [data-category="science"] { background: #1a5276; }
    [data-category="business"] { background: #784212; }
    [data-category="startup"] { background: #1e8449; }
    [data-category="arts"] { background: #76448a; }
    [data-category="policy"] { background: #922b21; }
    [data-category="health"] { background: #c0392b; }
    [data-category="education"] { background: #1a6db5; }
    .detail-title {
      font-size: 24px;
      font-weight: 800;
      color: var(--color-text-primary, #1a202c);
      margin: 0 0 12px;
      line-height: 1.3;
    }
    .detail-meta {
      font-size: 14px;
      color: var(--color-text-secondary, #718096);
      margin: 0;
    }
    .separator { margin-inline: 8px; }
    .detail-body { padding: 24px; }
    .detail-fields {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 8px 16px;
      margin: 0 0 20px;
    }
    dt {
      font-size: 12px;
      font-weight: 700;
      color: var(--color-text-secondary, #718096);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      align-self: center;
    }
    dd {
      font-size: 14px;
      color: var(--color-text-primary, #1a202c);
      margin: 0;
    }
    .detail-description {
      font-size: 15px;
      line-height: 1.7;
      color: var(--color-text-primary, #1a202c);
      margin: 0 0 20px;
      white-space: pre-line;
    }
    .detail-tags {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
    .tag-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-secondary, #718096);
    }
    .tag {
      padding: 3px 10px;
      background: #edf2f7;
      border-radius: 10px;
      font-size: 12px;
      color: #4a5568;
    }
    .detail-footer {
      padding: 16px 24px;
      background: #f7fafc;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      border-block-start: 1px solid #e2e8f0;
    }
    .free-badge {
      font-size: 13px;
      font-weight: 600;
      color: #1e8449;
      background: #d5f5e3;
      padding: 4px 12px;
      border-radius: 12px;
    }
    .btn-primary {
      padding: 10px 20px;
      background: var(--color-primary, #0d6e6e);
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      transition: background 0.15s;
    }
    .btn-primary:hover { background: #0a5555; }
    .btn-primary:focus-visible {
      outline: 3px solid var(--color-primary, #0d6e6e);
      outline-offset: 2px;
    }
    .btn-secondary {
      padding: 10px 20px;
      background: transparent;
      color: var(--color-primary, #0d6e6e);
      border: 2px solid var(--color-primary, #0d6e6e);
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-secondary:hover { background: rgba(13,110,110,.06); }
    .btn-secondary:focus-visible {
      outline: 3px solid var(--color-primary, #0d6e6e);
      outline-offset: 2px;
    }
  `]
})
export class EventDetailComponent implements OnInit, OnDestroy {
  private readonly eventService = inject(EventService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  event: Event | null = null;
  loading = true;
  notFound = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.eventService.getEvent(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.event = res.data;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.notFound = err.status === 404;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  downloadIcs(): void {
    if (!this.event) return;
    const e = this.event;
    const toIcalDt = (iso: string): string => {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };
    const start = toIcalDt(e.startDate);
    const end = e.endDate ? toIcalDt(e.endDate) : start;
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Atlas Events//EN',
      'BEGIN:VEVENT',
      `UID:${e.id}@atlasevents.ma`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${e.title.fr}`,
    ];
    if (e.venue) lines.push(`LOCATION:${e.venue}`);
    if (e.registrationUrl) lines.push(`URL:${e.registrationUrl}`);
    lines.push('END:VEVENT', 'END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-${e.id}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
