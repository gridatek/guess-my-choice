import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <form class="mt-8 space-y-6" (ngSubmit)="onSubmit()" #loginForm="ngForm">
          @if (errorMessage()) {
            <div
              class="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative"
              role="alert"
              data-testid="error-message"
            >
              <span class="block sm:inline">{{ errorMessage() }}</span>
            </div>
          }

          @if (successMessage()) {
            <div
              class="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded relative"
              role="alert"
              data-testid="success-message"
            >
              <span class="block sm:inline">{{ successMessage() }}</span>
            </div>
          }

          <div class="rounded-md shadow-sm -space-y-px">
            <div>
              <label for="email" class="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                required
                [(ngModel)]="email"
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                data-testid="email-input"
              />
            </div>
            <div>
              <label for="password" class="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autocomplete="current-password"
                required
                [(ngModel)]="password"
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                data-testid="password-input"
              />
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="text-sm">
              <a
                routerLink="/forgot-password"
                class="font-medium text-indigo-600 hover:text-indigo-500"
                data-testid="forgot-password-link"
              >
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              [disabled]="loading() || !loginForm.valid"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="submit-button"
            >
              {{ loading() ? 'Signing in...' : 'Sign in' }}
            </button>
          </div>

          <div class="text-center">
            <p class="text-sm text-gray-600">
              Don't have an account?
              <a
                routerLink="/signup"
                class="font-medium text-indigo-600 hover:text-indigo-500"
                data-testid="signup-link"
              >
                Sign up
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: ``,
})
export class Login {
  email = '';
  password = '';
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit() {
    if (!this.email || !this.password) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      await this.authService.signIn(this.email, this.password);
      this.successMessage.set('Login successful! Redirecting...');
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 1000);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      this.loading.set(false);
    }
  }
}
