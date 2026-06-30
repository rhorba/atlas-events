import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { SubmissionService } from '../../core/services/submission.service';
import { SubmissionRequest } from '../../core/models/event.model';

const URL_PATTERN = /^https?:\/\/.+/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-submit-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <main class="submit-page">
      <h1>{{ 'submit.title' | translate }}</h1>

      <div *ngIf="submitted" class="success-state" role="status" aria-live="polite">
        <p class="success-message">{{ 'submit.success' | translate }}</p>
        <button class="btn-primary" (click)="reset()">
          {{ 'submit.submit_another' | translate }}
        </button>
      </div>

      <form *ngIf="!submitted" [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

        <div *ngIf="error === 'rate_limit'" class="error-banner" role="alert">
          {{ 'submit.rate_limit' | translate }}
        </div>
        <div *ngIf="error === 'generic'" class="error-banner" role="alert">
          {{ 'errors.load_failed' | translate }}
        </div>

        <div class="field">
          <label for="titleFr">{{ 'submit.fields.titleFr' | translate }} *</label>
          <input
            id="titleFr"
            type="text"
            formControlName="titleFr"
            [class.invalid]="isInvalid('titleFr')"
            autocomplete="off">
          <span *ngIf="isInvalid('titleFr')" class="field-error">
            {{ 'submit.required' | translate }}
          </span>
        </div>

        <div class="field">
          <label for="startDate">{{ 'submit.fields.startDate' | translate }} *</label>
          <input
            id="startDate"
            type="date"
            formControlName="startDate"
            [class.invalid]="isInvalid('startDate')">
          <span *ngIf="isInvalid('startDate')" class="field-error">
            {{ 'submit.required' | translate }}
          </span>
        </div>

        <div class="field-row">
          <div class="field">
            <label for="city">{{ 'submit.fields.city' | translate }} *</label>
            <select
              id="city"
              formControlName="city"
              [class.invalid]="isInvalid('city')">
              <option value="">—</option>
              <option *ngFor="let c of cities" [value]="c">
                {{ 'cities.' + c | translate }}
              </option>
            </select>
            <span *ngIf="isInvalid('city')" class="field-error">
              {{ 'submit.required' | translate }}
            </span>
          </div>

          <div class="field">
            <label for="category">{{ 'submit.fields.category' | translate }} *</label>
            <select
              id="category"
              formControlName="category"
              [class.invalid]="isInvalid('category')">
              <option value="">—</option>
              <option *ngFor="let cat of categories" [value]="cat">
                {{ 'categories.' + cat | translate }}
              </option>
            </select>
            <span *ngIf="isInvalid('category')" class="field-error">
              {{ 'submit.required' | translate }}
            </span>
          </div>
        </div>

        <div class="field">
          <label for="organizer">{{ 'submit.fields.organizer' | translate }} *</label>
          <input
            id="organizer"
            type="text"
            formControlName="organizer"
            [class.invalid]="isInvalid('organizer')"
            autocomplete="organization">
          <span *ngIf="isInvalid('organizer')" class="field-error">
            {{ 'submit.required' | translate }}
          </span>
        </div>

        <div class="field">
          <label for="registrationUrl">{{ 'submit.fields.registrationUrl' | translate }} *</label>
          <input
            id="registrationUrl"
            type="url"
            formControlName="registrationUrl"
            [class.invalid]="isInvalid('registrationUrl')"
            placeholder="https://">
          <span *ngIf="isInvalid('registrationUrl') && form.get('registrationUrl')?.errors?.['required']" class="field-error">
            {{ 'submit.required' | translate }}
          </span>
          <span *ngIf="isInvalid('registrationUrl') && form.get('registrationUrl')?.errors?.['pattern']" class="field-error">
            {{ 'submit.url_invalid' | translate }}
          </span>
        </div>

        <div class="field">
          <label for="contactEmail">{{ 'submit.fields.contactEmail' | translate }}</label>
          <input
            id="contactEmail"
            type="email"
            formControlName="contactEmail"
            [class.invalid]="isInvalid('contactEmail')"
            autocomplete="email">
          <span *ngIf="isInvalid('contactEmail')" class="field-error">
            {{ 'submit.email_invalid' | translate }}
          </span>
        </div>

        <div class="field">
          <label for="description">{{ 'submit.fields.description' | translate }}</label>
          <textarea
            id="description"
            formControlName="description"
            rows="4">
          </textarea>
        </div>

        <button
          type="submit"
          class="btn-submit"
          [disabled]="submitting"
          [attr.aria-busy]="submitting">
          <span *ngIf="!submitting">{{ 'submit.btn_submit' | translate }}</span>
          <span *ngIf="submitting" class="spinner-inline"></span>
          <span *ngIf="submitting">{{ 'submit.submitting' | translate }}</span>
        </button>

      </form>
    </main>
  `,
  styles: [`
    .submit-page {
      max-width: 680px;
      margin-inline: auto;
      padding: 24px 16px;
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      color: var(--color-text-primary, #1a202c);
      margin: 0 0 24px;
    }
    .success-state {
      text-align: center;
      padding: 48px 24px;
      background: #f0faf4;
      border-radius: 12px;
      border: 1px solid #a7e3bf;
    }
    .success-message {
      font-size: 16px;
      color: #1e8449;
      font-weight: 600;
      margin: 0 0 20px;
    }
    .error-banner {
      padding: 12px 16px;
      background: #fff5f5;
      border: 1px solid #feb2b2;
      border-radius: 6px;
      color: #c0392b;
      font-size: 14px;
      margin-block-end: 20px;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-block-end: 16px;
    }
    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-block-end: 0;
    }
    label {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-secondary, #4a5568);
    }
    input, select, textarea {
      padding: 10px 12px;
      border: 1px solid #cbd5e0;
      border-radius: 6px;
      font-size: 14px;
      color: var(--color-text-primary, #1a202c);
      background: #fff;
      transition: border-color 0.15s;
      font-family: inherit;
    }
    input:focus, select:focus, textarea:focus {
      outline: 3px solid var(--color-primary, #0d6e6e);
      outline-offset: 1px;
      border-color: var(--color-primary, #0d6e6e);
    }
    input.invalid, select.invalid, textarea.invalid {
      border-color: #c0392b;
    }
    .field-error {
      font-size: 12px;
      color: #c0392b;
      font-weight: 500;
    }
    textarea { resize: vertical; }
    .btn-submit {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 12px 24px;
      background: var(--color-primary, #0d6e6e);
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      margin-block-start: 8px;
      transition: background 0.15s;
    }
    .btn-submit:hover:not(:disabled) { background: #0a5555; }
    .btn-submit:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .btn-submit:focus-visible {
      outline: 3px solid var(--color-primary, #0d6e6e);
      outline-offset: 2px;
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
      transition: background 0.15s;
    }
    .btn-primary:hover { background: #0a5555; }
    .spinner-inline {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 480px) {
      .field-row { grid-template-columns: 1fr; }
    }
  `]
})
export class SubmitFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly submissionService = inject(SubmissionService);

  readonly cities = ['casablanca', 'rabat', 'marrakech', 'fes', 'tanger', 'agadir', 'meknes', 'oujda'];
  readonly categories = ['technology', 'science', 'business', 'startup', 'arts', 'policy', 'health', 'education', 'other'];

  submitting = false;
  submitted = false;
  error: 'rate_limit' | 'generic' | null = null;

  form = this.fb.group({
    titleFr: ['', [Validators.required, Validators.minLength(3)]],
    startDate: ['', Validators.required],
    city: ['', Validators.required],
    category: ['', Validators.required],
    organizer: ['', Validators.required],
    registrationUrl: ['', [Validators.required, Validators.pattern(URL_PATTERN)]],
    contactEmail: ['', Validators.pattern(EMAIL_PATTERN)],
    description: [''],
  });

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.error = null;
    const v = this.form.value;
    const req: SubmissionRequest = {
      titleFr: v.titleFr!,
      startDate: v.startDate!,
      city: v.city!,
      category: v.category!,
      organizer: v.organizer!,
      registrationUrl: v.registrationUrl!,
      ...(v.contactEmail ? { contactEmail: v.contactEmail } : {}),
      ...(v.description ? { description: v.description } : {}),
    };
    this.submissionService.submit(req).subscribe({
      next: () => {
        this.submitting = false;
        this.submitted = true;
      },
      error: (err) => {
        this.submitting = false;
        this.error = err.status === 429 ? 'rate_limit' : 'generic';
      },
    });
  }

  reset(): void {
    this.form.reset();
    this.submitted = false;
    this.error = null;
  }
}
