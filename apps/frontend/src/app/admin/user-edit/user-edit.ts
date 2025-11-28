import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-user-edit',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full mx-auto space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Edit User</h2>
        </div>

        @if (loading()) {
          <div class="text-center py-12" data-testid="loading">
            <p class="text-gray-500">Loading user...</p>
          </div>
        } @else {
          <form class="mt-8 space-y-6" (ngSubmit)="onSubmit()" #editForm="ngForm">
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
                <label for="password" class="block text-sm font-medium text-gray-700"
                  >Password (leave blank to keep current)</label
                >
                <input
                  id="password"
                  name="password"
                  type="password"
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
                [disabled]="saving() || !editForm.valid"
                class="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                data-testid="submit-button"
              >
                {{ saving() ? 'Saving...' : 'Update User' }}
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
        }
      </div>
    </div>
  `,
  styles: ``,
})
export class UserEdit implements OnInit {
  userId = '';
  email = '';
  password = '';
  username = '';
  isAdmin = false;
  loading = signal(true);
  saving = signal(false);
  errorMessage = signal('');

  constructor(
    private adminService: AdminService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    await this.loadUser();
  }

  async loadUser() {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const users = await this.adminService.listUsers();
      const user = users.find((u) => u.id === this.userId);

      if (!user) {
        this.errorMessage.set('User not found');
        return;
      }

      this.email = user.email;
      // Note: We can't load username/is_admin from listUsers, would need a separate endpoint
      // For now, user can set these values
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to load user');
    } finally {
      this.loading.set(false);
    }
  }

  async onSubmit() {
    this.saving.set(true);
    this.errorMessage.set('');

    try {
      const updateData: any = { email: this.email };

      if (this.password) {
        updateData.password = this.password;
      }

      if (this.username) {
        updateData.username = this.username;
      }

      updateData.is_admin = this.isAdmin;

      await this.adminService.updateUser(this.userId, updateData);
      this.router.navigate(['/admin/users']);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to update user');
      this.saving.set(false);
    }
  }
}
