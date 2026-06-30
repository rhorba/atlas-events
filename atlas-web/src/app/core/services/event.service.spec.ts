import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { EventService } from './event.service';
import { environment } from '../../../environments/environment';

describe('EventService', () => {
  let service: EventService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/api/v1/events`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EventService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EventService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getEvents with no filters calls base URL', () => {
    service.getEvents().subscribe();
    const req = http.expectOne(r => r.url === base);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], total: 0, page: 0, size: 20 });
  });

  it('getEvents with city filter adds city param', () => {
    service.getEvents({ city: 'casablanca' }).subscribe();
    const req = http.expectOne(r => r.url === base && r.params.get('city') === 'casablanca');
    expect(req.request.params.get('city')).toBe('casablanca');
    req.flush({ data: [], total: 0, page: 0, size: 20 });
  });

  it('getEvents with category filter adds category param', () => {
    service.getEvents({ category: 'technology' }).subscribe();
    const req = http.expectOne(r => r.params.get('category') === 'technology');
    req.flush({ data: [], total: 0, page: 0, size: 20 });
  });

  it('getEvents with range filter adds range param', () => {
    service.getEvents({ range: 'week' }).subscribe();
    const req = http.expectOne(r => r.params.get('range') === 'week');
    req.flush({ data: [], total: 0, page: 0, size: 20 });
  });

  it('getEvents returns response data', (done) => {
    const mockResponse = {
      data: [{ id: '1', title: { fr: 'Test' }, startDate: '2026-07-15', city: 'rabat', category: 'technology', isFree: false, status: 'upcoming' }],
      total: 1, page: 0, size: 20,
    };
    service.getEvents().subscribe(res => {
      expect(res.data.length).toBe(1);
      expect(res.total).toBe(1);
      done();
    });
    http.expectOne(r => r.url === base).flush(mockResponse);
  });

  it('getEvent calls events/{id}', () => {
    service.getEvent('abc-123').subscribe();
    const req = http.expectOne(`${base}/abc-123`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: { id: 'abc-123', title: { fr: 'Event' }, startDate: '2026-07-15', city: 'fes', category: 'science', isFree: true, status: 'upcoming' } });
  });
});
