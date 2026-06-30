export interface EventTitle {
  fr: string;
  ar?: string;
}

export interface Event {
  id: string;
  title: EventTitle;
  startDate: string;
  endDate?: string;
  city: string;
  venue?: string;
  category: string;
  organizer?: string;
  description?: string;
  registrationUrl?: string;
  isFree: boolean;
  tags?: string[];
  status: string;
}

export interface EventsResponse {
  data: Event[];
  total: number;
  page: number;
  size: number;
}

export interface EventFilters {
  city?: string;
  category?: string;
  range?: 'week' | 'month' | '';
  page?: number;
  size?: number;
}

export interface SubmissionRequest {
  titleFr: string;
  startDate: string;
  city: string;
  category: string;
  organizer: string;
  registrationUrl: string;
  contactEmail?: string;
  description?: string;
}

export interface AdminSubmission {
  id: string;
  title: string;
  city: string;
  organizerName: string;
  startDate: string;
  eventUrl?: string;
  contactEmail?: string;
  isFree: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote?: string;
  createdAt: string;
}

export interface AdminEvent {
  id: string;
  title: { fr?: string; ar?: string };
  startDate: string;
  endDate?: string;
  city: string;
  category: string;
  organizer: string;
  registrationUrl?: string;
  venue?: string;
  isFree: boolean;
  status: string;
  deletedAt?: string;
}

export interface ScrapeLog {
  id: string;
  source: string;
  url: string;
  eventsFound: number;
  eventsInserted: number;
  success: boolean;
  errorMessage?: string;
  startedAt: string;
  finishedAt: string;
}
