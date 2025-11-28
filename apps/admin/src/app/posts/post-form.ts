import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { PostService, Post, Category, PostStatus } from '../services/post.service';

@Component({
  selector: 'app-post-form',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto">
        <div class="mb-8">
          <h2 class="text-3xl font-extrabold text-gray-900">
            {{ isEditMode() ? 'Edit Post' : 'Create Post' }}
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
              <label for="title" class="block text-sm font-medium text-gray-700">
                Title <span class="text-red-500">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                [(ngModel)]="title"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter post title"
                data-testid="title-input"
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
                [(ngModel)]="slug"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="post-slug"
                data-testid="slug-input"
              />
              <p class="mt-1 text-xs text-gray-500">
                URL-friendly version of the title (e.g., my-first-post)
              </p>
            </div>

            <div>
              <label for="content" class="block text-sm font-medium text-gray-700">Content</label>
              <textarea
                id="content"
                name="content"
                rows="10"
                [(ngModel)]="content"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Write your post content here..."
                data-testid="content-input"
              ></textarea>
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
                {{ saving() ? 'Saving...' : isEditMode() ? 'Update Post' : 'Create Post' }}
              </button>
              <a
                routerLink="/posts"
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
export class PostForm implements OnInit {
  title = '';
  slug = '';
  content = '';
  status: PostStatus = 'draft';
  tagsInput = '';
  selectedCategoryIds = signal<string[]>([]);
  availableCategories = signal<Category[]>([]);

  loading = signal(true);
  saving = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  isEditMode = signal(false);
  postId: string | null = null;

  constructor(
    private postService: PostService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    this.postId = this.route.snapshot.paramMap.get('id');
    this.isEditMode.set(!!this.postId);

    await this.loadCategories();

    if (this.isEditMode()) {
      await this.loadPost();
    }

    this.loading.set(false);
  }

  async loadCategories() {
    try {
      const categories = await this.postService.getCategories();
      this.availableCategories.set(categories);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to load categories');
    }
  }

  async loadPost() {
    if (!this.postId) return;

    try {
      const post = await this.postService.getPost(this.postId);
      if (post) {
        this.title = post.title;
        this.slug = post.slug;
        this.content = post.content || '';
        this.status = post.status;
        this.tagsInput = post.tags?.join(', ') || '';

        // Load post categories
        const categories = await this.postService.getPostCategories(this.postId);
        this.selectedCategoryIds.set(categories.map((c) => c.id));
      }
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to load post');
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
    if (!this.title.trim() || !this.slug.trim()) {
      this.errorMessage.set('Title and slug are required');
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

      if (this.isEditMode() && this.postId) {
        await this.postService.updatePost(this.postId, {
          title: this.title,
          slug: this.slug,
          content: this.content || undefined,
          status: this.status,
          tags: tags.length > 0 ? tags : undefined,
          category_ids: this.selectedCategoryIds(),
        });
        this.successMessage.set('Post updated successfully!');
      } else {
        await this.postService.createPost({
          title: this.title,
          slug: this.slug,
          content: this.content || undefined,
          status: this.status,
          tags: tags.length > 0 ? tags : undefined,
          category_ids: this.selectedCategoryIds(),
        });
        this.successMessage.set('Post created successfully!');
      }

      // Redirect after a short delay
      setTimeout(() => {
        this.router.navigate(['/posts']);
      }, 1500);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to save post');
      this.saving.set(false);
    }
  }
}
