import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-user-create',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full mx-auto space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Create New User</h2>
        </div>

        <form class="mt-8 space-y-6" (ngSubmit)="onSubmit()" #createForm="ngForm">
          @if (errorMessage()) {
            <div
              class="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded"
              data-testid="error-message"
            >
              {{ errorMessage() }}
            </div>
          }

          <div class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                [(ngModel)]="email"
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                data-testid="email-input"
              />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minlength="6"
                [(ngModel)]="password"
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                data-testid="password-input"
              />
            </div>

            <div>
              <label for="username" class="block text-sm font-medium text-gray-700"
                >Username (optional)</label
              >
              <input
                id="username"
                name="username"
                type="text"
                [(ngModel)]="username"
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                data-testid="username-input"
              />
            </div>

            <div class="flex items-center">
              <input
                id="is_admin"
                name="is_admin"
                type="checkbox"
                [(ngModel)]="isAdmin"
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                data-testid="admin-checkbox"
              />
              <label for="is_admin" class="ml-2 block text-sm text-gray-900"> Admin User </label>
            </div>
          </div>

          <div class="flex space-x-4">
            <button
              type="submit"
              [disabled]="loading() || !createForm.valid"
              class="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              data-testid="submit-button"
            >
              {{ loading() ? 'Creating...' : 'Create User' }}
            </button>
            <a
              routerLink="/admin/users"
              class="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 text-center"
              data-testid="cancel-button"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: ``,
})
export class UserCreate {
  email = '';
  password = '';
  username = '';
  isAdmin = false;
  loading = signal(false);
  errorMessage = signal('');

  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  async onSubmit() {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      await this.adminService.createUser({
        email: this.email,
        password: this.password,
        username: this.username || undefined,
        is_admin: this.isAdmin,
      });
      this.router.navigate(['/admin/users']);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to create user');
      this.loading.set(false);
    }
  }
}
