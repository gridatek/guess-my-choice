import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProfileService, UserProfile } from '../services/profile.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full mx-auto space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Edit Your Profile</h2>
        </div>

        @if (loading()) {
          <div class="text-center py-12" data-testid="loading">
            <p class="text-gray-500">Loading profile...</p>
          </div>
        } @else {
          <form class="mt-8 space-y-6" (ngSubmit)="onSubmit()" #profileForm="ngForm">
            @if (errorMessage()) {
              <div
                class="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded"
                data-testid="error-message"
              >
                {{ errorMessage() }}
              </div>
            }

            @if (successMessage()) {
              <div
                class="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded"
                data-testid="success-message"
              >
                {{ successMessage() }}
              </div>
            }

            <div class="space-y-4">
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700"
                  >Email (read-only)</label
                >
                <input
                  id="email"
                  type="email"
                  disabled
                  [value]="userEmail()"
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 bg-gray-100 text-gray-500 rounded-md sm:text-sm"
                  data-testid="email-input"
                />
              </div>

              <div>
                <label for="username" class="block text-sm font-medium text-gray-700"
                  >Username</label
                >
                <input
                  id="username"
                  name="username"
                  type="text"
                  [(ngModel)]="username"
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Your username"
                  data-testid="username-input"
                />
              </div>

              <div>
                <label for="full_name" class="block text-sm font-medium text-gray-700"
                  >Full Name</label
                >
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  [(ngModel)]="fullName"
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Your full name"
                  data-testid="fullname-input"
                />
              </div>

              <div class="pt-4 border-t border-gray-200">
                <h3 class="text-sm font-medium text-gray-700 mb-2">Change Password</h3>
                <p class="text-xs text-gray-500 mb-3">Leave blank to keep your current password</p>

                <div>
                  <label for="password" class="block text-sm font-medium text-gray-700"
                    >New Password</label
                  >
                  <input
                    id="password"
                    name="password"
                    type="password"
                    minlength="6"
                    [(ngModel)]="password"
                    class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter new password"
                    data-testid="password-input"
                  />
                </div>

                <div class="mt-3">
                  <label for="confirm_password" class="block text-sm font-medium text-gray-700"
                    >Confirm Password</label
                  >
                  <input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    [(ngModel)]="confirmPassword"
                    class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Confirm new password"
                    data-testid="confirm-password-input"
                  />
                </div>

                @if (password && confirmPassword && password !== confirmPassword) {
                  <p class="mt-2 text-red-600 text-sm" data-testid="password-mismatch">
                    Passwords do not match
                  </p>
                }
              </div>
            </div>

            <div class="flex space-x-4">
              <button
                type="submit"
                [disabled]="saving() || (password && password !== confirmPassword)"
                class="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                data-testid="submit-button"
              >
                {{ saving() ? 'Saving...' : 'Save Changes' }}
              </button>
              <a
                routerLink="/dashboard"
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
export class Profile implements OnInit {
  username = '';
  fullName = '';
  password = '';
  confirmPassword = '';

  loading = signal(true);
  saving = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  userEmail = signal('');

  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadProfile();
  }

  async loadProfile() {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const user = this.authService.getCurrentUser();
      if (user) {
        this.userEmail.set(user.email || '');
      }

      const profile = await this.profileService.getProfile();
      if (profile) {
        this.username = profile.username || '';
        this.fullName = profile.full_name || '';
      }
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to load profile');
    } finally {
      this.loading.set(false);
    }
  }

  async onSubmit() {
    this.saving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      // Update profile
      await this.profileService.updateProfile({
        username: this.username || undefined,
        full_name: this.fullName || undefined,
      });

      // Update password if provided
      if (this.password) {
        if (this.password !== this.confirmPassword) {
          this.errorMessage.set('Passwords do not match');
          this.saving.set(false);
          return;
        }

        await this.profileService.updatePassword(this.password);
        this.password = '';
        this.confirmPassword = '';
      }

      this.successMessage.set('Profile updated successfully!');

      // Redirect after a short delay
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 1500);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to update profile');
      this.saving.set(false);
    }
  }
}
