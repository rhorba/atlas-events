import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminService } from './admin.service';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}/api/v1/admin`;

describe('AdminService', () => {
  let service: AdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(AdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getSubmissions calls GET /admin/submissions?status=PENDING', () => {
    service.getSubmissions().subscribe();
    const req = http.expectOne(`${BASE}/submissions?status=PENDING`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getSubmissions accepts custom status', () => {
    service.getSubmissions('APPROVED').subscribe();
    const req = http.expectOne(`${BASE}/submissions?status=APPROVED`);
    req.flush([]);
  });

  it('approveSubmission calls PATCH /admin/submissions/{id}/approve', () => {
    service.approveSubmission('abc').subscribe();
    const req = http.expectOne(`${BASE}/submissions/abc/approve`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('rejectSubmission calls PATCH /admin/submissions/{id}/reject with note', () => {
    service.rejectSubmission('abc', 'spam').subscribe();
    const req = http.expectOne(`${BASE}/submissions/abc/reject`);
    expect(req.request.body).toEqual({ note: 'spam' });
    req.flush(null);
  });

  it('rejectSubmission sends null note when none provided', () => {
    service.rejectSubmission('abc').subscribe();
    const req = http.expectOne(`${BASE}/submissions/abc/reject`);
    expect(req.request.body).toEqual({ note: null });
    req.flush(null);
  });

  it('getEvents calls GET /admin/events', () => {
    service.getEvents().subscribe();
    const req = http.expectOne(`${BASE}/events`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('updateEvent calls PUT /admin/events/{id}', () => {
    service.updateEvent('xyz', { city: 'rabat' }).subscribe();
    const req = http.expectOne(`${BASE}/events/xyz`);
    expect(req.request.method).toBe('PUT');
    req.flush({ data: {} });
  });

  it('deleteEvent calls DELETE /admin/events/{id}', () => {
    service.deleteEvent('xyz').subscribe();
    const req = http.expectOne(`${BASE}/events/xyz`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('triggerScrape calls POST /admin/scrape/trigger', () => {
    service.triggerScrape().subscribe();
    const req = http.expectOne(`${BASE}/scrape/trigger`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('getScrapeLogs calls GET /admin/scrape/logs with limit', () => {
    service.getScrapeLogs().subscribe();
    const req = http.expectOne(`${BASE}/scrape/logs?limit=20`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getScrapeLogs includes source when provided', () => {
    service.getScrapeLogs('10times').subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/scrape/logs`);
    expect(req.request.params.get('source')).toBe('10times');
    req.flush([]);
  });
});
