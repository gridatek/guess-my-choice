import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AdminService, AdminUser } from '../../services/admin.service';

@Component({
  selector: 'app-users',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <h1 class="text-xl font-bold text-gray-900" data-testid="admin-title">
                User Management
              </h1>
            </div>
            <div class="flex items-center space-x-4">
              <a
                routerLink="/dashboard"
                class="text-gray-600 hover:text-gray-900"
                data-testid="dashboard-link"
              >
                Dashboard
              </a>
              <button
                (click)="onCreateUser()"
                class="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                data-testid="create-user-button"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          @if (errorMessage()) {
            <div
              class="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded"
              role="alert"
              data-testid="error-message"
            >
              {{ errorMessage() }}
            </div>
          }

          @if (successMessage()) {
            <div
              class="mb-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded"
              role="alert"
              data-testid="success-message"
            >
              {{ successMessage() }}
            </div>
          }

          @if (loading()) {
            <div class="text-center py-12" data-testid="loading">
              <p class="text-gray-500">Loading users...</p>
            </div>
          } @else {
            <div class="bg-white shadow overflow-hidden sm:rounded-lg">
              <div class="px-4 py-5 sm:px-6">
                <h3 class="text-lg leading-6 font-medium text-gray-900">All Users</h3>
                <p class="mt-1 max-w-2xl text-sm text-gray-500">Manage all users in the system</p>
              </div>
              <div class="border-t border-gray-200">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Created At
                      </th>
                      <th
                        scope="col"
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Last Sign In
                      </th>
                      <th
                        scope="col"
                        class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    @for (user of users(); track user.id) {
                      <tr data-testid="user-row">
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="text-sm font-medium text-gray-900" data-testid="user-email">
                            {{ user.email }}
                          </div>
                          <div class="text-sm text-gray-500" data-testid="user-id">
                            {{ user.id }}
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="text-sm text-gray-900">
                            {{ formatDate(user.created_at) }}
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="text-sm text-gray-900">
                            {{ user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Never' }}
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            (click)="onEditUser(user.id)"
                            class="text-indigo-600 hover:text-indigo-900 mr-4"
                            data-testid="edit-user-button"
                          >
                            Edit
                          </button>
                          <button
                            (click)="onDeleteUser(user)"
                            class="text-red-600 hover:text-red-900"
                            data-testid="delete-user-button"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">
                          No users found
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>
      </main>
    </div>
  `,
  styles: ``,
})
export class Users implements OnInit {
  users = signal<AdminUser[]>([]);
  loading = signal(true);
  errorMessage = signal('');
  successMessage = signal('');

  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const users = await this.adminService.listUsers();
      this.users.set(users);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to load users');
    } finally {
      this.loading.set(false);
    }
  }

  onCreateUser() {
    this.router.navigate(['/admin/users/create']);
  }

  onEditUser(userId: string) {
    this.router.navigate(['/admin/users/edit', userId]);
  }

  async onDeleteUser(user: AdminUser) {
    if (!confirm(`Are you sure you want to delete user ${user.email}?`)) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      await this.adminService.deleteUser(user.id);
      this.successMessage.set('User deleted successfully');
      await this.loadUsers();
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to delete user');
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}
