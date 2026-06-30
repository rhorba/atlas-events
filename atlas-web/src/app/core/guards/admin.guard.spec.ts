import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';

describe('adminGuard', () => {
  let authService: jest.Mocked<AuthService>;
  let router: Router;

  const runGuard = () =>
    TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));

  beforeEach(() => {
    const authMock = { isLoggedIn: jest.fn() };
    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([])],
      providers: [{ provide: AuthService, useValue: authMock }],
    });
    authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    router = TestBed.inject(Router);
  });

  it('returns true when logged in', () => {
    authService.isLoggedIn.mockReturnValue(true);
    expect(runGuard()).toBe(true);
  });

  it('returns UrlTree to /admin/login when not logged in', () => {
    authService.isLoggedIn.mockReturnValue(false);
    const result = runGuard();
    expect(result).not.toBe(true);
    expect(result.toString()).toBe('/admin/login');
  });
});
