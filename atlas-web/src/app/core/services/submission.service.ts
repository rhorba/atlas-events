import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SubmissionRequest } from '../models/event.model';

@Injectable({ providedIn: 'root' })
export class SubmissionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/submissions`;

  submit(req: SubmissionRequest): Observable<void> {
    const apiReq = {
      title: req.titleFr,
      startDate: `${req.startDate}T00:00:00+01:00`,
      city: req.city,
      organizerName: req.organizer,
      eventUrl: req.registrationUrl,
      contactEmail: req.contactEmail ?? null,
      description: req.description ?? null,
      isFree: false,
    };
    return this.http.post<void>(this.base, apiReq);
  }
}
