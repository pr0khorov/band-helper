import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="layout">
      <header class="mobile-bar">
        <button
          type="button"
          class="menu-btn"
          (click)="toggleMenu()"
          [attr.aria-expanded]="menuOpen()"
          aria-label="Меню">
          <span class="menu-icon" [class.open]="menuOpen()"></span>
        </button>
        <div class="brand">band-info</div>
      </header>

      <div class="menu-backdrop" *ngIf="menuOpen()" (click)="closeMenu()"></div>
      <nav class="mobile-drawer" [class.open]="menuOpen()">
        <a routerLink="/rehearsals" routerLinkActive="active" (click)="closeMenu()">Репетиции</a>
        <a routerLink="/songs" routerLinkActive="active" (click)="closeMenu()">Песни</a>
        <a routerLink="/setlists" routerLinkActive="active" (click)="closeMenu()">Сет-листы</a>
        <a routerLink="/ideas" routerLinkActive="active" (click)="closeMenu()">Идеи</a>
        <a *ngIf="auth.isAdmin()" routerLink="/admin/users" routerLinkActive="active" (click)="closeMenu()">Админ</a>
        <div class="drawer-footer">
          <span class="username">{{ auth.user()?.username }}</span>
          <button type="button" class="secondary" (click)="logout()">Выйти</button>
        </div>
      </nav>

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
    .layout {
      display: flex;
      height: 100vh;
      height: 100dvh;
      width: 100%;
      max-width: 100vw;
      overflow: hidden;
    }
    .sidebar {
      width: 200px;
      flex-shrink: 0;
      background: var(--panel);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      padding: 16px 0;
    }
    .brand {
      font-weight: 600;
      color: var(--accent);
    }
    .sidebar .brand {
      padding: 0 16px 16px;
      border-bottom: 1px solid var(--border);
    }
    .sidebar nav { display: flex; flex-direction: column; flex: 1; padding: 8px 0; }
    .sidebar nav a {
      padding: 10px 16px;
      color: var(--text);
      border-left: 3px solid transparent;
    }
    .sidebar nav a:hover { background: var(--panel-alt); }
    .sidebar nav a.active {
      background: var(--panel-alt);
      border-left-color: var(--accent);
      color: var(--accent);
    }
    .user { padding: 12px 16px; border-top: 1px solid var(--border); }
    .username { font-size: 12px; color: var(--muted); }
    .content {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .mobile-bar,
    .menu-backdrop,
    .mobile-drawer { display: none; }

    @media (max-width: 768px) {
      .layout { flex-direction: column; }
      .sidebar { display: none; }

      .mobile-bar {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
        position: sticky;
        top: 0;
        z-index: 202;
        height: 40px;
        padding: 0 10px;
        padding-top: env(safe-area-inset-top);
        box-sizing: content-box;
        background: var(--panel);
        border-bottom: 1px solid var(--border);
      }
      .mobile-bar .brand {
        font-size: 14px;
        line-height: 1;
      }
      .menu-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 32px;
        min-height: 0;
        padding: 0;
        background: transparent;
        border: 1px solid var(--border);
        border-radius: 4px;
        flex-shrink: 0;
      }
      .menu-btn:hover { background: var(--panel-alt); }
      .menu-icon,
      .menu-icon::before,
      .menu-icon::after {
        display: block;
        width: 16px;
        height: 2px;
        background: var(--text);
        border-radius: 1px;
        transition: transform 0.2s, opacity 0.2s;
      }
      .menu-icon { position: relative; }
      .menu-icon::before,
      .menu-icon::after {
        content: '';
        position: absolute;
        left: 0;
      }
      .menu-icon::before { top: -5px; }
      .menu-icon::after { top: 5px; }
      .menu-icon.open { background: transparent; }
      .menu-icon.open::before { top: 0; transform: rotate(45deg); }
      .menu-icon.open::after { top: 0; transform: rotate(-45deg); }

      .menu-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        z-index: 200;
        background: rgba(0, 0, 0, 0.45);
      }
      .mobile-drawer {
        display: flex;
        flex-direction: column;
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        z-index: 201;
        width: min(260px, 82vw);
        background: var(--panel);
        border-right: 1px solid var(--border);
        padding-top: calc(40px + env(safe-area-inset-top));
        transform: translateX(-100%);
        transition: transform 0.2s ease;
      }
      .mobile-drawer.open { transform: translateX(0); }
      .mobile-drawer a {
        padding: 12px 16px;
        color: var(--text);
        border-left: 3px solid transparent;
        font-size: 15px;
      }
      .mobile-drawer a.active {
        background: var(--panel-alt);
        border-left-color: var(--accent);
        color: var(--accent);
      }
      .drawer-footer {
        margin-top: auto;
        padding: 12px 16px;
        padding-bottom: max(12px, env(safe-area-inset-bottom));
        border-top: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .drawer-footer .username { margin-bottom: 0; }
      .drawer-footer button { width: 100%; min-height: 36px; }

      .content { flex: 1; min-height: 0; }
    }
  `]
})
export class MainLayoutComponent {
  menuOpen = signal(false);

  constructor(public auth: AuthService) {}

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }

  logout() {
    this.closeMenu();
    this.auth.logout();
  }
}
