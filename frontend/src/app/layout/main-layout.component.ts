import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">band-info</div>
        <nav>
          <a routerLink="/rehearsals" routerLinkActive="active">Репетиции</a>
          <a routerLink="/songs" routerLinkActive="active">Песни</a>
          <a routerLink="/setlists" routerLinkActive="active">Сет-листы</a>
          <a routerLink="/ideas" routerLinkActive="active">Идеи</a>
          <a *ngIf="auth.isAdmin()" routerLink="/admin/users" routerLinkActive="active">Админ</a>
        </nav>
        <div class="user">
          <div class="username">{{ auth.user()?.username }}</div>
          <button class="secondary" (click)="auth.logout()">Выйти</button>
        </div>
      </aside>
      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .layout { display: flex; height: 100vh; width: 100vw; }
    .sidebar {
      width: 200px;
      background: var(--panel);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      padding: 16px 0;
    }
    .brand {
      font-weight: 600;
      padding: 0 16px 16px;
      border-bottom: 1px solid var(--border);
      color: var(--accent);
    }
    nav { display: flex; flex-direction: column; flex: 1; padding: 8px 0; }
    nav a {
      padding: 10px 16px;
      color: var(--text);
      border-left: 3px solid transparent;
    }
    nav a:hover { background: var(--panel-alt); }
    nav a.active { background: var(--panel-alt); border-left-color: var(--accent); color: var(--accent); }
    .user { padding: 12px 16px; border-top: 1px solid var(--border); }
    .username { font-size: 12px; color: var(--muted); margin-bottom: 8px; }
    .content { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
  `]
})
export class MainLayoutComponent {
  constructor(public auth: AuthService) {}
}
