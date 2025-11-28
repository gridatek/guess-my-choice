import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <h1 class="text-xl font-bold text-gray-900" data-testid="dashboard-title">
                Dashboard
              </h1>
            </div>
            <div class="flex items-center space-x-4">
              <a
                routerLink="/posts"
                class="text-gray-600 hover:text-gray-900"
                data-testid="posts-link"
              >
                Posts
              </a>
              <a
                routerLink="/categories"
                class="text-gray-600 hover:text-gray-900"
                data-testid="categories-link"
              >
                Categories
              </a>
              <a
                routerLink="/profile"
                class="text-gray-600 hover:text-gray-900"
                data-testid="profile-link"
              >
                Edit Profile
              </a>
              <a
                routerLink="/admin/users"
                class="text-gray-600 hover:text-gray-900"
                data-testid="admin-link"
              >
                Admin Panel
              </a>
              <button
                (click)="onSignOut()"
                class="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                data-testid="signout-button"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="bg-white shadow overflow-hidden sm:rounded-lg">
            <div class="px-4 py-5 sm:px-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900">User Information</h3>
              <p class="mt-1 max-w-2xl text-sm text-gray-500">
                Your account details and information.
              </p>
            </div>
            <div class="border-t border-gray-200">
              <dl>
                <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-sm font-medium text-gray-500">Email address</dt>
                  <dd
                    class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2"
                    data-testid="user-email"
                  >
                    {{ userEmail() }}
                  </dd>
                </div>
                <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-sm font-medium text-gray-500">User ID</dt>
                  <dd
                    class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2"
                    data-testid="user-id"
                  >
                    {{ userId() }}
                  </dd>
                </div>
                <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-sm font-medium text-gray-500">Account created</dt>
                  <dd
                    class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2"
                    data-testid="user-created"
                  >
                    {{ userCreatedAt() }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div class="mt-6 bg-white shadow sm:rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900">Welcome!</h3>
              <div class="mt-2 max-w-xl text-sm text-gray-500">
                <p>
                  You are successfully authenticated. This is a protected route that requires
                  authentication to access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: ``,
})
export class Dashboard {
  userEmail = computed(() => this.authService.authState().user?.email || 'N/A');
  userId = computed(() => this.authService.authState().user?.id || 'N/A');
  userCreatedAt = computed(() => {
    const createdAt = this.authService.authState().user?.created_at;
    return createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A';
  });

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSignOut() {
    try {
      await this.authService.signOut();
    } catch (error: any) {
      console.error('Sign out error:', error);
    }
  }
}
