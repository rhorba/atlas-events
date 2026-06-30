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
  { path: '**', redirectTo: 'events' },
];
