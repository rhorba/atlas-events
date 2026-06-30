import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { AdminEvent } from '../../../core/models/event.model';

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, TranslatePipe],
  template: `
    <main class="admin-page">
      <header class="admin-header">
        <h1>{{ 'admin.events.title' | translate }}</h1>
        <nav class="admin-nav">
          <a routerLink="/admin/submissions" class="nav-item">{{ 'admin.nav.submissions' | translate }}</a>
          <a routerLink="/admin/events" class="nav-item active">{{ 'admin.nav.events' | translate }}</a>
          <a routerLink="/admin/scrape" class="nav-item">{{ 'admin.nav.scrape' | translate }}</a>
          <button class="btn-logout" (click)="logout()">{{ 'admin.nav.logout' | translate }}</button>
        </nav>
      </header>

      <div *ngIf="loading" class="loading">…</div>

      <div class="events-list" *ngIf="!loading">
        <div class="event-row" *ngFor="let ev of events"
             [class.deleted]="ev.deletedAt">
          <div class="row-info">
            <strong>{{ ev.title?.fr || ev.title?.ar }}</strong>
            <span class="meta">{{ ev.city }} · {{ ev.category }} · {{ ev.startDate | date:'dd/MM/yyyy' }}</span>
          </div>

          <div class="row-actions" *ngIf="editingId !== ev.id">
            <button class="btn-edit" (click)="startEdit(ev)">{{ 'admin.events.edit' | translate }}</button>
            <button class="btn-delete" (click)="deleteEvent(ev.id)" [disabled]="!!ev.deletedAt">
              {{ 'admin.events.delete' | translate }}
            </button>
          </div>

          <form class="edit-form" *ngIf="editingId === ev.id" [formGroup]="editForm" (ngSubmit)="saveEdit(ev.id)">
            <input formControlName="titleFr" placeholder="Titre FR" />
            <input formControlName="city" placeholder="Ville" />
            <input formControlName="organizer" placeholder="Organisateur" />
            <input formControlName="registrationUrl" placeholder="URL inscription" />
            <div class="edit-actions">
              <button type="submit" class="btn-approve">{{ 'admin.events.save' | translate }}</button>
              <button type="button" class="btn-secondary" (click)="cancelEdit()">{{ 'admin.events.cancel' | translate }}</button>
            </div>
          </form>

          <p *ngIf="actionError === ev.id" class="error-msg">{{ 'admin.events.error' | translate }}</p>
        </div>
      </div>

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
    .loading { padding: 48px; text-align: center; color: #718096; }
    .events-list { display: flex; flex-direction: column; gap: 2px; }
    .event-row { background: #fff; border-radius: 6px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; border: 1px solid #e2e8f0; }
    .event-row.deleted { opacity: .5; }
    .row-info { display: flex; flex-direction: column; gap: 2px; }
    strong { font-size: 15px; color: #1a202c; }
    .meta { font-size: 13px; color: #718096; }
    .row-actions { display: flex; gap: 8px; }
    .edit-form { display: flex; flex-direction: column; gap: 8px; }
    .edit-form input { padding: 8px 10px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 14px; }
    .edit-actions { display: flex; gap: 8px; }
    .btn-edit { padding: 6px 14px; background: #1a5276; color: #fff; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; }
    .btn-delete { padding: 6px 14px; background: #c0392b; color: #fff; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; }
    .btn-delete:disabled { opacity: .4; cursor: default; }
    .btn-approve { padding: 8px 14px; background: #1e8449; color: #fff; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; }
    .btn-secondary { padding: 8px 14px; background: #e2e8f0; color: #4a5568; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; }
    .error-msg { color: #c0392b; font-size: 13px; }
    .success-msg { position: fixed; bottom: 24px; right: 24px; background: #1e8449; color: #fff; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; }
  `]
})
export class AdminEventsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  events: AdminEvent[] = [];
  loading = true;
  editingId: string | null = null;
  actionError: string | null = null;
  successMsg = '';

  editForm = this.fb.group({
    titleFr: [''],
    city: [''],
    organizer: [''],
    registrationUrl: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.adminService.getEvents().subscribe({
      next: res => { this.events = res.data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  startEdit(ev: AdminEvent): void {
    this.editingId = ev.id;
    this.editForm.patchValue({
      titleFr: ev.title?.fr ?? '',
      city: ev.city,
      organizer: ev.organizer,
      registrationUrl: ev.registrationUrl ?? '',
    });
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(id: string): void {
    this.actionError = null;
    const { titleFr, city, organizer, registrationUrl } = this.editForm.value;
    this.adminService.updateEvent(id, { city: city!, organizer: organizer!,
      registrationUrl: registrationUrl!, title: { fr: titleFr! } }).subscribe({
      next: res => {
        const idx = this.events.findIndex(e => e.id === id);
        if (idx !== -1) this.events[idx] = res.data;
        this.editingId = null;
        this.flash('admin.events.saved');
      },
      error: () => { this.actionError = id; },
    });
  }

  deleteEvent(id: string): void {
    if (!confirm('Supprimer cet événement ?')) return;
    this.actionError = null;
    this.adminService.deleteEvent(id).subscribe({
      next: () => {
        const idx = this.events.findIndex(e => e.id === id);
        if (idx !== -1) this.events[idx] = { ...this.events[idx], deletedAt: new Date().toISOString() };
        this.flash('admin.events.deleted');
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
