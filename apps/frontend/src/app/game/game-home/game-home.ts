import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GameService, SessionType } from '../../services/game.service';

@Component({
  selector: 'app-game-home',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500">
      <div class="max-w-4xl mx-auto px-4 py-16">
        <!-- Header -->
        <div class="text-center mb-12">
          <h1 class="text-5xl font-bold text-white mb-4" data-testid="game-home-title">
            Guess My Choice
          </h1>
          <p class="text-xl text-white/90">Create connections through fun gameplay</p>
        </div>

        <!-- Main Actions -->
        <div class="grid md:grid-cols-2 gap-8 mb-12">
          <!-- Create Game Card -->
          <div class="bg-white rounded-2xl shadow-2xl p-8">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">Create New Game</h2>

            <div class="space-y-4 mb-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Session Type</label>
                <select
                  [(ngModel)]="selectedSessionType"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  data-testid="session-type-select"
                >
                  <option value="friends">Friends - Casual & Fun</option>
                  <option value="couple">Couple - Romantic & Intimate</option>
                  <option value="adult">Adult - Flirty & Playful</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Number of Rounds</label>
                <select
                  [(ngModel)]="maxRounds"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  data-testid="max-rounds-select"
                >
                  <option value="5">5 Rounds - Quick Game</option>
                  <option value="10">10 Rounds - Standard</option>
                  <option value="15">15 Rounds - Extended</option>
                  <option value="20">20 Rounds - Marathon</option>
                </select>
              </div>
            </div>

            <button
              (click)="createGame()"
              [disabled]="isCreating()"
              class="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="create-game-button"
            >
              {{ isCreating() ? 'Creating...' : 'Create Game' }}
            </button>
          </div>

          <!-- Join Game Card -->
          <div class="bg-white rounded-2xl shadow-2xl p-8">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">Join Game</h2>

            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Enter Game Code</label>
              <input
                type="text"
                [(ngModel)]="joinCode"
                (input)="formatJoinCode()"
                maxlength="6"
                placeholder="ABC123"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent uppercase text-center text-2xl font-mono tracking-wider"
                data-testid="join-code-input"
              />
            </div>

            <button
              (click)="joinGame()"
              [disabled]="isJoining() || joinCode.length !== 6"
              class="w-full bg-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="join-game-button"
            >
              {{ isJoining() ? 'Joining...' : 'Join Game' }}
            </button>
          </div>
        </div>

        <!-- My Sessions -->
        <div class="bg-white rounded-2xl shadow-2xl p-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">My Game Sessions</h2>

          @if (isLoadingSessions()) {
            <div class="text-center py-8">
              <div
                class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"
              ></div>
              <p class="text-gray-600 mt-4">Loading sessions...</p>
            </div>
          } @else if (sessions().length === 0) {
            <div class="text-center py-8 text-gray-500">
              <p>No game sessions yet. Create or join a game to get started!</p>
            </div>
          } @else {
            <div class="space-y-4">
              @for (session of sessions(); track session.id) {
                <div
                  class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                  (click)="navigateToSession(session.id, session.status)"
                  data-testid="session-item"
                >
                  <div class="flex justify-between items-start">
                    <div>
                      <div class="flex items-center gap-2 mb-2">
                        <span
                          class="px-3 py-1 rounded-full text-xs font-semibold"
                          [class]="getStatusClass(session.status)"
                        >
                          {{ session.status | uppercase }}
                        </span>
                        <span
                          class="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-700"
                        >
                          {{ session.session_type | uppercase }}
                        </span>
                      </div>
                      <p class="text-sm text-gray-600">
                        Code: <span class="font-mono font-bold">{{ session.session_code }}</span>
                      </p>
                      <p class="text-sm text-gray-600">
                        Round {{ session.current_round }} / {{ session.max_rounds }}
                      </p>
                      <p class="text-sm text-gray-600">
                        Connection Points: {{ session.connection_points }}
                      </p>
                    </div>
                    <div class="text-right text-sm text-gray-500">
                      {{ formatDate(session.created_at) }}
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Error Message -->
        @if (errorMessage()) {
          <div
            class="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg"
            role="alert"
            data-testid="error-message"
          >
            <p>{{ errorMessage() }}</p>
          </div>
        }

        <!-- Back to Dashboard -->
        <div class="mt-8 text-center">
          <button (click)="goToDashboard()" class="text-white hover:text-white/80 transition">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  `,
  styles: ``,
})
export class GameHome {
  selectedSessionType: SessionType = 'friends';
  maxRounds = 10;
  joinCode = '';

  isCreating = signal(false);
  isJoining = signal(false);
  isLoadingSessions = signal(false);
  errorMessage = signal('');
  sessions = signal<any[]>([]);

  constructor(
    private gameService: GameService,
    private router: Router
  ) {
    this.loadSessions();
  }

  async createGame() {
    try {
      this.isCreating.set(true);
      this.errorMessage.set('');

      const session = await this.gameService.createSession({
        session_type: this.selectedSessionType,
        max_rounds: this.maxRounds,
      });

      await this.router.navigate(['/game/lobby', session.id]);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to create game');
      console.error('Create game error:', error);
    } finally {
      this.isCreating.set(false);
    }
  }

  async joinGame() {
    try {
      this.isJoining.set(true);
      this.errorMessage.set('');

      const session = await this.gameService.joinSession({
        session_code: this.joinCode,
      });

      await this.router.navigate(['/game/play', session.id]);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to join game');
      console.error('Join game error:', error);
    } finally {
      this.isJoining.set(false);
    }
  }

  formatJoinCode() {
    this.joinCode = this.joinCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  async loadSessions() {
    try {
      this.isLoadingSessions.set(true);
      const sessions = await this.gameService.getMySessions();
      this.sessions.set(sessions);
    } catch (error) {
      console.error('Load sessions error:', error);
    } finally {
      this.isLoadingSessions.set(false);
    }
  }

  navigateToSession(sessionId: string, status: string) {
    if (status === 'waiting') {
      this.router.navigate(['/game/lobby', sessionId]);
    } else if (status === 'active') {
      this.router.navigate(['/game/play', sessionId]);
    } else if (status === 'finished') {
      this.router.navigate(['/game/results', sessionId]);
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'finished':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
