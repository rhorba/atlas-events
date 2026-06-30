import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { EventFilters } from '../../../core/models/event.model';

const CITIES = ['casablanca', 'rabat', 'marrakech', 'fes', 'tanger', 'agadir', 'meknes', 'oujda'];
const CATEGORIES = ['technology', 'science', 'business', 'startup', 'arts', 'policy', 'health', 'education', 'other'];

@Component({
  selector: 'app-event-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="filters" role="search" aria-label="Filtres des événements">
      <select
        class="filter-select"
        [(ngModel)]="city"
        (ngModelChange)="emit()"
        [attr.aria-label]="'events.filters.city' | translate">
        <option value="">{{ 'events.filters.all_cities' | translate }}</option>
        <option *ngFor="let c of cities" [value]="c">
          {{ 'cities.' + c | translate }}
        </option>
      </select>

      <select
        class="filter-select"
        [(ngModel)]="category"
        (ngModelChange)="emit()"
        [attr.aria-label]="'events.filters.category' | translate">
        <option value="">{{ 'events.filters.all_categories' | translate }}</option>
        <option *ngFor="let cat of categories" [value]="cat">
          {{ 'categories.' + cat | translate }}
        </option>
      </select>

      <select
        class="filter-select"
        [(ngModel)]="range"
        (ngModelChange)="emit()"
        [attr.aria-label]="'events.filters.range' | translate">
        <option value="">{{ 'events.filters.range_all' | translate }}</option>
        <option value="week">{{ 'events.filters.range_week' | translate }}</option>
        <option value="month">{{ 'events.filters.range_month' | translate }}</option>
      </select>

      <button class="btn-reset" (click)="reset()" *ngIf="hasActiveFilter">
        {{ 'events.filters.reset' | translate }}
      </button>
    </div>
  `,
  styles: [`
    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }
    .filter-select {
      padding: 8px 12px;
      border: 1.5px solid #cbd5e0;
      border-radius: 6px;
      background: #fff;
      font-size: 14px;
      cursor: pointer;
      color: var(--color-text-primary, #1a202c);
    }
    .filter-select:focus-visible {
      outline: 3px solid var(--color-primary, #0d6e6e);
      outline-offset: 1px;
    }
    .btn-reset {
      padding: 8px 16px;
      border: none;
      background: #e2e8f0;
      color: var(--color-text-primary, #1a202c);
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
    }
    .btn-reset:hover { background: #cbd5e0; }
    .btn-reset:focus-visible {
      outline: 3px solid var(--color-primary, #0d6e6e);
      outline-offset: 2px;
    }
  `]
})
export class EventFiltersComponent implements OnInit {
  @Input() initialFilters: EventFilters = {};
  @Output() filtersChange = new EventEmitter<EventFilters>();

  readonly cities = CITIES;
  readonly categories = CATEGORIES;

  city = '';
  category = '';
  range: '' | 'week' | 'month' = '';

  get hasActiveFilter(): boolean {
    return !!(this.city || this.category || this.range);
  }

  ngOnInit(): void {
    this.city = this.initialFilters.city ?? '';
    this.category = this.initialFilters.category ?? '';
    this.range = (this.initialFilters.range as '' | 'week' | 'month') ?? '';
  }

  emit(): void {
    this.filtersChange.emit({
      city: this.city || undefined,
      category: this.category || undefined,
      range: (this.range as 'week' | 'month') || undefined,
    });
  }

  reset(): void {
    this.city = '';
    this.category = '';
    this.range = '';
    this.filtersChange.emit({});
  }
}
