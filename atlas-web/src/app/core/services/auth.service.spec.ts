import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  const TOKEN_KEY = 'atlas_admin_token';

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('login stores token in sessionStorage on success', () => {
    service.login('admin', 'secret').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/api/v1/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'admin', password: 'secret' });
    req.flush({ data: { token: 'jwt-abc' } });
    expect(sessionStorage.getItem(TOKEN_KEY)).toBe('jwt-abc');
  });

  it('login does not store token on 401', () => {
    let hadError = false;
    service.login('admin', 'wrong').subscribe({ error: () => { hadError = true; } });
    http.expectOne(`${environment.apiUrl}/api/v1/auth/login`)
      .flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(hadError).toBe(true);
  });

  it('isLoggedIn returns false when no token', () => {
    expect(service.isLoggedIn()).toBe(false);
  });

  it('isLoggedIn returns true after login', () => {
    sessionStorage.setItem(TOKEN_KEY, 'test-token');
    expect(service.isLoggedIn()).toBe(true);
  });

  it('getToken returns null when not logged in', () => {
    expect(service.getToken()).toBeNull();
  });

  it('logout removes token from sessionStorage', () => {
    sessionStorage.setItem(TOKEN_KEY, 'test-token');
    service.logout();
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });
});
