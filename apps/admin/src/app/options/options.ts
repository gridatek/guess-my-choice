import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OptionService, Option } from '../services/option.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-options',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-3xl font-extrabold text-gray-900">Game Options</h2>
          <div class="space-x-4">
            <a
              routerLink="/options/create"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              data-testid="create-option-button"
            >
              Create Option
            </a>
            <a
              routerLink="/dashboard"
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              data-testid="back-button"
            >
              Back to Dashboard
            </a>
          </div>
        </div>

        @if (loading()) {
          <div class="text-center py-12" data-testid="loading">
            <p class="text-gray-500">Loading options...</p>
          </div>
        } @else if (errorMessage()) {
          <div
            class="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded"
            data-testid="error-message"
          >
            {{ errorMessage() }}
          </div>
        } @else if (options().length === 0) {
          <div class="text-center py-12" data-testid="no-options">
            <p class="text-gray-500">No options found. Create your first option!</p>
          </div>
        } @else {
          <div class="bg-white shadow overflow-hidden sm:rounded-md">
            <ul class="divide-y divide-gray-200">
              @for (option of options(); track option.id) {
                <li data-testid="option-item">
                  <div class="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div class="flex items-center justify-between">
                      <div class="flex-1 min-w-0">
                        <h3 class="text-lg font-medium text-indigo-600 truncate">
                          <a
                            [routerLink]="['/options', option.id]"
                            class="hover:underline"
                            [attr.data-testid]="'option-title-' + option.id"
                          >
                            {{ option.option_text }}
                          </a>
                        </h3>
                        <div class="mt-2 flex items-center text-sm text-gray-500 flex-wrap gap-2">
                          <span
                            [class]="getStatusClass(option.status)"
                            [attr.data-testid]="'option-status-' + option.id"
                          >
                            {{ option.status }}
                          </span>
                          <span>•</span>
                          <span
                            [class]="getSessionTypeClass(option.session_type)"
                            [attr.data-testid]="'option-session-type-' + option.id"
                          >
                            {{ option.session_type }}
                          </span>
                          <span>•</span>
                          <span>Level: {{ option.difficulty_level }}</span>
                          <span>•</span>
                          <span>{{ formatDate(option.created_at) }}</span>
                          @if (option.view_count > 0) {
                            <span>•</span>
                            <span>{{ option.view_count }} views</span>
                          }
                        </div>
                        @if (option.description) {
                          <p class="mt-2 text-sm text-gray-600 line-clamp-2">
                            {{ option.description }}
                          </p>
                        }
                      </div>
                      <div class="ml-4 flex-shrink-0 flex space-x-2">
                        @if (canEdit(option)) {
                          <a
                            [routerLink]="['/options/edit', option.id]"
                            class="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            [attr.data-testid]="'edit-option-' + option.id"
                          >
                            Edit
                          </a>
                          <button
                            type="button"
                            (click)="deleteOption(option)"
                            class="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                            [attr.data-testid]="'delete-option-' + option.id"
                          >
                            Delete
                          </button>
                        }
                      </div>
                    </div>
                  </div>
                </li>
              }
            </ul>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `,
})
export class Options implements OnInit {
  options = signal<Option[]>([]);
  loading = signal(true);
  errorMessage = signal('');

  constructor(
    private optionService: OptionService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    await this.loadOptions();
  }

  async loadOptions() {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const options = await this.optionService.getOptions();
      this.options.set(options);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to load options');
    } finally {
      this.loading.set(false);
    }
  }

  canEdit(option: Option): boolean {
    const user = this.authService.getCurrentUser();
    return user ? option.user_id === user.id : false;
  }

  async deleteOption(option: Option) {
    if (!confirm(`Are you sure you want to delete "${option.option_text}"?`)) {
      return;
    }

    try {
      await this.optionService.deleteOption(option.id);
      this.options.set(this.options().filter((o) => o.id !== option.id));
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to delete option');
    }
  }

  getStatusClass(status: string): string {
    const baseClass =
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (status) {
      case 'published':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'archived':
        return `${baseClass} bg-gray-100 text-gray-800`;
      default: // draft
        return `${baseClass} bg-yellow-100 text-yellow-800`;
    }
  }

  getSessionTypeClass(sessionType: string): string {
    const baseClass =
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (sessionType) {
      case 'friends':
        return `${baseClass} bg-blue-100 text-blue-800`;
      case 'couple':
        return `${baseClass} bg-pink-100 text-pink-800`;
      case 'adult':
        return `${baseClass} bg-purple-100 text-purple-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
