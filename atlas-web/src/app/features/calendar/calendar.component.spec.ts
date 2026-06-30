import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideTranslateService, TranslatePipe } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CalendarComponent } from './calendar.component';
import { EventService } from '../../core/services/event.service';
import { LanguageService } from '../../core/services/language.service';
import { Event } from '../../core/models/event.model';

jest.mock('@fullcalendar/angular', () => ({
  FullCalendarModule: class {},
  FullCalendarComponent: class {},
}));
jest.mock('@fullcalendar/daygrid', () => ({ default: {} }));
jest.mock('@fullcalendar/list', () => ({ default: {} }));

const mockEvents: Event[] = [
  {
    id: '1',
    title: { fr: 'Startup Weekend Casablanca' },
    startDate: '2026-08-01T09:00:00Z',
    city: 'casablanca',
    category: 'startup',
    isFree: true,
    status: 'APPROVED',
  },
  {
    id: '2',
    title: { fr: 'Tech Summit Rabat' },
    startDate: '2026-08-15T09:00:00Z',
    city: 'rabat',
    category: 'technology',
    isFree: false,
    status: 'APPROVED',
  },
];

describe('CalendarComponent', () => {
  let fixture: ComponentFixture<CalendarComponent>;
  let component: CalendarComponent;
  let eventService: jest.Mocked<EventService>;

  beforeEach(async () => {
    const eventServiceMock = {
      getEvents: jest.fn().mockReturnValue(of({ data: mockEvents, total: 2, page: 0, size: 200 })),
    };
    const langServiceMock = {
      lang$: of('fr'),
      currentLang: 'fr',
    };

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        provideTranslateService({ lang: 'fr' }),
        { provide: EventService, useValue: eventServiceMock },
        { provide: LanguageService, useValue: langServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(CalendarComponent, {
      set: {
        imports: [CommonModule, TranslatePipe],
        template: `<main></main>`,
      },
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendarComponent);
    component = fixture.componentInstance;
    eventService = TestBed.inject(EventService) as jest.Mocked<EventService>;
  });

  it('loads events on init and clears loading state', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.loading).toBe(false);
    expect(component.error).toBe(false);
  });

  it('sets error=true when EventService fails', async () => {
    eventService.getEvents.mockReturnValue(throwError(() => new Error('network')));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.error).toBe(true);
  });

  it('filters calendarOptions events by selected category', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.onCategoryChange({ target: { value: 'startup' } } as any);

    const events = component.calendarOptions['events'] as any[];
    expect(events.length).toBe(1);
    expect(events[0].id).toBe('1');
  });

  it('shows all events when category is ALL', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.onCategoryChange({ target: { value: '__all__' } } as any);

    const events = component.calendarOptions['events'] as any[];
    expect(events.length).toBe(2);
  });

  it('exposes ALL constant', () => {
    expect(component.ALL).toBe('__all__');
  });

  it('exposes all expected categories', () => {
    expect(component.categories).toContain('technology');
    expect(component.categories).toContain('startup');
    expect(component.categories.length).toBe(9);
  });

  it('onResize does not throw when calendarEl is undefined', () => {
    (component as any).calendarEl = undefined;
    expect(() => component.onResize()).not.toThrow();
  });

  it('ngOnDestroy completes the destroy subject', () => {
    const spy = jest.spyOn((component as any).destroy$, 'next');
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
  });
});
