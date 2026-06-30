import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/auth`;
  private readonly TOKEN_KEY = 'atlas_admin_token';

  login(username: string, password: string): Observable<void> {
    return this.http.post<{ token: string }>(`${this.base}/login`, { username, password }).pipe(
      tap(res => sessionStorage.setItem(this.TOKEN_KEY, res.token)),
      map(() => void 0)
    );
  }

  logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
