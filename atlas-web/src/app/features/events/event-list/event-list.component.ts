import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { EventService } from '../../../core/services/event.service';
import { Event, EventFilters } from '../../../core/models/event.model';
import { EventCardComponent } from '../event-card/event-card.component';
import { EventFiltersComponent } from '../event-filters/event-filters.component';
import { SkeletonCardComponent } from '../../../shared/components/skeleton-card/skeleton-card.component';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    EventCardComponent,
    EventFiltersComponent,
    SkeletonCardComponent,
  ],
  template: `
    <main class="event-list-page">
      <header class="page-header">
        <h1>{{ 'events.title' | translate }}</h1>
      </header>

      <app-event-filters
        [initialFilters]="activeFilters"
        (filtersChange)="onFiltersChange($event)">
      </app-event-filters>

      <div class="events-grid" aria-live="polite" [attr.aria-busy]="loading">
        <ng-container *ngIf="loading">
          <app-skeleton-card *ngFor="let s of skeletons"></app-skeleton-card>
        </ng-container>

        <ng-container *ngIf="!loading && !error">
          <ng-container *ngIf="events.length > 0; else emptyState">
            <app-event-card *ngFor="let event of events" [event]="event">
            </app-event-card>
          </ng-container>
          <ng-template #emptyState>
            <div class="empty-state" role="status">
              <p class="empty-title">{{ 'events.empty.title' | translate }}</p>
              <p>{{ 'events.empty.message' | translate }}</p>
              <button class="btn-reset-empty" (click)="resetFilters()">
                {{ 'events.empty.reset' | translate }}
              </button>
            </div>
          </ng-template>
        </ng-container>

        <div *ngIf="error" class="error-state" role="alert">
          {{ 'errors.load_failed' | translate }}
        </div>
      </div>
    </main>
  `,
  styles: [`
    .event-list-page {
      max-width: 1100px;
      margin-inline: auto;
      padding: 24px 16px;
    }
    .page-header { margin-block-end: 20px; }
    h1 {
      font-size: 28px;
      font-weight: 800;
      color: var(--color-text-primary, #1a202c);
      margin: 0;
    }
    .events-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
      margin-block-start: 24px;
    }
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 48px 16px;
      color: var(--color-text-secondary, #718096);
    }
    .empty-title {
      font-size: 18px;
      font-weight: 700;
      margin-block-end: 8px;
    }
    .btn-reset-empty {
      margin-block-start: 16px;
      padding: 8px 20px;
      background: var(--color-primary, #0d6e6e);
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-reset-empty:focus-visible {
      outline: 3px solid var(--color-primary, #0d6e6e);
      outline-offset: 2px;
    }
    .error-state {
      grid-column: 1 / -1;
      padding: 24px;
      color: #c0392b;
      text-align: center;
    }
  `]
})
export class EventListComponent implements OnInit, OnDestroy {
  private readonly eventService = inject(EventService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  events: Event[] = [];
  loading = false;
  error = false;
  activeFilters: EventFilters = {};
  readonly skeletons = [1, 2, 3];

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.activeFilters = {
        city: params['city'] || undefined,
        category: params['category'] || undefined,
        range: params['range'] || undefined,
      };
      this.loadEvents();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFiltersChange(filters: EventFilters): void {
    this.router.navigate([], {
      queryParams: {
        city: filters.city || null,
        category: filters.category || null,
        range: filters.range || null,
      },
      queryParamsHandling: 'merge',
    });
  }

  resetFilters(): void {
    this.router.navigate([], { queryParams: {} });
  }

  private loadEvents(): void {
    this.loading = true;
    this.error = false;
    this.eventService.getEvents(this.activeFilters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.events = res.data;
          this.loading = false;
        },
        error: () => {
          this.error = true;
          this.loading = false;
        },
      });
  }
}
