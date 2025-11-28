import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth state to finish loading
  await authService.waitForAuthReady();

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect to login page with return URL
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
