import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { AdminScrapeComponent } from './admin-scrape.component';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { ScrapeLog } from '../../../core/models/event.model';

const mockLog: ScrapeLog = {
  id: 'log-1', source: '10times', url: 'https://10times.com',
  eventsFound: 5, eventsInserted: 3, success: true,
  startedAt: '2026-08-01T10:00:00Z', finishedAt: '2026-08-01T10:01:00Z',
};

describe('AdminScrapeComponent', () => {
  let fixture: ComponentFixture<AdminScrapeComponent>;
  let component: AdminScrapeComponent;
  let adminService: jest.Mocked<AdminService>;
  let router: Router;

  beforeEach(async () => {
    const adminMock = {
      getScrapeLogs: jest.fn().mockReturnValue(of([mockLog])),
      triggerScrape: jest.fn().mockReturnValue(of(void 0)),
    };
    const authMock = { logout: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [AdminScrapeComponent, RouterTestingModule.withRoutes([])],
      providers: [
        provideTranslateService({ lang: 'fr' }),
        { provide: AdminService, useValue: adminMock },
        { provide: AuthService, useValue: authMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminScrapeComponent);
    component = fixture.componentInstance;
    adminService = TestBed.inject(AdminService) as jest.Mocked<AdminService>;
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation(async () => true);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('loads scrape logs on init', () => {
    expect(component.logs).toHaveLength(1);
    expect(component.loading).toBe(false);
  });

  it('shows empty table when no logs', async () => {
    adminService.getScrapeLogs.mockReturnValue(of([]));
    component['load']();
    await fixture.whenStable();
    expect(component.logs).toHaveLength(0);
  });

  it('trigger calls adminService.triggerScrape and flashes message', () => {
    component.trigger();
    expect(adminService.triggerScrape).toHaveBeenCalled();
    expect(component.triggering).toBe(false);
    expect(component.successMsg).toBeTruthy();
  });

  it('trigger sets triggerError on failure', () => {
    adminService.triggerScrape.mockReturnValue(throwError(() => new Error()));
    component.trigger();
    expect(component.triggerError).toBe(true);
    expect(component.triggering).toBe(false);
  });

  it('load sets loading=false on error', () => {
    adminService.getScrapeLogs.mockReturnValue(throwError(() => new Error()));
    component['load']();
    expect(component.loading).toBe(false);
  });

  it('logout calls authService.logout and navigates', () => {
    const auth = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    component.logout();
    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/login']);
  });
});
