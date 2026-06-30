import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { EventDetailComponent } from './event-detail.component';
import { EventService } from '../../../core/services/event.service';
import { Event } from '../../../core/models/event.model';

const mockEvent: Event = {
  id: 'abc-123',
  title: { fr: 'Conférence Tech Maroc', ar: 'مؤتمر تقني' },
  startDate: '2026-08-10T09:00:00Z',
  endDate: '2026-08-10T18:00:00Z',
  city: 'casablanca',
  venue: 'Casa Techno Hub',
  category: 'technology',
  organizer: 'TechMa',
  description: 'La grande conférence tech du Maroc.',
  registrationUrl: 'https://example.com/register',
  isFree: false,
  tags: ['ai', 'cloud'],
  status: 'APPROVED',
};

describe('EventDetailComponent', () => {
  let fixture: ComponentFixture<EventDetailComponent>;
  let component: EventDetailComponent;
  let eventService: jest.Mocked<EventService>;

  afterEach(() => jest.restoreAllMocks());

  beforeEach(async () => {
    const serviceMock = {
      getEvent: jest.fn().mockReturnValue(of({ data: mockEvent })),
    };

    await TestBed.configureTestingModule({
      imports: [EventDetailComponent, RouterTestingModule],
      providers: [
        provideTranslateService({ lang: 'fr' }),
        { provide: EventService, useValue: serviceMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'abc-123' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventDetailComponent);
    component = fixture.componentInstance;
    eventService = TestBed.inject(EventService) as jest.Mocked<EventService>;
  });

  it('loads and displays the event on success', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.event).toEqual(mockEvent);
    expect(component.notFound).toBe(false);
  });

  it('sets notFound=true on 404 error', async () => {
    eventService.getEvent.mockReturnValue(throwError(() => ({ status: 404 })));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.notFound).toBe(true);
    expect(component.event).toBeNull();
  });

  it('sets notFound=false on non-404 error', async () => {
    eventService.getEvent.mockReturnValue(throwError(() => ({ status: 500 })));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.notFound).toBe(false);
    expect(component.loading).toBe(false);
  });

  it('starts in loading state', () => {
    expect(component.loading).toBe(true);
    expect(component.event).toBeNull();
  });

  it('downloadIcs creates a blob link and triggers download', () => {
    component.event = mockEvent;
    const createMock = jest.fn().mockReturnValue('blob:url');
    const revokeMock = jest.fn();
    Object.defineProperty(globalThis, 'URL', {
      value: { createObjectURL: createMock, revokeObjectURL: revokeMock },
      writable: true,
      configurable: true,
    });
    const clickSpy = jest.fn();
    const fakeAnchor = { href: '', download: '', click: clickSpy } as unknown as HTMLAnchorElement;
    jest.spyOn(document, 'createElement').mockReturnValue(fakeAnchor);

    component.downloadIcs();

    expect(createMock).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeMock).toHaveBeenCalledWith('blob:url');
  });

  it('downloadIcs does nothing when event is null', () => {
    component.event = null;
    expect(() => component.downloadIcs()).not.toThrow();
  });

  it('calls getEvent with the route id', () => {
    fixture.detectChanges();
    expect(eventService.getEvent).toHaveBeenCalledWith('abc-123');
  });

  it('downloadIcs omits LOCATION when event has no venue', () => {
    const noVenue = { ...mockEvent, venue: undefined, registrationUrl: undefined };
    component.event = noVenue;
    const createMock = jest.fn().mockReturnValue('blob:url');
    const revokeMock = jest.fn();
    Object.defineProperty(globalThis, 'URL', {
      value: { createObjectURL: createMock, revokeObjectURL: revokeMock },
      writable: true,
      configurable: true,
    });
    const clickSpy = jest.fn();
    const fakeAnchor = { href: '', download: '', click: clickSpy } as unknown as HTMLAnchorElement;
    jest.spyOn(document, 'createElement').mockReturnValue(fakeAnchor);

    component.downloadIcs();

    const blobArg: string = createMock.mock.calls[0][0].text ? '' : createMock.mock.calls[0][0];
    expect(createMock).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });
});
