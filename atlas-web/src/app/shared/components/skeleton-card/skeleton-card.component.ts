import { Component } from '@angular/core';

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  template: `
    <div class="skeleton-card" aria-hidden="true">
      <div class="skeleton-badge"></div>
      <div class="skeleton-line long"></div>
      <div class="skeleton-line short"></div>
      <div class="skeleton-line medium"></div>
    </div>
  `,
  styles: [`
    .skeleton-card {
      padding: 16px;
      border-radius: 8px;
      background: var(--color-bg-surface, #fff);
      box-shadow: 0 1px 4px rgba(0,0,0,.08);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .skeleton-badge, .skeleton-line {
      background: linear-gradient(90deg, #e8e8e8 25%, #f5f5f5 50%, #e8e8e8 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }
    .skeleton-badge { height: 22px; width: 80px; }
    .skeleton-line { height: 14px; }
    .skeleton-line.long { width: 90%; }
    .skeleton-line.short { width: 50%; }
    .skeleton-line.medium { width: 70%; }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class SkeletonCardComponent {}
