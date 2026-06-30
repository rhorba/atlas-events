import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { LanguageToggleComponent } from './language-toggle.component';
import { LanguageService } from '../../../core/services/language.service';

describe('LanguageToggleComponent', () => {
  let fixture: ComponentFixture<LanguageToggleComponent>;
  let langService: LanguageService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LanguageToggleComponent],
      providers: [provideTranslateService({ lang: 'fr' })],
    }).compileComponents();
    fixture = TestBed.createComponent(LanguageToggleComponent);
    langService = TestBed.inject(LanguageService);
    langService.init();
    fixture.detectChanges();
  });

  it('renders FR and AR buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.lang-btn');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent.trim()).toBe('FR');
    expect(buttons[1].textContent.trim()).toBe('AR');
  });

  it('FR button has active class when language is fr', () => {
    langService.setLang('fr');
    fixture.detectChanges();
    const frBtn = fixture.nativeElement.querySelector('.lang-btn:first-child');
    expect(frBtn.classList.contains('active')).toBe(true);
  });

  it('AR button has active class when language is ar', () => {
    langService.setLang('ar');
    fixture.detectChanges();
    const arBtn = fixture.nativeElement.querySelector('.lang-btn:last-child');
    expect(arBtn.classList.contains('active')).toBe(true);
  });

  it('clicking AR button calls setLang(ar)', () => {
    const spy = jest.spyOn(langService, 'setLang');
    const arBtn = fixture.nativeElement.querySelectorAll('.lang-btn')[1];
    arBtn.click();
    expect(spy).toHaveBeenCalledWith('ar');
  });

  it('clicking FR button calls setLang(fr)', () => {
    langService.setLang('ar');
    fixture.detectChanges();
    const spy = jest.spyOn(langService, 'setLang');
    fixture.nativeElement.querySelectorAll('.lang-btn')[0].click();
    expect(spy).toHaveBeenCalledWith('fr');
  });

  it('buttons have aria-pressed attribute', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.lang-btn');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
  });
});
