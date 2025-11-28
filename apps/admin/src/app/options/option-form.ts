import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import {
  OptionService,
  Option,
  OptionCategory,
  OptionStatus,
  SessionType,
} from '../services/option.service';

@Component({
  selector: 'app-option-form',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto">
        <div class="mb-8">
          <h2 class="text-3xl font-extrabold text-gray-900">
            {{ isEditMode() ? 'Edit Option' : 'Create Option' }}
          </h2>
        </div>

        @if (loading()) {
          <div class="text-center py-12" data-testid="loading">
            <p class="text-gray-500">Loading...</p>
          </div>
        } @else {
          <form class="space-y-6 bg-white shadow sm:rounded-lg p-6" (ngSubmit)="onSubmit()">
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

            <div>
              <label for="option_text" class="block text-sm font-medium text-gray-700">
                Option Text <span class="text-red-500">*</span>
              </label>
              <input
                id="option_text"
                name="option_text"
                type="text"
                required
                [(ngModel)]="optionText"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter option text"
                data-testid="option-text-input"
              />
            </div>

            <div>
              <label for="description" class="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows="4"
                [(ngModel)]="description"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Optional description for this option..."
                data-testid="description-input"
              ></textarea>
            </div>

            <div>
              <label for="session_type" class="block text-sm font-medium text-gray-700">
                Session Type <span class="text-red-500">*</span>
              </label>
              <select
                id="session_type"
                name="session_type"
                required
                [(ngModel)]="sessionType"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                data-testid="session-type-select"
              >
                <option value="friends">Friends</option>
                <option value="couple">Couple</option>
                <option value="adult">Adult</option>
              </select>
              <p class="mt-1 text-xs text-gray-500">
                Choose the type of session this option is for
              </p>
            </div>

            <div>
              <label for="difficulty_level" class="block text-sm font-medium text-gray-700">
                Difficulty Level: {{ difficultyLevel }}
              </label>
              <input
                id="difficulty_level"
                name="difficulty_level"
                type="range"
                min="1"
                max="5"
                [(ngModel)]="difficultyLevel"
                class="mt-1 block w-full"
                data-testid="difficulty-level-input"
              />
              <div class="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 (Easy)</span>
                <span>5 (Challenging)</span>
              </div>
            </div>

            <div>
              <label for="status" class="block text-sm font-medium text-gray-700">Status</label>
              <select
                id="status"
                name="status"
                [(ngModel)]="status"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                data-testid="status-select"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label for="tags" class="block text-sm font-medium text-gray-700">Tags</label>
              <input
                id="tags"
                name="tags"
                type="text"
                [(ngModel)]="tagsInput"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="tag1, tag2, tag3"
                data-testid="tags-input"
              />
              <p class="mt-1 text-xs text-gray-500">Comma-separated tags</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Categories</label>
              @if (availableCategories().length === 0) {
                <p class="text-sm text-gray-500">
                  No categories available.
                  <a routerLink="/categories" class="text-indigo-600 hover:text-indigo-500">
                    Create one first
                  </a>
                </p>
              } @else {
                <div class="space-y-2">
                  @for (category of availableCategories(); track category.id) {
                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        [checked]="selectedCategoryIds().includes(category.id)"
                        (change)="toggleCategory(category.id)"
                        class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        [attr.data-testid]="'category-' + category.id"
                      />
                      <span class="ml-2 text-sm text-gray-700">{{ category.name }}</span>
                    </label>
                  }
                </div>
              }
            </div>

            <div class="flex space-x-4">
              <button
                type="submit"
                [disabled]="saving()"
                class="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                data-testid="submit-button"
              >
                {{ saving() ? 'Saving...' : isEditMode() ? 'Update Option' : 'Create Option' }}
              </button>
              <a
                routerLink="/options"
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
export class OptionForm implements OnInit {
  optionText = '';
  description = '';
  sessionType: SessionType = 'friends';
  difficultyLevel = 1;
  status: OptionStatus = 'draft';
  tagsInput = '';
  selectedCategoryIds = signal<string[]>([]);
  availableCategories = signal<OptionCategory[]>([]);

  loading = signal(true);
  saving = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  isEditMode = signal(false);
  optionId: string | null = null;

  constructor(
    private optionService: OptionService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    this.optionId = this.route.snapshot.paramMap.get('id');
    this.isEditMode.set(!!this.optionId);

    await this.loadCategories();

    if (this.isEditMode()) {
      await this.loadOption();
    }

    this.loading.set(false);
  }

  async loadCategories() {
    try {
      const categories = await this.optionService.getCategories();
      this.availableCategories.set(categories);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to load categories');
    }
  }

  async loadOption() {
    if (!this.optionId) return;

    try {
      const option = await this.optionService.getOption(this.optionId);
      if (option) {
        this.optionText = option.option_text;
        this.description = option.description || '';
        this.sessionType = option.session_type;
        this.difficultyLevel = option.difficulty_level;
        this.status = option.status;
        this.tagsInput = option.tags?.join(', ') || '';

        // Load option categories
        const categories = await this.optionService.getOptionCategories(this.optionId);
        this.selectedCategoryIds.set(categories.map((c) => c.id));
      }
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to load option');
    }
  }

  toggleCategory(categoryId: string) {
    const current = this.selectedCategoryIds();
    if (current.includes(categoryId)) {
      this.selectedCategoryIds.set(current.filter((id) => id !== categoryId));
    } else {
      this.selectedCategoryIds.set([...current, categoryId]);
    }
  }

  async onSubmit() {
    if (!this.optionText.trim()) {
      this.errorMessage.set('Option text is required');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const tags = this.tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      if (this.isEditMode() && this.optionId) {
        await this.optionService.updateOption(this.optionId, {
          option_text: this.optionText,
          description: this.description || undefined,
          session_type: this.sessionType,
          difficulty_level: this.difficultyLevel,
          status: this.status,
          tags: tags.length > 0 ? tags : undefined,
          category_ids: this.selectedCategoryIds(),
        });
        this.successMessage.set('Option updated successfully!');
      } else {
        await this.optionService.createOption({
          option_text: this.optionText,
          description: this.description || undefined,
          session_type: this.sessionType,
          difficulty_level: this.difficultyLevel,
          status: this.status,
          tags: tags.length > 0 ? tags : undefined,
          category_ids: this.selectedCategoryIds(),
        });
        this.successMessage.set('Option created successfully!');
      }

      // Redirect after a short delay
      setTimeout(() => {
        this.router.navigate(['/options']);
      }, 1500);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to save option');
      this.saving.set(false);
    }
  }
}
