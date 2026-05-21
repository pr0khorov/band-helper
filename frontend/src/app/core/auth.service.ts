import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom, Observable, tap } from 'rxjs';

export interface CurrentUser {
  id: number;
  username: string;
  role: 'USER' | 'ADMIN';
}

const TOKEN_KEY = 'band-info.token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<CurrentUser | null>(null);
  user = this._user.asReadonly();
  isAdmin = computed(() => this._user()?.role === 'ADMIN');

  constructor(private http: HttpClient, private router: Router) {}

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  login(username: string, password: string): Observable<{ token: string; username: string; role: string }> {
    return this.http.post<{ token: string; username: string; role: string }>('/api/auth/login', { username, password })
      .pipe(tap(res => {
        this.setToken(res.token);
        this._user.set({ id: 0, username: res.username, role: res.role as 'USER' | 'ADMIN' });
      }));
  }

  async restoreSession(): Promise<boolean> {
    if (!this.token) return false;
    try {
      const me = await firstValueFrom(this.http.get<CurrentUser>('/api/auth/me'));
      this._user.set(me);
      return true;
    } catch {
      this.clearToken();
      this._user.set(null);
      return false;
    }
  }

  logout() {
    this.clearToken();
    this._user.set(null);
    this.router.navigate(['/login']);
  }
}
