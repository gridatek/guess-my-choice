import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService, GameSession } from '../../services/game.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-session-lobby',
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div class="max-w-4xl mx-auto px-4 py-16">
        @if (session()) {
          <div class="bg-white rounded-2xl shadow-2xl p-8">
            <!-- Header -->
            <div class="text-center mb-8">
              <h1 class="text-3xl font-bold text-gray-800 mb-2">Game Lobby</h1>
              <p class="text-gray-600">{{ getSessionTypeLabel(session()!.session_type) }}</p>
            </div>

            <!-- Session Code -->
            <div
              class="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 mb-8 text-center"
            >
              <p class="text-sm text-gray-600 mb-2">Share this code with your friend:</p>
              <div class="text-5xl font-bold font-mono text-purple-700 tracking-widest mb-4">
                {{ session()!.session_code }}
              </div>
              <button
                (click)="copySessionCode()"
                class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                data-testid="copy-code-button"
              >
                {{ codeCopied() ? '✓ Copied!' : 'Copy Code' }}
              </button>
            </div>

            <!-- Waiting Status -->
            @if (session()!.status === 'waiting') {
              <div class="text-center py-8">
                <div class="mb-6">
                  <div class="animate-pulse">
                    <div class="flex justify-center space-x-2 mb-4">
                      <div class="w-4 h-4 bg-purple-600 rounded-full"></div>
                      <div class="w-4 h-4 bg-purple-600 rounded-full"></div>
                      <div class="w-4 h-4 bg-purple-600 rounded-full"></div>
                    </div>
                  </div>
                  <h2 class="text-2xl font-semibold text-gray-800 mb-2">Waiting for Player 2...</h2>
                  <p class="text-gray-600">
                    Share the code above with your friend to start playing!
                  </p>
                </div>

                <!-- Player Status -->
                <div class="grid md:grid-cols-2 gap-4 mb-8">
                  <div class="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <div class="text-4xl mb-2">👤</div>
                    <p class="font-semibold text-green-800">Player 1 (You)</p>
                    <p class="text-sm text-green-600">Ready</p>
                  </div>
                  <div class="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                    <div class="text-4xl mb-2">⏳</div>
                    <p class="font-semibold text-gray-600">Player 2</p>
                    <p class="text-sm text-gray-500">Waiting to join...</p>
                  </div>
                </div>
              </div>
            }

            @if (session()!.status === 'active') {
              <div class="text-center py-8">
                <div class="text-6xl mb-4">🎮</div>
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">Both Players Ready!</h2>
                <p class="text-gray-600 mb-6">Get ready to start the game...</p>
                <button
                  (click)="startGame()"
                  [disabled]="isStarting()"
                  class="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition text-lg disabled:opacity-50"
                  data-testid="start-game-button"
                >
                  {{ isStarting() ? 'Starting...' : 'Start Game' }}
                </button>
              </div>
            }

            <!-- Game Info -->
            <div class="border-t border-gray-200 pt-6 mt-6">
              <h3 class="font-semibold text-gray-800 mb-4">Game Settings</h3>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="text-gray-600">Session Type</p>
                  <p class="font-semibold text-gray-800">
                    {{ session()!.session_type | uppercase }}
                  </p>
                </div>
                <div>
                  <p class="text-gray-600">Total Rounds</p>
                  <p class="font-semibold text-gray-800">{{ session()!.max_rounds }}</p>
                </div>
                <div>
                  <p class="text-gray-600">Current Round</p>
                  <p class="font-semibold text-gray-800">{{ session()!.current_round }}</p>
                </div>
                <div>
                  <p class="text-gray-600">Status</p>
                  <p class="font-semibold text-gray-800">{{ session()!.status | uppercase }}</p>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="mt-8 flex gap-4">
              <button
                (click)="cancelGame()"
                class="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                data-testid="cancel-button"
              >
                Cancel Game
              </button>
            </div>
          </div>
        } @else if (isLoading()) {
          <div class="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div
              class="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"
            ></div>
            <p class="text-gray-600">Loading session...</p>
          </div>
        } @else {
          <div class="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <p class="text-red-600">Session not found</p>
            <button
              (click)="goBack()"
              class="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Back to Home
            </button>
          </div>
        }

        @if (errorMessage()) {
          <div
            class="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg"
            role="alert"
            data-testid="error-message"
          >
            <p>{{ errorMessage() }}</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: ``,
})
export class SessionLobby implements OnInit, OnDestroy {
  session = signal<GameSession | null>(null);
  isLoading = signal(true);
  isStarting = signal(false);
  codeCopied = signal(false);
  errorMessage = signal('');

  private sessionId: string | null = null;
  private subscription: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gameService: GameService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('id');
    if (!this.sessionId) {
      this.goBack();
      return;
    }

    await this.loadSession();
    this.subscribeToSessionUpdates();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  async loadSession() {
    try {
      this.isLoading.set(true);
      const session = await this.gameService.getSession(this.sessionId!);
      this.session.set(session);

      // If session is already active, redirect to game
      if (session?.status === 'active' && session.current_round > 0) {
        await this.router.navigate(['/game/play', this.sessionId]);
      }
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to load session');
      console.error('Load session error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  subscribeToSessionUpdates() {
    this.subscription = this.gameService.subscribeToSession(
      this.sessionId!,
      async (updatedSession) => {
        this.session.set(updatedSession);

        // If session becomes active, show start button
        if (updatedSession.status === 'active' && updatedSession.current_round === 0) {
          // Both players joined, ready to start
        }

        // If game has started (current_round > 0), navigate to play
        if (updatedSession.status === 'active' && updatedSession.current_round > 0) {
          await this.router.navigate(['/game/play', this.sessionId]);
        }
      }
    );
  }

  async startGame() {
    try {
      this.isStarting.set(true);
      this.errorMessage.set('');

      const currentSession = this.session();
      if (!currentSession) return;

      // Get random options for the first round
      const options = await this.gameService.getRandomOptions(currentSession.session_type, 5);

      // Get a random question
      const question = await this.gameService.getRandomQuestion(currentSession.session_type);

      // Start the first round
      await this.gameService.startRound(
        currentSession.id,
        options.map((o) => o.id),
        question?.id
      );

      // Navigate to game play
      await this.router.navigate(['/game/play', this.sessionId]);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to start game');
      console.error('Start game error:', error);
      this.isStarting.set(false);
    }
  }

  async copySessionCode() {
    const code = this.session()?.session_code;
    if (code) {
      try {
        await navigator.clipboard.writeText(code);
        this.codeCopied.set(true);
        setTimeout(() => this.codeCopied.set(false), 2000);
      } catch (error) {
        console.error('Failed to copy code:', error);
      }
    }
  }

  async cancelGame() {
    if (confirm('Are you sure you want to cancel this game?')) {
      await this.router.navigate(['/game']);
    }
  }

  getSessionTypeLabel(type: string): string {
    switch (type) {
      case 'friends':
        return 'Friends - Casual & Fun';
      case 'couple':
        return 'Couple - Romantic & Intimate';
      case 'adult':
        return 'Adult - Flirty & Playful';
      default:
        return type;
    }
  }

  goBack() {
    this.router.navigate(['/game']);
  }
}
