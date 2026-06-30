import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { ScrapeLog } from '../../../core/models/event.model';

@Component({
  selector: 'app-admin-scrape',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  template: `
    <main class="admin-page">
      <header class="admin-header">
        <h1>{{ 'admin.scrape.title' | translate }}</h1>
        <nav class="admin-nav">
          <a routerLink="/admin/submissions" class="nav-item">{{ 'admin.nav.submissions' | translate }}</a>
          <a routerLink="/admin/events" class="nav-item">{{ 'admin.nav.events' | translate }}</a>
          <a routerLink="/admin/scrape" class="nav-item active">{{ 'admin.nav.scrape' | translate }}</a>
          <button class="btn-logout" (click)="logout()">{{ 'admin.nav.logout' | translate }}</button>
        </nav>
      </header>

      <div class="toolbar">
        <button class="btn-trigger" (click)="trigger()" [disabled]="triggering">
          {{ 'admin.scrape.trigger' | translate }}
        </button>
        <span *ngIf="triggerError" class="error-msg">{{ 'admin.scrape.error' | translate }}</span>
      </div>

      <div *ngIf="loading" class="loading">…</div>

      <table class="log-table" *ngIf="!loading">
        <thead>
          <tr>
            <th>{{ 'admin.scrape.source' | translate }}</th>
            <th>{{ 'admin.scrape.started_at' | translate }}</th>
            <th>{{ 'admin.scrape.events_found' | translate }}</th>
            <th>{{ 'admin.scrape.events_inserted' | translate }}</th>
            <th>{{ 'admin.scrape.status' | translate }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let log of logs" [class.row-error]="!log.success">
            <td>{{ log.source }}</td>
            <td>{{ log.startedAt | date:'dd/MM/yyyy HH:mm' }}</td>
            <td>{{ log.eventsFound }}</td>
            <td>{{ log.eventsInserted }}</td>
            <td>
              <span class="status-chip" [class.ok]="log.success" [class.fail]="!log.success">
                {{ log.success ? 'OK' : 'FAIL' }}
              </span>
              <span *ngIf="!log.success && log.errorMessage" class="error-detail">
                {{ log.errorMessage }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <p *ngIf="successMsg" class="success-msg">{{ successMsg }}</p>
    </main>
  `,
  styles: [`
    .admin-page { max-width: 1000px; margin-inline: auto; padding: 24px 16px; }
    .admin-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-block-end: 24px; }
    h1 { font-size: 24px; font-weight: 800; margin: 0; color: #1a202c; }
    .admin-nav { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .nav-item { font-size: 14px; font-weight: 600; color: #4a5568; text-decoration: none; padding: 6px 12px; border-radius: 6px; }
    .nav-item.active, .nav-item:hover { background: var(--color-primary, #0d6e6e); color: #fff; }
    .btn-logout { font-size: 13px; padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 6px; background: #fff; cursor: pointer; color: #c0392b; }
    .toolbar { display: flex; align-items: center; gap: 12px; margin-block-end: 20px; }
    .btn-trigger { padding: 10px 20px; background: var(--color-primary, #0d6e6e); color: #fff; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-trigger:disabled { opacity: .6; cursor: default; }
    .loading { padding: 48px; text-align: center; color: #718096; }
    .log-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    th { background: #f7fafc; padding: 10px 14px; text-align: start; font-size: 12px; font-weight: 700; color: #718096; text-transform: uppercase; letter-spacing: .04em; }
    td { padding: 12px 14px; font-size: 14px; color: #2d3748; border-block-start: 1px solid #e2e8f0; }
    .row-error td { background: #fff5f5; }
    .status-chip { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
    .status-chip.ok { background: #c6f6d5; color: #1e8449; }
    .status-chip.fail { background: #fed7d7; color: #c0392b; }
    .error-detail { display: block; font-size: 12px; color: #c0392b; margin-block-start: 4px; }
    .error-msg { color: #c0392b; font-size: 13px; }
    .success-msg { position: fixed; bottom: 24px; right: 24px; background: #1e8449; color: #fff; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; }
  `]
})
export class AdminScrapeComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  logs: ScrapeLog[] = [];
  loading = true;
  triggering = false;
  triggerError = false;
  successMsg = '';

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.adminService.getScrapeLogs().subscribe({
      next: data => { this.logs = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  trigger(): void {
    this.triggering = true;
    this.triggerError = false;
    this.adminService.triggerScrape().subscribe({
      next: () => {
        this.triggering = false;
        this.flash('admin.scrape.triggered');
      },
      error: () => {
        this.triggering = false;
        this.triggerError = true;
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }

  private flash(key: string): void {
    this.successMsg = key;
    setTimeout(() => { this.successMsg = ''; }, 3000);
  }
}
