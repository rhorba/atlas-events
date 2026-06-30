import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { EventListComponent } from './event-list.component';
import { EventService } from '../../../core/services/event.service';
import { Event } from '../../../core/models/event.model';

const mockEvent: Event = {
  id: '1',
  title: { fr: 'Conference Maroc' },
  startDate: '2026-08-01T09:00:00Z',
  city: 'casablanca',
  category: 'technology',
  isFree: false,
  status: 'upcoming',
};

function makeRoute(params: Record<string, string> = {}) {
  return { queryParams: of(params) };
}

describe('EventListComponent', () => {
  let fixture: ComponentFixture<EventListComponent>;
  let component: EventListComponent;
  let eventService: jest.Mocked<EventService>;
  let router: Router;

  beforeEach(async () => {
    const eventServiceMock = {
      getEvents: jest.fn().mockReturnValue(of({ data: [mockEvent], total: 1, page: 0, size: 20 })),
      getEvent: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EventListComponent, RouterTestingModule.withRoutes([])],
      providers: [
        provideTranslateService({ lang: 'fr' }),
        { provide: EventService, useValue: eventServiceMock },
        { provide: ActivatedRoute, useValue: makeRoute() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventListComponent);
    component = fixture.componentInstance;
    eventService = TestBed.inject(EventService) as jest.Mocked<EventService>;
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation(async () => true);
    fixture.detectChanges();
  });

  it('shows loading skeletons initially', () => {
    eventService.getEvents.mockReturnValue(of({ data: [], total: 0, page: 0, size: 20 }));
    component['loading'] = true;
    fixture.detectChanges();
    const skeletons = fixture.nativeElement.querySelectorAll('app-skeleton-card');
    expect(skeletons.length).toBe(3);
  });

  it('renders event cards after load', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('app-event-card');
    expect(cards.length).toBe(1);
  });

  it('shows empty state when no events', async () => {
    eventService.getEvents.mockReturnValue(of({ data: [], total: 0, page: 0, size: 20 }));
    component['loadEvents']();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.empty-state')).toBeTruthy();
  });

  it('shows error state on API failure', async () => {
    eventService.getEvents.mockReturnValue(throwError(() => new Error('Network error')));
    component['loadEvents']();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.error-state')).toBeTruthy();
  });

  it('onFiltersChange navigates with query params', () => {
    component.onFiltersChange({ city: 'rabat', category: 'science' });
    expect(router.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: expect.objectContaining({ city: 'rabat' }) })
    );
  });

  it('resetFilters navigates with empty query params', () => {
    component.resetFilters();
    expect(router.navigate).toHaveBeenCalledWith([], { queryParams: {} });
  });

  it('loads events from route query params', async () => {
    TestBed.resetTestingModule();
    const eventServiceMock2 = {
      getEvents: jest.fn().mockReturnValue(of({ data: [], total: 0, page: 0, size: 20 })),
    };
    await TestBed.configureTestingModule({
      imports: [EventListComponent, RouterTestingModule.withRoutes([])],
      providers: [
        provideTranslateService({ lang: 'fr' }),
        { provide: EventService, useValue: eventServiceMock2 },
        { provide: ActivatedRoute, useValue: makeRoute({ city: 'fes' }) },
      ],
    }).compileComponents();
    const r = TestBed.inject(Router);
    jest.spyOn(r, 'navigate').mockImplementation(async () => true);
    const fix = TestBed.createComponent(EventListComponent);
    fix.detectChanges();
    await fix.whenStable();
    expect(eventServiceMock2.getEvents).toHaveBeenCalledWith(
      expect.objectContaining({ city: 'fes' })
    );
  });
});
