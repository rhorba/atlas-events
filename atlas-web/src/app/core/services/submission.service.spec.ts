import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SubmissionService } from './submission.service';
import { SubmissionRequest } from '../models/event.model';
import { environment } from '../../../environments/environment';

const mockReq: SubmissionRequest = {
  titleFr: 'Atlas DevConf 2026',
  startDate: '2026-09-01',
  city: 'casablanca',
  category: 'technology',
  organizer: 'AtlasTech',
  registrationUrl: 'https://atlastech.ma/devconf',
};

describe('SubmissionService', () => {
  let service: SubmissionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SubmissionService],
    });
    service = TestBed.inject(SubmissionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('POSTs to /api/v1/submissions with the request body', () => {
    service.submit(mockReq).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/api/v1/submissions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockReq);
    req.flush(null, { status: 201, statusText: 'Created' });
  });

  it('forwards HTTP errors to the caller', () => {
    let caught: any;
    service.submit(mockReq).subscribe({ error: (e) => (caught = e) });
    const req = http.expectOne(`${environment.apiUrl}/api/v1/submissions`);
    req.flush('Too Many Requests', { status: 429, statusText: 'Too Many Requests' });
    expect(caught.status).toBe(429);
  });
});
