import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PostService, Category } from '../services/post.service';

@Component({
  selector: 'app-categories',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto">
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-3xl font-extrabold text-gray-900">Categories</h2>
          <a
            routerLink="/dashboard"
            class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            data-testid="back-button"
          >
            Back to Dashboard
          </a>
        </div>

        <!-- Create Category Form -->
        <div class="bg-white shadow sm:rounded-lg p-6 mb-8">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Create New Category</h3>

          @if (errorMessage()) {
            <div
              class="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded"
              data-testid="error-message"
            >
              {{ errorMessage() }}
            </div>
          }

          @if (successMessage()) {
            <div
              class="mb-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded"
              data-testid="success-message"
            >
              {{ successMessage() }}
            </div>
          }

          <form class="space-y-4" (ngSubmit)="createCategory()">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700">
                  Name <span class="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  [(ngModel)]="newCategoryName"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Category name"
                  data-testid="name-input"
                />
              </div>

              <div>
                <label for="slug" class="block text-sm font-medium text-gray-700">
                  Slug <span class="text-red-500">*</span>
                </label>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  [(ngModel)]="newCategorySlug"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="category-slug"
                  data-testid="slug-input"
                />
              </div>
            </div>

            <div>
              <label for="description" class="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows="3"
                [(ngModel)]="newCategoryDescription"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Optional description"
                data-testid="description-input"
              ></textarea>
            </div>

            <button
              type="submit"
              [disabled]="creating()"
              class="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              data-testid="create-button"
            >
              {{ creating() ? 'Creating...' : 'Create Category' }}
            </button>
          </form>
        </div>

        <!-- Categories List -->
        @if (loading()) {
          <div class="text-center py-12" data-testid="loading">
            <p class="text-gray-500">Loading categories...</p>
          </div>
        } @else if (categories().length === 0) {
          <div class="bg-white shadow sm:rounded-lg p-6 text-center" data-testid="no-categories">
            <p class="text-gray-500">No categories yet. Create your first category above!</p>
          </div>
        } @else {
          <div class="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul class="divide-y divide-gray-200">
              @for (category of categories(); track category.id) {
                <li class="px-6 py-4" data-testid="category-item">
                  <div class="flex items-center justify-between">
                    <div class="flex-1 min-w-0">
                      <h4
                        class="text-lg font-medium text-gray-900"
                        [attr.data-testid]="'category-name-' + category.id"
                      >
                        {{ category.name }}
                      </h4>
                      <p class="text-sm text-gray-500">{{ category.slug }}</p>
                      @if (category.description) {
                        <p class="mt-1 text-sm text-gray-600">{{ category.description }}</p>
                      }
                    </div>
                    <div class="ml-4">
                      <button
                        type="button"
                        (click)="deleteCategory(category)"
                        class="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                        [attr.data-testid]="'delete-category-' + category.id"
                      >
                        Delete
                      </button>
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
  styles: ``,
})
export class Categories implements OnInit {
  categories = signal<Category[]>([]);
  loading = signal(true);
  creating = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  newCategoryName = '';
  newCategorySlug = '';
  newCategoryDescription = '';

  constructor(private postService: PostService) {}

  async ngOnInit() {
    await this.loadCategories();
  }

  async loadCategories() {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const categories = await this.postService.getCategories();
      this.categories.set(categories);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to load categories');
    } finally {
      this.loading.set(false);
    }
  }

  async createCategory() {
    if (!this.newCategoryName.trim() || !this.newCategorySlug.trim()) {
      this.errorMessage.set('Name and slug are required');
      return;
    }

    this.creating.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const newCategory = await this.postService.createCategory(
        this.newCategoryName,
        this.newCategorySlug,
        this.newCategoryDescription || undefined
      );

      this.categories.set([...this.categories(), newCategory]);
      this.successMessage.set('Category created successfully!');

      // Reset form
      this.newCategoryName = '';
      this.newCategorySlug = '';
      this.newCategoryDescription = '';

      // Clear success message after 3 seconds
      setTimeout(() => {
        this.successMessage.set('');
      }, 3000);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to create category');
    } finally {
      this.creating.set(false);
    }
  }

  async deleteCategory(category: Category) {
    if (!confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      return;
    }

    try {
      await this.postService.deleteCategory(category.id);
      this.categories.set(this.categories().filter((c) => c.id !== category.id));
      this.successMessage.set('Category deleted successfully!');

      setTimeout(() => {
        this.successMessage.set('');
      }, 3000);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to delete category');
    }
  }
}
