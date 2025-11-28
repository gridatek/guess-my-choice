import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PostService, Post } from '../services/post.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-posts',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-3xl font-extrabold text-gray-900">Posts</h2>
          <div class="space-x-4">
            <a
              routerLink="/posts/create"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              data-testid="create-post-button"
            >
              Create Post
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
            <p class="text-gray-500">Loading posts...</p>
          </div>
        } @else if (errorMessage()) {
          <div
            class="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded"
            data-testid="error-message"
          >
            {{ errorMessage() }}
          </div>
        } @else if (posts().length === 0) {
          <div class="text-center py-12" data-testid="no-posts">
            <p class="text-gray-500">No posts found. Create your first post!</p>
          </div>
        } @else {
          <div class="bg-white shadow overflow-hidden sm:rounded-md">
            <ul class="divide-y divide-gray-200">
              @for (post of posts(); track post.id) {
                <li data-testid="post-item">
                  <div class="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div class="flex items-center justify-between">
                      <div class="flex-1 min-w-0">
                        <h3 class="text-lg font-medium text-indigo-600 truncate">
                          <a
                            [routerLink]="['/posts', post.id]"
                            class="hover:underline"
                            [attr.data-testid]="'post-title-' + post.id"
                          >
                            {{ post.title }}
                          </a>
                        </h3>
                        <div class="mt-2 flex items-center text-sm text-gray-500">
                          <span
                            [class]="
                              post.status === 'published'
                                ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'
                                : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'
                            "
                            [attr.data-testid]="'post-status-' + post.id"
                          >
                            {{ post.status }}
                          </span>
                          <span class="mx-2">•</span>
                          <span>{{ formatDate(post.created_at) }}</span>
                          @if (post.view_count > 0) {
                            <span class="mx-2">•</span>
                            <span>{{ post.view_count }} views</span>
                          }
                        </div>
                        @if (post.content) {
                          <p class="mt-2 text-sm text-gray-600 line-clamp-2">
                            {{ post.content }}
                          </p>
                        }
                      </div>
                      <div class="ml-4 flex-shrink-0 flex space-x-2">
                        @if (canEdit(post)) {
                          <a
                            [routerLink]="['/posts/edit', post.id]"
                            class="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            [attr.data-testid]="'edit-post-' + post.id"
                          >
                            Edit
                          </a>
                          <button
                            type="button"
                            (click)="deletePost(post)"
                            class="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                            [attr.data-testid]="'delete-post-' + post.id"
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
export class Posts implements OnInit {
  posts = signal<Post[]>([]);
  loading = signal(true);
  errorMessage = signal('');

  constructor(
    private postService: PostService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    await this.loadPosts();
  }

  async loadPosts() {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const posts = await this.postService.getPosts();
      this.posts.set(posts);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to load posts');
    } finally {
      this.loading.set(false);
    }
  }

  canEdit(post: Post): boolean {
    const user = this.authService.getCurrentUser();
    return user ? post.user_id === user.id : false;
  }

  async deletePost(post: Post) {
    if (!confirm(`Are you sure you want to delete "${post.title}"?`)) {
      return;
    }

    try {
      await this.postService.deletePost(post.id);
      this.posts.set(this.posts().filter((p) => p.id !== post.id));
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to delete post');
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
