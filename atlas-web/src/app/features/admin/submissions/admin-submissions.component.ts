import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { AdminSubmission } from '../../../core/models/event.model';

@Component({
  selector: 'app-admin-submissions',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslatePipe],
  template: `
    <main class="admin-page">
      <header class="admin-header">
        <h1>{{ 'admin.submissions.title' | translate }}</h1>
        <nav class="admin-nav">
          <a routerLink="/admin/submissions" class="nav-item active">{{ 'admin.nav.submissions' | translate }}</a>
          <a routerLink="/admin/events" class="nav-item">{{ 'admin.nav.events' | translate }}</a>
          <a routerLink="/admin/scrape" class="nav-item">{{ 'admin.nav.scrape' | translate }}</a>
          <button class="btn-logout" (click)="logout()">{{ 'admin.nav.logout' | translate }}</button>
        </nav>
      </header>

      <div *ngIf="loading" class="loading">…</div>

      <p *ngIf="!loading && items.length === 0" class="empty-state">
        {{ 'admin.submissions.empty' | translate }}
      </p>

      <div class="submissions-list" *ngIf="!loading && items.length > 0">
        <div class="card" *ngFor="let s of items">
          <div class="card-info">
            <strong>{{ s.title }}</strong>
            <span class="meta">{{ s.city }} · {{ s.startDate | date:'dd/MM/yyyy' }} · {{ s.organizerName }}</span>
            <a *ngIf="s.eventUrl" [href]="s.eventUrl" target="_blank" rel="noopener" class="link">
              {{ s.eventUrl }}
            </a>
          </div>

          <div class="card-actions" *ngIf="!rejectingId || rejectingId !== s.id">
            <button class="btn-approve" (click)="approve(s.id)">
              {{ 'admin.submissions.approve' | translate }}
            </button>
            <button class="btn-reject" (click)="startReject(s.id)">
              {{ 'admin.submissions.reject' | translate }}
            </button>
          </div>

          <div class="reject-form" *ngIf="rejectingId === s.id">
            <input type="text" [(ngModel)]="rejectNote"
                   [placeholder]="'admin.submissions.note_placeholder' | translate" />
            <button class="btn-reject" (click)="confirmReject(s.id)">
              {{ 'admin.submissions.confirm_reject' | translate }}
            </button>
            <button class="btn-secondary" (click)="cancelReject()">
              {{ 'admin.events.cancel' | translate }}
            </button>
          </div>

          <p *ngIf="actionError === s.id" class="error-msg">
            {{ 'admin.submissions.error' | translate }}
          </p>
        </div>
      </div>

      <p *ngIf="successMsg" class="success-msg">{{ successMsg }}</p>
    </main>
  `,
  styles: [`
    .admin-page { max-width: 900px; margin-inline: auto; padding: 24px 16px; }
    .admin-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-block-end: 24px; }
    h1 { font-size: 24px; font-weight: 800; margin: 0; color: #1a202c; }
    .admin-nav { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .nav-item { font-size: 14px; font-weight: 600; color: #4a5568; text-decoration: none; padding: 6px 12px; border-radius: 6px; }
    .nav-item.active, .nav-item:hover { background: var(--color-primary, #0d6e6e); color: #fff; }
    .btn-logout { font-size: 13px; padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 6px; background: #fff; cursor: pointer; color: #c0392b; }
    .loading { padding: 48px; text-align: center; color: #718096; }
    .empty-state { padding: 48px; text-align: center; color: #718096; font-size: 18px; }
    .submissions-list { display: flex; flex-direction: column; gap: 16px; }
    .card { background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,.08); padding: 20px; }
    .card-info { display: flex; flex-direction: column; gap: 4px; margin-block-end: 14px; }
    strong { font-size: 16px; color: #1a202c; }
    .meta { font-size: 13px; color: #718096; }
    .link { font-size: 13px; color: var(--color-primary, #0d6e6e); word-break: break-all; }
    .card-actions { display: flex; gap: 10px; }
    .reject-form { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .reject-form input { flex: 1; min-width: 200px; padding: 8px 10px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 14px; }
    .btn-approve { padding: 8px 16px; background: #1e8449; color: #fff; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-reject { padding: 8px 16px; background: #c0392b; color: #fff; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-secondary { padding: 8px 16px; background: #e2e8f0; color: #4a5568; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
    .error-msg { color: #c0392b; font-size: 13px; margin-block-start: 8px; }
    .success-msg { position: fixed; bottom: 24px; right: 24px; background: #1e8449; color: #fff; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; }
  `]
})
export class AdminSubmissionsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  items: AdminSubmission[] = [];
  loading = true;
  rejectingId: string | null = null;
  rejectNote = '';
  actionError: string | null = null;
  successMsg = '';

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.adminService.getSubmissions().subscribe({
      next: data => { this.items = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  approve(id: string): void {
    this.actionError = null;
    this.adminService.approveSubmission(id).subscribe({
      next: () => {
        this.items = this.items.filter(s => s.id !== id);
        this.flash('admin.submissions.approved');
      },
      error: () => { this.actionError = id; },
    });
  }

  startReject(id: string): void {
    this.rejectingId = id;
    this.rejectNote = '';
  }

  cancelReject(): void {
    this.rejectingId = null;
    this.rejectNote = '';
  }

  confirmReject(id: string): void {
    this.actionError = null;
    this.adminService.rejectSubmission(id, this.rejectNote || undefined).subscribe({
      next: () => {
        this.items = this.items.filter(s => s.id !== id);
        this.rejectingId = null;
        this.flash('admin.submissions.rejected');
      },
      error: () => { this.actionError = id; },
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
