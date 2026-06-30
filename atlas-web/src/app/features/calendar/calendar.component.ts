import {
  Component, OnInit, OnDestroy, ViewChild, HostListener, inject, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import { EventService } from '../../core/services/event.service';
import { LanguageService } from '../../core/services/language.service';
import { Event } from '../../core/models/event.model';

const CATEGORY_COLORS: Record<string, string> = {
  technology: '#0d6e6e',
  science: '#1a5276',
  business: '#784212',
  startup: '#1e8449',
  arts: '#76448a',
  policy: '#922b21',
  health: '#c0392b',
  education: '#1a6db5',
  other: '#718096',
};

const ALL = '__all__';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, TranslatePipe, FullCalendarModule],
  template: `
    <main class="calendar-page">
      <header class="page-header">
        <h1>{{ 'calendar.title' | translate }}</h1>
        <select
          class="category-filter"
          [value]="selectedCategory"
          (change)="onCategoryChange($event)"
          aria-label="Filtrer par catégorie">
          <option [value]="ALL">{{ 'calendar.filter_all' | translate }}</option>
          <option *ngFor="let cat of categories" [value]="cat">
            {{ 'categories.' + cat | translate }}
          </option>
        </select>
      </header>

      <div *ngIf="loading" class="loading" role="status" aria-live="polite">
        <div class="spinner"></div>
        <span>{{ 'calendar.loading' | translate }}</span>
      </div>

      <div *ngIf="error && !loading" class="error-state" role="alert">
        {{ 'calendar.error' | translate }}
      </div>

      <div [class.hidden]="loading || error" class="calendar-wrapper">
        <full-calendar #calendar [options]="calendarOptions"></full-calendar>
      </div>
    </main>
  `,
  styles: [`
    .calendar-page {
      max-width: 1100px;
      margin-inline: auto;
      padding: 24px 16px;
    }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin-block-end: 20px;
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      color: var(--color-text-primary, #1a202c);
      margin: 0;
    }
    .category-filter {
      padding: 8px 12px;
      border: 1px solid #cbd5e0;
      border-radius: 6px;
      font-size: 14px;
      background: #fff;
      color: var(--color-text-primary, #1a202c);
      cursor: pointer;
    }
    .category-filter:focus-visible {
      outline: 3px solid var(--color-primary, #0d6e6e);
      outline-offset: 2px;
    }
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 64px;
      color: var(--color-text-secondary, #718096);
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
    .error-state {
      text-align: center;
      padding: 48px;
      color: #c0392b;
    }
    .hidden { display: none; }
    .calendar-wrapper {
      background: var(--color-bg-surface, #fff);
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0,0,0,.08);
      padding: 16px;
      overflow: hidden;
    }
  `]
})
export class CalendarComponent implements OnInit, OnDestroy {
  @ViewChild('calendar') calendarEl!: FullCalendarComponent;

  private readonly eventService = inject(EventService);
  private readonly langService = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  readonly ALL = ALL;
  readonly categories = Object.keys(CATEGORY_COLORS);

  loading = true;
  error = false;
  selectedCategory = ALL;
  private allEvents: Event[] = [];

  calendarOptions: Record<string, unknown> = {
    plugins: [dayGridPlugin, listPlugin],
    initialView: this.isMobile() ? 'listWeek' : 'dayGridMonth',
    locale: 'fr',
    headerToolbar: {
      start: 'prev,next today',
      center: 'title',
      end: 'dayGridMonth,listWeek',
    },
    events: [],
    eventClick: (arg: { event: { id: string } }) => {
      this.router.navigate(['/events', arg.event.id]);
    },
    height: 'auto',
  };

  ngOnInit(): void {
    this.loadEvents();
    this.langService.lang$.pipe(takeUntil(this.destroy$)).subscribe(lang => {
      this.calendarEl?.getApi().setOption('locale', lang);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize')
  onResize(): void {
    const view = this.isMobile() ? 'listWeek' : 'dayGridMonth';
    this.calendarEl?.getApi().changeView(view);
  }

  onCategoryChange(ev: unknown): void {
    this.selectedCategory = ((ev as MouseEvent).target as HTMLSelectElement).value;
    this.updateCalendarEvents();
  }

  private loadEvents(): void {
    this.loading = true;
    this.error = false;
    this.eventService.getEvents({ size: 200 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.allEvents = res.data;
          this.loading = false;
          this.updateCalendarEvents();
          this.cdr.detectChanges();
        },
        error: () => {
          this.error = true;
          this.loading = false;
        },
      });
  }

  private updateCalendarEvents(): void {
    const filtered = this.selectedCategory === ALL
      ? this.allEvents
      : this.allEvents.filter(e => e.category === this.selectedCategory);

    const inputs = filtered.map(e => ({
      id: e.id,
      title: e.title.fr,
      start: e.startDate,
      end: e.endDate ?? undefined,
      backgroundColor: CATEGORY_COLORS[e.category] ?? '#718096',
      borderColor: CATEGORY_COLORS[e.category] ?? '#718096',
    }));

    this.calendarOptions = { ...this.calendarOptions, events: inputs };
  }

  private isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 1024;
  }
}
