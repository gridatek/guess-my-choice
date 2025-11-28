import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth state to finish loading
  await authService.waitForAuthReady();

  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  const user = authService.getCurrentUser();
  if (!user) {
    return router.createUrlTree(['/login']);
  }

  // Check if user is admin by querying profiles table using authenticated client
  const supabase = authService.getSupabaseClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (error || !profile?.is_admin) {
    // Redirect to dashboard if not admin
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
