import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrap">
      <form class="login-card" (ngSubmit)="submit()">
        <h1>band-info</h1>
        <label>Логин
          <input type="text" name="username" [(ngModel)]="username" autocomplete="username" autofocus>
        </label>
        <label>Пароль
          <input type="password" name="password" [(ngModel)]="password" autocomplete="current-password">
        </label>
        <div class="error" *ngIf="error()">{{ error() }}</div>
        <button type="submit" [disabled]="loading()">{{ loading() ? 'Вход...' : 'Войти' }}</button>
      </form>
    </div>
  `,
  styles: [`
    .login-wrap {
      display: flex; align-items: center; justify-content: center;
      width: 100vw; height: 100vh; background: var(--bg);
    }
    .login-card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 24px;
      width: 320px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    h1 { margin: 0 0 8px; color: var(--accent); font-size: 20px; }
    label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--muted); }
    .error { color: var(--danger); font-size: 12px; }
    button { padding: 10px; font-size: 14px; }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private auth: AuthService, private router: Router) {
    // If already logged in, skip login
    if (this.auth.token) {
      this.auth.restoreSession().then(ok => { if (ok) this.router.navigate(['/']); });
    }
  }

  submit() {
    if (!this.username || !this.password) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.username, this.password).subscribe({
      next: () => { this.loading.set(false); this.router.navigate(['/']); },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.error || 'Ошибка авторизации');
      }
    });
  }
}
