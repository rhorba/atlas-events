import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminSubmission, AdminEvent, ScrapeLog } from '../models/event.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/admin`;

  getSubmissions(status = 'PENDING'): Observable<AdminSubmission[]> {
    return this.http.get<AdminSubmission[]>(`${this.base}/submissions`, {
      params: new HttpParams().set('status', status),
    });
  }

  approveSubmission(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/submissions/${id}/approve`, {});
  }

  rejectSubmission(id: string, note?: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/submissions/${id}/reject`, { note: note ?? null });
  }

  getEvents(): Observable<{ data: AdminEvent[] }> {
    return this.http.get<{ data: AdminEvent[] }>(`${this.base}/events`);
  }

  updateEvent(id: string, payload: Partial<AdminEvent>): Observable<{ data: AdminEvent }> {
    return this.http.put<{ data: AdminEvent }>(`${this.base}/events/${id}`, payload);
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/events/${id}`);
  }

  triggerScrape(): Observable<void> {
    return this.http.post<void>(`${this.base}/scrape/trigger`, {});
  }

  getScrapeLogs(source?: string, limit = 20): Observable<ScrapeLog[]> {
    let params = new HttpParams().set('limit', limit);
    if (source) params = params.set('source', source);
    return this.http.get<ScrapeLog[]>(`${this.base}/scrape/logs`, { params });
  }
}
