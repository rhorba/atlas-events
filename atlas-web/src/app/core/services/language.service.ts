import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

export type Lang = 'fr' | 'ar';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly STORAGE_KEY = 'atlas_lang';

  private readonly _lang$ = new BehaviorSubject<Lang>(this.storedLang());
  readonly lang$ = this._lang$.asObservable();

  get currentLang(): Lang {
    return this._lang$.value;
  }

  init(): void {
    this.translate.addLangs(['fr', 'ar']);
    this.applyLang(this._lang$.value);
  }

  setLang(lang: Lang): void {
    localStorage.setItem(this.STORAGE_KEY, lang);
    this._lang$.next(lang);
    this.applyLang(lang);
  }

  private applyLang(lang: Lang): void {
    this.translate.use(lang);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }

  private storedLang(): Lang {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored === 'ar' ? 'ar' : 'fr';
  }
}
