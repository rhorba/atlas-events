import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from './core/services/language.service';
import { LanguageToggleComponent } from './shared/components/language-toggle/language-toggle.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TranslatePipe, LanguageToggleComponent],
  template: `
    <nav class="app-nav">
      <a class="nav-brand" routerLink="/events">Atlas Events</a>
      <app-language-toggle></app-language-toggle>
    </nav>
    <router-outlet></router-outlet>
  `,
  styles: [`
    .app-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
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
    }
  `]
})
export class AppComponent implements OnInit {
  private readonly langService = inject(LanguageService);

  ngOnInit(): void {
    this.langService.init();
  }
}
