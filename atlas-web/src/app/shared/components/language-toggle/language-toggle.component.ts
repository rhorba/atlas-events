import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService, Lang } from '../../../core/services/language.service';

@Component({
  selector: 'app-language-toggle',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="lang-toggle" role="group" [attr.aria-label]="'nav.language' | translate">
      <button
        class="lang-btn"
        [class.active]="current === 'fr'"
        (click)="setLang('fr')"
        [attr.aria-pressed]="current === 'fr'"
        lang="fr">
        FR
      </button>
      <button
        class="lang-btn"
        [class.active]="current === 'ar'"
        (click)="setLang('ar')"
        [attr.aria-pressed]="current === 'ar'"
        lang="ar">
        AR
      </button>
    </div>
  `,
  styles: [`
    .lang-toggle {
      display: flex;
      gap: 4px;
    }
    .lang-btn {
      padding: 4px 12px;
      border: 2px solid var(--color-primary, #0d6e6e);
      background: transparent;
      color: var(--color-primary, #0d6e6e);
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.15s, color 0.15s;
    }
    .lang-btn:focus-visible {
      outline: 3px solid var(--color-primary, #0d6e6e);
      outline-offset: 2px;
    }
    .lang-btn.active {
      background: var(--color-primary, #0d6e6e);
      color: #fff;
    }
  `]
})
export class LanguageToggleComponent {
  private readonly langService = inject(LanguageService);

  get current(): Lang {
    return this.langService.currentLang;
  }

  setLang(lang: Lang): void {
    this.langService.setLang(lang);
  }
}
