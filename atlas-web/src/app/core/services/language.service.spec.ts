import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let service: LanguageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [LanguageService, provideTranslateService({ lang: 'fr' })],
    });
    service = TestBed.inject(LanguageService);
  });

  it('defaults to fr when no stored preference', () => {
    expect(service.currentLang).toBe('fr');
  });

  it('reads stored ar preference from localStorage', () => {
    localStorage.setItem('atlas_lang', 'ar');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [LanguageService, provideTranslateService({ lang: 'fr' })],
    });
    const svc = TestBed.inject(LanguageService);
    expect(svc.currentLang).toBe('ar');
  });

  it('setLang fr sets dir=ltr and lang=fr on html', () => {
    service.init();
    service.setLang('fr');
    expect(document.documentElement.getAttribute('lang')).toBe('fr');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
  });

  it('setLang ar sets dir=rtl and lang=ar on html', () => {
    service.init();
    service.setLang('ar');
    expect(document.documentElement.getAttribute('lang')).toBe('ar');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
  });

  it('setLang persists to localStorage', () => {
    service.setLang('ar');
    expect(localStorage.getItem('atlas_lang')).toBe('ar');
  });

  it('lang$ emits the current language', (done) => {
    service.setLang('ar');
    service.lang$.subscribe(lang => {
      expect(lang).toBe('ar');
      done();
    });
  });
});
