import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Event } from '../../../core/models/event.model';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <article class="event-card">
      <span class="category-badge" [attr.data-category]="event.category">
        {{ 'categories.' + event.category | translate }}
      </span>
      <h2 class="event-title">{{ event.title.fr }}</h2>
      <p class="event-meta">
        <span class="event-date">{{ event.startDate | date:'dd MMM yyyy' }}</span>
        <span class="separator">·</span>
        <span class="event-city">{{ 'cities.' + event.city | translate }}</span>
      </p>
      <p class="event-organizer" *ngIf="event.organizer">{{ event.organizer }}</p>
      <div class="event-actions">
        <span class="free-badge" *ngIf="event.isFree">{{ 'events.card.free' | translate }}</span>
        <a
          *ngIf="event.registrationUrl"
          [href]="event.registrationUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-register"
          [attr.aria-label]="('events.card.register' | translate) + ' - ' + event.title.fr">
          {{ 'events.card.register' | translate }}
        </a>
      </div>
    </article>
  `,
  styles: [`
    .event-card {
      padding: 16px;
      border-radius: 8px;
      background: var(--color-bg-surface, #fff);
      box-shadow: 0 1px 4px rgba(0,0,0,.08);
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: box-shadow 0.2s;
    }
    .event-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.12); }
    .category-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      background: var(--color-primary, #0d6e6e);
      color: #fff;
      align-self: flex-start;
    }
    [data-category="technology"] { background: #0d6e6e; }
    [data-category="science"] { background: #1a5276; }
    [data-category="business"] { background: #784212; }
    [data-category="startup"] { background: #1e8449; }
    [data-category="arts"] { background: #76448a; }
    [data-category="policy"] { background: #922b21; }
    .event-title {
      font-size: 16px;
      font-weight: 700;
      margin: 0;
      color: var(--color-text-primary, #1a202c);
    }
    .event-meta {
      font-size: 13px;
      color: var(--color-text-secondary, #718096);
      margin: 0;
    }
    .separator { margin-inline: 6px; }
    .event-organizer {
      font-size: 13px;
      color: var(--color-text-secondary, #718096);
      margin: 0;
    }
    .event-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-block-start: 4px;
    }
    .free-badge {
      font-size: 12px;
      font-weight: 600;
      color: #1e8449;
      background: #d5f5e3;
      padding: 2px 8px;
      border-radius: 10px;
    }
    .btn-register {
      padding: 6px 16px;
      background: var(--color-primary, #0d6e6e);
      color: #fff;
      border-radius: 4px;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      margin-inline-start: auto;
      transition: background 0.15s;
    }
    .btn-register:hover { background: #0a5555; }
    .btn-register:focus-visible {
      outline: 3px solid var(--color-primary, #0d6e6e);
      outline-offset: 2px;
    }
  `]
})
export class EventCardComponent {
  @Input({ required: true }) event!: Event;
}
