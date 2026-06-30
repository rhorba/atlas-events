import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

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
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/login/admin-login.component').then(
        (m) => m.AdminLoginComponent
      ),
  },
  {
    path: 'admin/submissions',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/submissions/admin-submissions.component').then(
        (m) => m.AdminSubmissionsComponent
      ),
  },
  {
    path: 'admin/events',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/events/admin-events.component').then(
        (m) => m.AdminEventsComponent
      ),
  },
  {
    path: 'admin/scrape',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/scrape/admin-scrape.component').then(
        (m) => m.AdminScrapeComponent
      ),
  },
  { path: 'admin', redirectTo: 'admin/submissions', pathMatch: 'full' },
  { path: '**', redirectTo: 'events' },
];
