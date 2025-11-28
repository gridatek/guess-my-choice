import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>

        <form class="mt-8 space-y-6" (ngSubmit)="onSubmit()" #signupForm="ngForm">
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

          <div class="rounded-md shadow-sm space-y-3">
            <div>
              <label for="email" class="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                required
                [(ngModel)]="email"
                class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
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
                autocomplete="new-password"
                required
                minlength="6"
                [(ngModel)]="password"
                class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password (min 6 characters)"
                data-testid="password-input"
              />
            </div>
            <div>
              <label for="confirmPassword" class="sr-only">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autocomplete="new-password"
                required
                [(ngModel)]="confirmPassword"
                class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm password"
                data-testid="confirm-password-input"
              />
            </div>
          </div>

          @if (password && confirmPassword && password !== confirmPassword) {
            <p class="text-red-600 text-sm" data-testid="password-mismatch">
              Passwords do not match
            </p>
          }

          <div>
            <button
              type="submit"
              [disabled]="loading() || !signupForm.valid || password !== confirmPassword"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="submit-button"
            >
              {{ loading() ? 'Creating account...' : 'Sign up' }}
            </button>
          </div>

          <div class="text-center">
            <p class="text-sm text-gray-600">
              Already have an account?
              <a
                routerLink="/login"
                class="font-medium text-indigo-600 hover:text-indigo-500"
                data-testid="login-link"
              >
                Sign in
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: ``,
})
export class Signup {
  email = '';
  password = '';
  confirmPassword = '';
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit() {
    if (!this.email || !this.password || this.password !== this.confirmPassword) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      await this.authService.signUp(this.email, this.password);
      this.successMessage.set(
        'Account created successfully! You can now sign in with your credentials.'
      );
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to create account. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
