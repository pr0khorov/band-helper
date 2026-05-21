import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { adminGuard } from './core/admin.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'rehearsals' },
      { path: 'rehearsals', loadComponent: () => import('./pages/rehearsals/rehearsals.component').then(m => m.RehearsalsComponent) },
      { path: 'songs', loadComponent: () => import('./pages/songs/songs.component').then(m => m.SongsComponent) },
      { path: 'setlists', loadComponent: () => import('./pages/setlists/setlists.component').then(m => m.SetlistsComponent) },
      { path: 'ideas', loadComponent: () => import('./pages/ideas/ideas.component').then(m => m.IdeasComponent) },
      { path: 'admin/users', canActivate: [adminGuard], loadComponent: () => import('./pages/admin-users/admin-users.component').then(m => m.AdminUsersComponent) }
    ]
  },
  { path: '**', redirectTo: '' }
];
