import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <button
                (click)="goBack()"
                class="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="bg-white shadow overflow-hidden sm:rounded-lg">
            <div class="px-4 py-5 sm:px-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900">Edit Your Profile</h3>
              <p class="mt-1 max-w-2xl text-sm text-gray-500">
                Update your account information and preferences.
              </p>
            </div>

            @if (isLoading()) {
              <div class="px-4 py-5 text-center" data-testid="loading">
                <div
                  class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"
                ></div>
              </div>
            } @else {
              <div class="border-t border-gray-200 px-4 py-5 sm:p-6">
                <form class="space-y-6">
                  <div>
                    <label for="email" class="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <input
                      type="email"
                      id="email"
                      [value]="userEmail()"
                      disabled
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed sm:text-sm"
                      data-testid="email-input"
                    />
                    <p class="mt-2 text-sm text-gray-500">Email cannot be changed</p>
                  </div>

                  <div>
                    <label for="username" class="block text-sm font-medium text-gray-700">
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      [(ngModel)]="username"
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      data-testid="username-input"
                    />
                  </div>

                  <div>
                    <label for="fullname" class="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullname"
                      [(ngModel)]="fullName"
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      data-testid="fullname-input"
                    />
                  </div>

                  <div class="border-t border-gray-200 pt-6">
                    <h4 class="text-md font-medium text-gray-900 mb-4">Change Password</h4>

                    <div class="space-y-4">
                      <div>
                        <label for="new-password" class="block text-sm font-medium text-gray-700">
                          New Password
                        </label>
                        <input
                          type="password"
                          id="new-password"
                          name="newPassword"
                          [(ngModel)]="newPassword"
                          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          data-testid="password-input"
                        />
                      </div>

                      <div>
                        <label
                          for="confirm-password"
                          class="block text-sm font-medium text-gray-700"
                        >
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          id="confirm-password"
                          name="confirmPassword"
                          [(ngModel)]="confirmPassword"
                          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          data-testid="confirm-password-input"
                        />
                      </div>

                      @if (passwordMismatch()) {
                        <p class="text-sm text-red-600" data-testid="password-mismatch">
                          Passwords do not match
                        </p>
                      }

                      @if (passwordError()) {
                        <p class="text-sm text-red-600" data-testid="password-error">
                          {{ passwordError() }}
                        </p>
                      }
                    </div>
                  </div>

                  @if (errorMessage()) {
                    <div class="rounded-md bg-red-50 p-4" role="alert" data-testid="error-message">
                      <p class="text-sm text-red-800">{{ errorMessage() }}</p>
                    </div>
                  }

                  @if (successMessage()) {
                    <div
                      class="rounded-md bg-green-50 p-4"
                      role="alert"
                      data-testid="success-message"
                    >
                      <p class="text-sm text-green-800">{{ successMessage() }}</p>
                    </div>
                  }

                  <div class="flex gap-4">
                    <button
                      type="submit"
                      (click)="onSubmit($event)"
                      [disabled]="isSaving() || passwordMismatch()"
                      class="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      data-testid="submit-button"
                    >
                      {{ isSaving() ? 'Saving...' : 'Save Changes' }}
                    </button>
                    <button
                      type="button"
                      (click)="goBack()"
                      class="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            }
          </div>
        </div>
      </main>
    </div>
  `,
  styles: ``,
})
export class Profile {
  isLoading = signal(false);
  isSaving = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  passwordError = signal('');

  userEmail = signal('');
  username = '';
  fullName = '';
  newPassword = '';
  confirmPassword = '';

  // Method to check password mismatch (called from template)
  passwordMismatch(): boolean {
    return (
      this.newPassword.length > 0 &&
      this.confirmPassword.length > 0 &&
      this.newPassword !== this.confirmPassword
    );
  }

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.loadUserData();
  }

  loadUserData() {
    const user = this.authService.getCurrentUser();
    if (user?.email) {
      this.userEmail.set(user.email);
    }
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage.set('');
    this.successMessage.set('');
    this.passwordError.set('');

    const pwd = this.newPassword;
    const confirmPwd = this.confirmPassword;

    // Validate passwords if attempting to change password
    if (pwd || confirmPwd) {
      if (pwd !== confirmPwd) {
        this.passwordError.set('Passwords do not match');
        return;
      }
      if (pwd.length < 6) {
        this.passwordError.set('Password must be at least 6 characters');
        return;
      }
    }

    this.isSaving.set(true);

    try {
      // Update password if provided
      if (pwd) {
        const supabase = this.authService.getSupabaseClient();
        const { data, error } = await supabase.auth.updateUser({
          password: pwd,
        });

        if (error) {
          console.error('Password update error:', error);
          this.errorMessage.set(error.message);
          this.isSaving.set(false);
          return;
        }

        console.log('Password updated successfully:', data);
      }

      // TODO: Update username and full name in profiles table

      this.isSaving.set(false);
      this.successMessage.set('Profile updated successfully');

      const passwordChanged = !!pwd;
      this.newPassword = '';
      this.confirmPassword = '';

      // Redirect to dashboard after success
      // Wait a bit longer if password was changed to ensure it's persisted
      const redirectDelay = passwordChanged ? 2000 : 1000;
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, redirectDelay);
    } catch (error: any) {
      console.error('Profile update error:', error);
      this.errorMessage.set(error.message || 'Failed to update profile');
      this.isSaving.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
