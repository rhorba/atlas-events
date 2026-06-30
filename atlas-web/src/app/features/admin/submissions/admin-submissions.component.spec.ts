import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { AdminSubmissionsComponent } from './admin-submissions.component';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminSubmission } from '../../../core/models/event.model';

const mockSub: AdminSubmission = {
  id: 'sub-1', title: 'Tech Day', city: 'casablanca',
  organizerName: 'TechMa', startDate: '2026-09-01T09:00:00Z',
  isFree: true, status: 'PENDING', createdAt: '2026-08-01T00:00:00Z',
};

describe('AdminSubmissionsComponent', () => {
  let fixture: ComponentFixture<AdminSubmissionsComponent>;
  let component: AdminSubmissionsComponent;
  let adminService: jest.Mocked<AdminService>;
  let router: Router;

  beforeEach(async () => {
    const adminMock = {
      getSubmissions: jest.fn().mockReturnValue(of([mockSub])),
      approveSubmission: jest.fn().mockReturnValue(of(void 0)),
      rejectSubmission: jest.fn().mockReturnValue(of(void 0)),
    };
    const authMock = { logout: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [AdminSubmissionsComponent, RouterTestingModule.withRoutes([])],
      providers: [
        provideTranslateService({ lang: 'fr' }),
        { provide: AdminService, useValue: adminMock },
        { provide: AuthService, useValue: authMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSubmissionsComponent);
    component = fixture.componentInstance;
    adminService = TestBed.inject(AdminService) as jest.Mocked<AdminService>;
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation(async () => true);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('loads submissions on init', () => {
    expect(component.items).toHaveLength(1);
    expect(component.loading).toBe(false);
  });

  it('shows empty state when no submissions', async () => {
    adminService.getSubmissions.mockReturnValue(of([]));
    component['load']();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.items).toHaveLength(0);
  });

  it('approve removes item from list', () => {
    component.approve('sub-1');
    expect(component.items).toHaveLength(0);
  });

  it('approve sets actionError on failure', () => {
    adminService.approveSubmission.mockReturnValue(throwError(() => new Error()));
    component.approve('sub-1');
    expect(component.actionError).toBe('sub-1');
  });

  it('startReject sets rejectingId', () => {
    component.startReject('sub-1');
    expect(component.rejectingId).toBe('sub-1');
  });

  it('cancelReject clears rejectingId', () => {
    component.rejectingId = 'sub-1';
    component.cancelReject();
    expect(component.rejectingId).toBeNull();
  });

  it('confirmReject removes item and clears rejectingId', () => {
    component.rejectingId = 'sub-1';
    component.rejectNote = 'spam';
    component.confirmReject('sub-1');
    expect(component.items).toHaveLength(0);
    expect(component.rejectingId).toBeNull();
  });

  it('load sets loading=false on error', () => {
    adminService.getSubmissions.mockReturnValue(throwError(() => new Error()));
    component['load']();
    expect(component.loading).toBe(false);
  });

  it('confirmReject sets actionError on failure', () => {
    adminService.rejectSubmission.mockReturnValue(throwError(() => new Error()));
    component.rejectingId = 'sub-1';
    component.confirmReject('sub-1');
    expect(component.actionError).toBe('sub-1');
  });

  it('logout calls authService.logout and navigates', () => {
    const auth = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    component.logout();
    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/login']);
  });
});
