import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <main class="login-page">
      <div class="login-card">
        <h1>{{ 'admin.login.title' | translate }}</h1>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="field">
            <label for="username">{{ 'admin.login.username' | translate }}</label>
            <input id="username" type="text" formControlName="username" autocomplete="username" />
          </div>
          <div class="field">
            <label for="password">{{ 'admin.login.password' | translate }}</label>
            <input id="password" type="password" formControlName="password" autocomplete="current-password" />
          </div>

          <p *ngIf="error" class="error-msg" role="alert">
            {{ 'admin.login.error' | translate }}
          </p>

          <button type="submit" class="btn-primary" [disabled]="submitting">
            {{ submitting ? '…' : ('admin.login.btn' | translate) }}
          </button>
        </form>
      </div>
    </main>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-bg, #f7fafc);
    }
    .login-card {
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 2px 12px rgba(0,0,0,.1);
      padding: 40px 32px;
      width: 100%;
      max-width: 380px;
    }
    h1 { font-size: 22px; font-weight: 800; margin: 0 0 24px; color: #1a202c; }
    .field { display: flex; flex-direction: column; gap: 4px; margin-block-end: 16px; }
    label { font-size: 13px; font-weight: 600; color: #4a5568; }
    input {
      padding: 10px 12px;
      border: 1px solid #cbd5e0;
      border-radius: 6px;
      font-size: 15px;
    }
    input:focus-visible { outline: 3px solid var(--color-primary, #0d6e6e); outline-offset: 2px; }
    .error-msg { color: #c0392b; font-size: 14px; margin-block-end: 12px; }
    .btn-primary {
      width: 100%;
      padding: 12px;
      background: var(--color-primary, #0d6e6e);
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-primary:disabled { opacity: .6; cursor: default; }
  `]
})
export class AdminLoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  submitting = false;
  error = false;

  onSubmit(): void {
    if (this.form.invalid || this.submitting) return;
    this.submitting = true;
    this.error = false;
    const { username, password } = this.form.value;
    this.auth.login(username!, password!).subscribe({
      next: () => this.router.navigate(['/admin/submissions']),
      error: () => {
        this.error = true;
        this.submitting = false;
      },
    });
  }
}
