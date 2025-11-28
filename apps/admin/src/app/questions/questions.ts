import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OptionService, Question } from '../services/option.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-questions',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-3xl font-extrabold text-gray-900">Questions</h2>
          <div class="space-x-4">
            <a
              routerLink="/questions/create"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              data-testid="create-question-button"
            >
              Create Question
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
            <p class="text-gray-500">Loading questions...</p>
          </div>
        } @else if (errorMessage()) {
          <div
            class="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded"
            data-testid="error-message"
          >
            {{ errorMessage() }}
          </div>
        } @else if (questions().length === 0) {
          <div class="text-center py-12" data-testid="no-questions">
            <p class="text-gray-500">No questions found. Create your first question!</p>
          </div>
        } @else {
          <div class="bg-white shadow overflow-hidden sm:rounded-md">
            <ul class="divide-y divide-gray-200">
              @for (question of questions(); track question.id) {
                <li data-testid="question-item">
                  <div class="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div class="flex items-center justify-between">
                      <div class="flex-1 min-w-0">
                        <h3 class="text-lg font-medium text-indigo-600">
                          <a
                            [routerLink]="['/questions', question.id]"
                            class="hover:underline"
                            [attr.data-testid]="'question-title-' + question.id"
                          >
                            {{ question.question_text }}
                          </a>
                        </h3>
                        <div class="mt-2 flex items-center text-sm text-gray-500 flex-wrap gap-2">
                          <span
                            [class]="getStatusClass(question.status)"
                            [attr.data-testid]="'question-status-' + question.id"
                          >
                            {{ question.status }}
                          </span>
                          <span>•</span>
                          <span
                            [class]="getSessionTypeClass(question.session_type)"
                            [attr.data-testid]="'question-session-type-' + question.id"
                          >
                            {{ question.session_type }}
                          </span>
                          <span>•</span>
                          <span>{{ formatDate(question.created_at) }}</span>
                          @if (question.view_count > 0) {
                            <span>•</span>
                            <span>{{ question.view_count }} views</span>
                          }
                        </div>
                        @if (question.description) {
                          <p class="mt-2 text-sm text-gray-600 line-clamp-2">
                            {{ question.description }}
                          </p>
                        }
                      </div>
                      <div class="ml-4 flex-shrink-0 flex space-x-2">
                        @if (canEdit(question)) {
                          <a
                            [routerLink]="['/questions/edit', question.id]"
                            class="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            [attr.data-testid]="'edit-question-' + question.id"
                          >
                            Edit
                          </a>
                          <button
                            type="button"
                            (click)="deleteQuestion(question)"
                            class="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                            [attr.data-testid]="'delete-question-' + question.id"
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
export class Questions implements OnInit {
  questions = signal<Question[]>([]);
  loading = signal(true);
  errorMessage = signal('');

  constructor(
    private optionService: OptionService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    await this.loadQuestions();
  }

  async loadQuestions() {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const questions = await this.optionService.getQuestions();
      this.questions.set(questions);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to load questions');
    } finally {
      this.loading.set(false);
    }
  }

  canEdit(question: Question): boolean {
    const user = this.authService.getCurrentUser();
    return user ? question.user_id === user.id : false;
  }

  async deleteQuestion(question: Question) {
    if (!confirm(`Are you sure you want to delete "${question.question_text}"?`)) {
      return;
    }

    try {
      await this.optionService.deleteQuestion(question.id);
      this.questions.set(this.questions().filter((q) => q.id !== question.id));
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to delete question');
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
