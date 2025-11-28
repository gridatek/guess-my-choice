import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import {
  OptionService,
  Question,
  OptionStatus,
  SessionType,
} from '../services/option.service';

@Component({
  selector: 'app-question-form',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto">
        <div class="mb-8">
          <h2 class="text-3xl font-extrabold text-gray-900">
            {{ isEditMode() ? 'Edit Question' : 'Create Question' }}
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
              <label for="question_text" class="block text-sm font-medium text-gray-700">
                Question Text <span class="text-red-500">*</span>
              </label>
              <input
                id="question_text"
                name="question_text"
                type="text"
                required
                [(ngModel)]="questionText"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., What would I prefer to do this weekend?"
                data-testid="question-text-input"
              />
              <p class="mt-1 text-xs text-gray-500">
                The prompt that frames the game round
              </p>
            </div>

            <div>
              <label for="description" class="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows="3"
                [(ngModel)]="description"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Optional description or context for this question..."
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
                Choose the type of session this question is for
              </p>
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
                placeholder="weekend, activity, fun"
                data-testid="tags-input"
              />
              <p class="mt-1 text-xs text-gray-500">Comma-separated tags</p>
            </div>

            <div class="flex space-x-4">
              <button
                type="submit"
                [disabled]="saving()"
                class="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                data-testid="submit-button"
              >
                {{ saving() ? 'Saving...' : isEditMode() ? 'Update Question' : 'Create Question' }}
              </button>
              <a
                routerLink="/questions"
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
export class QuestionForm implements OnInit {
  questionText = '';
  description = '';
  sessionType: SessionType = 'friends';
  status: OptionStatus = 'draft';
  tagsInput = '';

  loading = signal(true);
  saving = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  isEditMode = signal(false);
  questionId: string | null = null;

  constructor(
    private optionService: OptionService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    this.questionId = this.route.snapshot.paramMap.get('id');
    this.isEditMode.set(!!this.questionId);

    if (this.isEditMode()) {
      await this.loadQuestion();
    }

    this.loading.set(false);
  }

  async loadQuestion() {
    if (!this.questionId) return;

    try {
      const question = await this.optionService.getQuestion(this.questionId);
      if (question) {
        this.questionText = question.question_text;
        this.description = question.description || '';
        this.sessionType = question.session_type;
        this.status = question.status;
        this.tagsInput = question.tags?.join(', ') || '';
      }
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to load question');
    }
  }

  async onSubmit() {
    if (!this.questionText.trim()) {
      this.errorMessage.set('Question text is required');
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

      if (this.isEditMode() && this.questionId) {
        await this.optionService.updateQuestion(this.questionId, {
          question_text: this.questionText,
          description: this.description || undefined,
          session_type: this.sessionType,
          status: this.status,
          tags: tags.length > 0 ? tags : undefined,
        });
        this.successMessage.set('Question updated successfully!');
      } else {
        await this.optionService.createQuestion({
          question_text: this.questionText,
          description: this.description || undefined,
          session_type: this.sessionType,
          status: this.status,
          tags: tags.length > 0 ? tags : undefined,
        });
        this.successMessage.set('Question created successfully!');
      }

      // Redirect after a short delay
      setTimeout(() => {
        this.router.navigate(['/questions']);
      }, 1500);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to save question');
      this.saving.set(false);
    }
  }
}
