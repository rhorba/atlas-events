import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Event, EventFilters, EventsResponse } from '../models/event.model';

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/events`;

  getEvents(filters: EventFilters = {}): Observable<EventsResponse> {
    let params = new HttpParams();
    if (filters.city) params = params.set('city', filters.city);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.range) params = params.set('range', filters.range);
    if (filters.page != null) params = params.set('page', filters.page);
    if (filters.size != null) params = params.set('size', filters.size);
    return this.http.get<EventsResponse>(this.base, { params });
  }

  getEvent(id: string): Observable<{ data: Event }> {
    return this.http.get<{ data: Event }>(`${this.base}/${id}`);
  }
}
