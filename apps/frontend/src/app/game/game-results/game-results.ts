import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService, GameSession, GameRound } from '../../services/game.service';

@Component({
  selector: 'app-game-results',
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600">
      <div class="max-w-4xl mx-auto px-4 py-16">
        @if (session() && rounds().length > 0) {
          <div class="bg-white rounded-2xl shadow-2xl p-8">
            <!-- Header -->
            <div class="text-center mb-8">
              <div class="text-7xl mb-4">{{ getResultEmoji() }}</div>
              <h1 class="text-4xl font-bold text-gray-800 mb-2">Game Complete!</h1>
              <p class="text-xl text-gray-600">{{ getResultMessage() }}</p>
            </div>

            <!-- Final Score -->
            <div
              class="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-8 mb-8 text-center"
            >
              <p class="text-lg text-gray-600 mb-2">Total Connection Points</p>
              <div class="text-6xl font-bold text-purple-700 mb-4">
                {{ session()!.connection_points }}
              </div>
              <div class="flex justify-center gap-8 text-sm">
                <div>
                  <p class="text-gray-600">Correct Guesses</p>
                  <p class="text-2xl font-bold text-green-600">{{ correctGuesses() }}</p>
                </div>
                <div>
                  <p class="text-gray-600">Total Rounds</p>
                  <p class="text-2xl font-bold text-blue-600">{{ totalRounds() }}</p>
                </div>
                <div>
                  <p class="text-gray-600">Accuracy</p>
                  <p class="text-2xl font-bold text-purple-600">{{ accuracy() }}%</p>
                </div>
              </div>
            </div>

            <!-- Connection Level -->
            <div class="mb-8 text-center">
              <h3 class="text-2xl font-semibold text-gray-800 mb-4">Connection Level</h3>
              <div class="bg-gray-200 rounded-full h-6 max-w-md mx-auto overflow-hidden">
                <div
                  class="bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 h-6 rounded-full transition-all duration-1000 flex items-center justify-center text-white font-semibold text-sm"
                  [style.width.%]="connectionPercentage()"
                >
                  {{ connectionPercentage() }}%
                </div>
              </div>
              <p class="text-lg font-semibold text-gray-700 mt-4">{{ getConnectionLevel() }}</p>
            </div>

            <!-- Round Summary -->
            <div class="mb-8">
              <h3 class="text-2xl font-semibold text-gray-800 mb-4">Round Summary</h3>
              <div class="space-y-3">
                @for (round of rounds(); track round.id; let i = $index) {
                  <div
                    class="flex items-center justify-between p-4 border rounded-lg"
                    [class.bg-green-50]="round.is_correct"
                    [class.border-green-300]="round.is_correct"
                    [class.bg-gray-50]="!round.is_correct"
                    [class.border-gray-300]="!round.is_correct"
                  >
                    <div class="flex items-center gap-4">
                      <div class="text-2xl">
                        {{ round.is_correct ? '✓' : '✗' }}
                      </div>
                      <div>
                        <p class="font-semibold text-gray-800">Round {{ i + 1 }}</p>
                        <p class="text-sm text-gray-600">
                          {{ round.is_correct ? 'Correct guess!' : 'Incorrect guess' }}
                        </p>
                      </div>
                    </div>
                    <div class="text-right">
                      <p
                        class="font-bold"
                        [class.text-green-600]="round.is_correct"
                        [class.text-gray-400]="!round.is_correct"
                      >
                        +{{ round.points_earned }} pts
                      </p>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Session Info -->
            <div class="border-t border-gray-200 pt-6 mb-6">
              <h3 class="font-semibold text-gray-800 mb-4">Game Details</h3>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="text-gray-600">Session Type</p>
                  <p class="font-semibold text-gray-800">
                    {{ session()!.session_type | uppercase }}
                  </p>
                </div>
                <div>
                  <p class="text-gray-600">Session Code</p>
                  <p class="font-semibold font-mono text-gray-800">{{ session()!.session_code }}</p>
                </div>
                <div>
                  <p class="text-gray-600">Started</p>
                  <p class="font-semibold text-gray-800">{{ formatDate(session()!.created_at) }}</p>
                </div>
                <div>
                  <p class="text-gray-600">Finished</p>
                  <p class="font-semibold text-gray-800">
                    {{ formatDate(session()!.finished_at || session()!.updated_at) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-4">
              <button
                (click)="playAgain()"
                class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
                data-testid="play-again-button"
              >
                Play Again
              </button>
              <button
                (click)="goHome()"
                class="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                data-testid="home-button"
              >
                Back to Home
              </button>
            </div>
          </div>
        } @else if (isLoading()) {
          <div class="bg-white rounded-2xl shadow-2xl p-12 text-center">
            <div
              class="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"
            ></div>
            <p class="text-gray-600">Loading results...</p>
          </div>
        } @else {
          <div class="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <p class="text-red-600 mb-4">Game not found or not finished</p>
            <button
              (click)="goHome()"
              class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Back to Home
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: ``,
})
export class GameResults implements OnInit {
  session = signal<GameSession | null>(null);
  rounds = signal<GameRound[]>([]);
  isLoading = signal(true);

  private sessionId: string | null = null;

  correctGuesses = computed(() => {
    return this.rounds().filter((r) => r.is_correct).length;
  });

  totalRounds = computed(() => {
    return this.rounds().length;
  });

  accuracy = computed(() => {
    const total = this.totalRounds();
    if (total === 0) return 0;
    return Math.round((this.correctGuesses() / total) * 100);
  });

  connectionPercentage = computed(() => {
    const session = this.session();
    if (!session) return 0;
    const maxPossible = session.max_rounds * 10;
    return Math.round((session.connection_points / maxPossible) * 100);
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gameService: GameService
  ) {}

  async ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('id');
    if (!this.sessionId) {
      this.goHome();
      return;
    }

    await this.loadResults();
  }

  async loadResults() {
    try {
      this.isLoading.set(true);

      const session = await this.gameService.getSession(this.sessionId!);
      this.session.set(session);

      const rounds = await this.gameService.getSessionRounds(this.sessionId!);
      this.rounds.set(rounds);
    } catch (error) {
      console.error('Load results error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  getResultEmoji(): string {
    const accuracy = this.accuracy();
    if (accuracy >= 80) return '🎉';
    if (accuracy >= 60) return '😊';
    if (accuracy >= 40) return '😐';
    return '😅';
  }

  getResultMessage(): string {
    const accuracy = this.accuracy();
    if (accuracy >= 80) return 'Amazing Connection!';
    if (accuracy >= 60) return 'Great Connection!';
    if (accuracy >= 40) return 'Good Effort!';
    return 'Keep Trying!';
  }

  getConnectionLevel(): string {
    const percentage = this.connectionPercentage();
    if (percentage >= 90) return '🔥 Soul Mates';
    if (percentage >= 75) return '💜 Best Friends';
    if (percentage >= 60) return '💙 Close Friends';
    if (percentage >= 40) return '💚 Good Friends';
    if (percentage >= 25) return '💛 Friends';
    return '🤝 Getting to Know Each Other';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  playAgain() {
    this.router.navigate(['/game']);
  }

  goHome() {
    this.router.navigate(['/game']);
  }
}
