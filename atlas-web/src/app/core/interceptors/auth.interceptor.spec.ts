import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let authService: jest.Mocked<Pick<AuthService, 'getToken'>>;

  const TOKEN_KEY = 'atlas_admin_token';

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as any;
  });

  afterEach(() => {
    controller.verify();
    sessionStorage.clear();
  });

  it('adds Authorization header for admin URLs when token exists', () => {
    sessionStorage.setItem(TOKEN_KEY, 'test-jwt');
    http.get('/api/v1/admin/submissions').subscribe();
    const req = controller.expectOne('/api/v1/admin/submissions');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt');
    req.flush([]);
  });

  it('does not add Authorization header for non-admin URLs', () => {
    sessionStorage.setItem(TOKEN_KEY, 'test-jwt');
    http.get('/api/v1/events').subscribe();
    const req = controller.expectOne('/api/v1/events');
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush([]);
  });

  it('does not add Authorization header when no token', () => {
    http.get('/api/v1/admin/submissions').subscribe();
    const req = controller.expectOne('/api/v1/admin/submissions');
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush([]);
  });
});
