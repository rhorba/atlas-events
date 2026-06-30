import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from './core/services/language.service';
import { LanguageToggleComponent } from './shared/components/language-toggle/language-toggle.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, LanguageToggleComponent],
  template: `
    <nav class="app-nav">
      <a class="nav-brand" routerLink="/events">Atlas Events</a>
      <ul class="nav-links" role="list">
        <li>
          <a routerLink="/events" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            {{ 'nav.events' | translate }}
          </a>
        </li>
        <li>
          <a routerLink="/calendar" routerLinkActive="active">
            {{ 'nav.calendar' | translate }}
          </a>
        </li>
        <li>
          <a routerLink="/submit" routerLinkActive="active">
            {{ 'nav.submit' | translate }}
          </a>
        </li>
      </ul>
      <app-language-toggle></app-language-toggle>
    </nav>
    <router-outlet></router-outlet>
  `,
  styles: [`
    .app-nav {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 24px;
      background: var(--color-primary, #0d6e6e);
      box-shadow: 0 2px 4px rgba(0,0,0,.1);
    }
    .nav-brand {
      color: #fff;
      font-size: 20px;
      font-weight: 800;
      text-decoration: none;
      letter-spacing: -0.5px;
      flex-shrink: 0;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 4px;
      list-style: none;
      margin: 0;
      padding: 0;
      flex: 1;
    }
    .nav-links a {
      color: rgba(255,255,255,.8);
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 4px;
      transition: background 0.15s, color 0.15s;
    }
    .nav-links a:hover,
    .nav-links a.active {
      color: #fff;
      background: rgba(255,255,255,.15);
    }
    .nav-links a:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 2px;
    }
    @media (max-width: 600px) {
      .nav-links { display: none; }
    }
  `]
})
export class AppComponent implements OnInit {
  private readonly langService = inject(LanguageService);

  ngOnInit(): void {
    this.langService.init();
  }
}
