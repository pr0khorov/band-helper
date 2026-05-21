import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.user()) return true;
  const ok = await auth.restoreSession();
  if (ok) return true;
  router.navigate(['/login']);
  return false;
};
