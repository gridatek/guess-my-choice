import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then((m) => m.Login),
  },
  {
    path: 'signup',
    loadComponent: () => import('./auth/signup/signup').then((m) => m.Signup),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./auth/forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile').then((m) => m.Profile),
    canActivate: [authGuard],
  },
  {
    path: 'game',
    loadComponent: () => import('./game/game-home/game-home').then((m) => m.GameHome),
    canActivate: [authGuard],
  },
  {
    path: 'game/lobby/:id',
    loadComponent: () => import('./game/session-lobby/session-lobby').then((m) => m.SessionLobby),
    canActivate: [authGuard],
  },
  {
    path: 'game/play/:id',
    loadComponent: () => import('./game/game-play/game-play').then((m) => m.GamePlay),
    canActivate: [authGuard],
  },
  {
    path: 'game/results/:id',
    loadComponent: () => import('./game/game-results/game-results').then((m) => m.GameResults),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];
