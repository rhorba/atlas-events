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
