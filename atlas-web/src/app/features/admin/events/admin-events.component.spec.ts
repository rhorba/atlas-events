import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { AdminEventsComponent } from './admin-events.component';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminEvent } from '../../../core/models/event.model';

const mockEvent: AdminEvent = {
  id: 'ev-1', title: { fr: 'Tech Conf' }, startDate: '2026-09-10T09:00:00Z',
  city: 'rabat', category: 'technology', organizer: 'TechMa', isFree: false, status: 'upcoming',
};

describe('AdminEventsComponent', () => {
  let fixture: ComponentFixture<AdminEventsComponent>;
  let component: AdminEventsComponent;
  let adminService: jest.Mocked<AdminService>;
  let router: Router;

  beforeEach(async () => {
    const adminMock = {
      getEvents: jest.fn().mockReturnValue(of({ data: [mockEvent] })),
      updateEvent: jest.fn().mockReturnValue(of({ data: { ...mockEvent, city: 'fes' } })),
      deleteEvent: jest.fn().mockReturnValue(of(void 0)),
    };
    const authMock = { logout: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [AdminEventsComponent, RouterTestingModule.withRoutes([])],
      providers: [
        provideTranslateService({ lang: 'fr' }),
        { provide: AdminService, useValue: adminMock },
        { provide: AuthService, useValue: authMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminEventsComponent);
    component = fixture.componentInstance;
    adminService = TestBed.inject(AdminService) as jest.Mocked<AdminService>;
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation(async () => true);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('loads events on init', () => {
    expect(component.events).toHaveLength(1);
    expect(component.loading).toBe(false);
  });

  it('startEdit sets editingId and patches form', () => {
    component.startEdit(mockEvent);
    expect(component.editingId).toBe('ev-1');
    expect(component.editForm.value.city).toBe('rabat');
  });

  it('cancelEdit clears editingId', () => {
    component.editingId = 'ev-1';
    component.cancelEdit();
    expect(component.editingId).toBeNull();
  });

  it('saveEdit updates event in list and clears editingId', () => {
    component.startEdit(mockEvent);
    component.saveEdit('ev-1');
    expect(component.editingId).toBeNull();
    expect(component.events[0].city).toBe('fes');
  });

  it('saveEdit sets actionError on failure', () => {
    adminService.updateEvent.mockReturnValue(throwError(() => new Error()));
    component.startEdit(mockEvent);
    component.saveEdit('ev-1');
    expect(component.actionError).toBe('ev-1');
  });

  it('deleteEvent soft-deletes item (sets deletedAt) when confirmed', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    component.deleteEvent('ev-1');
    expect(component.events[0].deletedAt).toBeTruthy();
  });

  it('deleteEvent does nothing when user cancels confirm', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    component.deleteEvent('ev-1');
    expect(adminService.deleteEvent).not.toHaveBeenCalled();
  });

  it('load sets loading=false on error', () => {
    adminService.getEvents.mockReturnValue(throwError(() => new Error()));
    component['load']();
    expect(component.loading).toBe(false);
  });

  it('deleteEvent sets actionError on API failure', () => {
    adminService.deleteEvent.mockReturnValue(throwError(() => new Error()));
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    component.deleteEvent('ev-1');
    expect(component.actionError).toBe('ev-1');
  });

  it('logout calls authService.logout and navigates', () => {
    const auth = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    component.logout();
    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/login']);
  });
});
