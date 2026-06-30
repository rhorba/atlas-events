import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { AdminLoginComponent } from './admin-login.component';
import { AuthService } from '../../../core/services/auth.service';

describe('AdminLoginComponent', () => {
  let fixture: ComponentFixture<AdminLoginComponent>;
  let component: AdminLoginComponent;
  let authService: jest.Mocked<AuthService>;
  let router: Router;

  beforeEach(async () => {
    const authMock = { login: jest.fn() };
    await TestBed.configureTestingModule({
      imports: [AdminLoginComponent, RouterTestingModule.withRoutes([])],
      providers: [
        provideTranslateService({ lang: 'fr' }),
        { provide: AuthService, useValue: authMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation(async () => true);
    fixture.detectChanges();
  });

  it('renders the login form', () => {
    expect(fixture.nativeElement.querySelector('form')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#username')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#password')).toBeTruthy();
  });

  it('does not submit when form is invalid', () => {
    component.onSubmit();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('calls auth.login with credentials and navigates on success', () => {
    authService.login.mockReturnValue(of(void 0));
    component.form.setValue({ username: 'admin', password: 'secret' });
    component.onSubmit();
    expect(authService.login).toHaveBeenCalledWith('admin', 'secret');
    expect(router.navigate).toHaveBeenCalledWith(['/admin/submissions']);
  });

  it('shows error on 401 and clears submitting state', () => {
    authService.login.mockReturnValue(throwError(() => ({ status: 401 })));
    component.form.setValue({ username: 'admin', password: 'wrong' });
    component.onSubmit();
    expect(component.error).toBe(true);
    expect(component.submitting).toBe(false);
  });

  it('does not double-submit while submitting', () => {
    authService.login.mockReturnValue(of(void 0));
    component.form.setValue({ username: 'admin', password: 'secret' });
    component.submitting = true;
    component.onSubmit();
    expect(authService.login).not.toHaveBeenCalled();
  });
});
