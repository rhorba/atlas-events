import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'events', pathMatch: 'full' },
  {
    path: 'events',
    loadComponent: () =>
      import('./features/events/event-list/event-list.component').then(
        (m) => m.EventListComponent
      ),
  },
  {
    path: 'events/:id',
    loadComponent: () =>
      import('./features/events/event-detail/event-detail.component').then(
        (m) => m.EventDetailComponent
      ),
  },
  {
    path: 'calendar',
    loadComponent: () =>
      import('./features/calendar/calendar.component').then(
        (m) => m.CalendarComponent
      ),
  },
  {
    path: 'submit',
    loadComponent: () =>
      import('./features/submit/submit-form.component').then(
        (m) => m.SubmitFormComponent
      ),
  },
  { path: '**', redirectTo: 'events' },
];
