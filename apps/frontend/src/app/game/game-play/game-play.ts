import { Component, OnDestroy, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  GameService,
  GameSession,
  GameRound,
  GameOption,
  Question,
} from '../../services/game.service';
import { AuthService } from '../../services/auth.service';

type GamePhase = 'loading' | 'choosing' | 'waiting' | 'revealing' | 'feedback';

@Component({
  selector: 'app-game-play',
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
      <div class="max-w-6xl mx-auto px-4 py-8">
        @if (session() && currentRound()) {
          <!-- Game Header -->
          <div class="bg-white rounded-2xl shadow-2xl p-6 mb-6">
            <div class="flex justify-between items-center">
              <div>
                <h1 class="text-2xl font-bold text-gray-800" data-testid="round-number">
                  Round {{ session()!.current_round }} / {{ session()!.max_rounds }}
                </h1>
                <p class="text-gray-600" data-testid="player-role">
                  {{ getSessionTypeLabel(session()!.session_type) }}
                  - You are Player {{ isPlayer1() ? '1' : '2' }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-600">Connection Points</p>
                <p class="text-3xl font-bold text-purple-600" data-testid="connection-points">
                  {{ session()!.connection_points }}
                </p>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="mt-4 bg-gray-200 rounded-full h-2">
              <div
                class="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-500"
                [style.width.%]="roundProgress()"
              ></div>
            </div>
          </div>

          <!-- Question Display -->
          @if (currentQuestion()) {
            <div class="bg-white rounded-2xl shadow-2xl p-6 mb-6">
              <h2 class="text-2xl font-bold text-center text-gray-800">
                {{ currentQuestion()!.question_text }}
              </h2>
              @if (currentQuestion()!.description) {
                <p class="text-center text-gray-600 mt-2">
                  {{ currentQuestion()!.description }}
                </p>
              }
            </div>
          }

          <!-- Game Phase Content -->
          <div class="bg-white rounded-2xl shadow-2xl p-8">
            @if (gamePhase() === 'loading') {
              <div class="text-center py-12">
                <div
                  class="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"
                ></div>
                <p class="text-gray-600">Loading round...</p>
              </div>
            }

            @if (gamePhase() === 'choosing') {
              <div>
                <h3
                  class="text-2xl font-semibold text-center mb-6 text-gray-800"
                  data-testid="turn-message"
                >
                  Choose your option
                </h3>

                <div class="grid md:grid-cols-2 gap-4">
                  @for (option of options(); track option.id) {
                    <button
                      (click)="
                        isPlayer1() ? selectedChoice.set(option.id) : selectedGuess.set(option.id)
                      "
                      class="p-6 border-2 rounded-xl text-left transition hover:shadow-lg"
                      [class.border-purple-600]="
                        (isPlayer1() && selectedChoice() === option.id) ||
                        (isPlayer2() && selectedGuess() === option.id)
                      "
                      [class.bg-purple-50]="
                        (isPlayer1() && selectedChoice() === option.id) ||
                        (isPlayer2() && selectedGuess() === option.id)
                      "
                      [class.border-gray-300]="
                        (isPlayer1() && selectedChoice() !== option.id) ||
                        (isPlayer2() && selectedGuess() !== option.id)
                      "
                      [class.hover:border-purple-400]="true"
                      data-testid="option-button"
                    >
                      <h4 class="font-semibold text-lg text-gray-800 mb-2">
                        {{ option.option_text }}
                      </h4>
                      @if (option.description) {
                        <p class="text-sm text-gray-600">{{ option.description }}</p>
                      }
                      @if (
                        (isPlayer1() && selectedChoice() === option.id) ||
                        (isPlayer2() && selectedGuess() === option.id)
                      ) {
                        <div class="mt-2 text-purple-600 font-semibold">✓ Selected</div>
                      }
                    </button>
                  }
                </div>

                @if ((isPlayer1() && selectedChoice()) || (isPlayer2() && selectedGuess())) {
                  <div class="mt-6 text-center">
                    <button
                      (click)="isPlayer1() ? confirmChoice() : confirmPlayer2Choice()"
                      class="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold text-lg"
                      [attr.data-testid]="
                        isPlayer1() ? 'confirm-choice-button' : 'confirm-guess-button'
                      "
                    >
                      Confirm Choice
                    </button>
                  </div>
                }
              </div>
            }

            @if (gamePhase() === 'waiting') {
              <div class="text-center py-12">
                <div class="text-6xl mb-6">⏳</div>
                <h3 class="text-2xl font-semibold text-gray-800 mb-4" data-testid="turn-message">
                  Waiting for other player...
                </h3>
                <p class="text-gray-600 mb-6">
                  You've made your choice! Waiting for {{ isPlayer1() ? 'Player 2' : 'Player 1' }}
                  to choose.
                </p>
                <div class="animate-pulse inline-flex space-x-2">
                  <div class="w-3 h-3 bg-purple-600 rounded-full"></div>
                  <div class="w-3 h-3 bg-purple-600 rounded-full"></div>
                  <div class="w-3 h-3 bg-purple-600 rounded-full"></div>
                </div>
              </div>
            }

            @if (gamePhase() === 'revealing') {
              <div class="text-center" data-testid="result-overlay">
                <div class="text-6xl mb-6">
                  {{ isCorrectGuess() ? '🎉' : '😅' }}
                </div>
                <h3 class="text-3xl font-bold mb-4 text-gray-800">
                  {{ isCorrectGuess() ? 'Correct Guess!' : 'Not Quite!' }}
                </h3>

                <div class="mb-8">
                  <p class="text-xl text-gray-600 mb-4">Player 1 chose:</p>
                  @if (getChosenOption()) {
                    <div
                      class="bg-purple-100 border-2 border-purple-600 rounded-xl p-6 max-w-md mx-auto"
                    >
                      <h4 class="font-bold text-xl text-gray-800 mb-2">
                        {{ getChosenOption()!.option_text }}
                      </h4>
                      @if (getChosenOption()!.description) {
                        <p class="text-gray-600">{{ getChosenOption()!.description }}</p>
                      }
                    </div>
                  }
                </div>

                @if (isCorrectGuess()) {
                  <div
                    class="bg-green-100 border border-green-400 rounded-lg p-4 max-w-md mx-auto mb-6"
                  >
                    <p class="text-green-800 font-semibold">+10 Connection Points!</p>
                  </div>
                }

                <button
                  (click)="continueToNextRound()"
                  class="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition text-lg"
                  data-testid="continue-button"
                >
                  {{ hasMoreRounds() ? 'Continue to Next Round' : 'View Final Results' }}
                </button>
              </div>
            }
          </div>

          @if (errorMessage()) {
            <div
              class="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg"
              role="alert"
              data-testid="error-message"
            >
              <p>{{ errorMessage() }}</p>
            </div>
          }
        } @else if (session() && !currentRound()) {
          <!-- Waiting for game to start -->
          <div class="bg-white rounded-2xl shadow-2xl p-12 text-center">
            <div class="text-6xl mb-4">⏳</div>
            <h2 class="text-2xl font-semibold text-gray-800 mb-4">Waiting for Game to Start...</h2>
            <p class="text-gray-600">Player 1 is preparing the game. Get ready to play!</p>
            <div class="mt-6">
              <p class="text-sm text-gray-600">Connection Points</p>
              <p class="text-3xl font-bold text-purple-600">{{ session()!.connection_points }}</p>
            </div>
          </div>
        } @else if (isLoadingSession()) {
          <div class="bg-white rounded-2xl shadow-2xl p-12 text-center">
            <div
              class="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"
            ></div>
            <p class="text-gray-600">Loading game...</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: ``,
})
export class GamePlay implements OnInit, OnDestroy {
  session = signal<GameSession | null>(null);
  currentRound = signal<GameRound | null>(null);
  options = signal<GameOption[]>([]);
  currentQuestion = signal<Question | null>(null);
  gamePhase = signal<GamePhase>('loading');

  selectedChoice = signal<string | null>(null);
  selectedGuess = signal<string | null>(null);

  isLoadingSession = signal(true);
  errorMessage = signal('');

  private sessionId: string | null = null;
  private currentUserId: string | null = null;
  private sessionSubscription: any = null;
  private roundSubscription: any = null;

  isPlayer1 = computed(() => this.session()?.player1_id === this.currentUserId);
  isPlayer2 = computed(() => this.session()?.player2_id === this.currentUserId);
  roundProgress = computed(() => {
    const session = this.session();
    if (!session) return 0;
    return (session.current_round / session.max_rounds) * 100;
  });

  isCorrectGuess = computed(() => {
    const round = this.currentRound();
    return round?.is_correct === true;
  });

  hasMoreRounds = computed(() => {
    const session = this.session();
    return session && session.current_round < session.max_rounds;
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gameService: GameService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('id');
    if (!this.sessionId) {
      this.router.navigate(['/game']);
      return;
    }

    const user = await this.authService.getCurrentUser();
    this.currentUserId = user?.id || null;

    await this.loadSession();
    await this.loadCurrentRound();
    this.subscribeToUpdates();
  }

  ngOnDestroy() {
    if (this.sessionSubscription) {
      this.sessionSubscription.unsubscribe();
    }
    if (this.roundSubscription) {
      this.roundSubscription.unsubscribe();
    }
  }

  async loadSession() {
    try {
      this.isLoadingSession.set(true);
      const session = await this.gameService.getSession(this.sessionId!);
      this.session.set(session);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to load session');
      console.error('Load session error:', error);
    } finally {
      this.isLoadingSession.set(false);
    }
  }

  async loadCurrentRound() {
    try {
      const session = this.session();
      if (!session) return;

      const rounds = await this.gameService.getSessionRounds(session.id);
      const current = rounds[rounds.length - 1];

      if (current) {
        this.currentRound.set(current);
        await this.loadRoundData(current);
        this.determineGamePhase(current);
      }
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to load round');
      console.error('Load round error:', error);
    }
  }

  async loadRoundData(round: GameRound) {
    try {
      // Load options
      const supabase = this.authService.getSupabaseClient();
      const { data: optionsData } = await supabase
        .from('options')
        .select('id, option_text, description, session_type, difficulty_level')
        .in('id', round.selected_options);

      if (optionsData) {
        this.options.set(optionsData);
      }

      // Load question if exists
      if (round.question_id) {
        const { data: questionData } = await supabase
          .from('questions')
          .select('id, question_text, description, session_type, tags')
          .eq('id', round.question_id)
          .single();

        if (questionData) {
          this.currentQuestion.set(questionData);
        }
      }
    } catch (error) {
      console.error('Load round data error:', error);
    }
  }

  determineGamePhase(round: GameRound) {
    const currentUserId = this.currentUserId;
    const isPlayer1 = this.isPlayer1();

    // If both have chosen, show results
    if (round.player1_choice && round.player2_choice) {
      this.gamePhase.set('revealing');
      this.selectedChoice.set(round.player1_choice);
      this.selectedGuess.set(round.player2_choice);
    }
    // If current player has chosen but other hasn't, show waiting
    else if (
      (isPlayer1 && round.player1_choice && !round.player2_choice) ||
      (!isPlayer1 && round.player2_choice && !round.player1_choice)
    ) {
      this.gamePhase.set('waiting');
      if (isPlayer1) {
        this.selectedChoice.set(round.player1_choice);
      } else {
        this.selectedGuess.set(round.player2_choice);
      }
    }
    // Otherwise, in choosing phase
    else {
      this.gamePhase.set('choosing');
      // Pre-fill if already chosen (in case of refresh)
      if (isPlayer1 && round.player1_choice) {
        this.selectedChoice.set(round.player1_choice);
      } else if (!isPlayer1 && round.player2_choice) {
        this.selectedGuess.set(round.player2_choice);
      }
    }
  }

  subscribeToUpdates() {
    const session = this.session();
    const round = this.currentRound();

    if (session) {
      this.sessionSubscription = this.gameService.subscribeToSession(
        session.id,
        async (updatedSession) => {
          const previousRound = this.session()?.current_round || 0;
          this.session.set(updatedSession);

          // If current_round changed (e.g., from 0 to 1 when game starts), reload the round
          if (updatedSession.current_round !== previousRound && updatedSession.current_round > 0) {
            console.log('🎮 [GAME-PLAY] Round changed, reloading current round...');
            await this.loadCurrentRound();
          }
        }
      );
    }

    if (round) {
      this.roundSubscription = this.gameService.subscribeToRound(round.id, (updatedRound) => {
        this.currentRound.set(updatedRound);
        this.determineGamePhase(updatedRound);
      });
    }
  }

  async confirmChoice() {
    try {
      const round = this.currentRound();
      const optionId = this.selectedChoice();
      if (!round || !this.isPlayer1() || !optionId) return;

      await this.gameService.submitChoice(round.id, optionId);

      // After submitting, move to waiting phase until Player 2 also chooses
      this.gamePhase.set('waiting');
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to submit choice');
      console.error('Submit choice error:', error);
    }
  }

  async confirmPlayer2Choice() {
    try {
      const round = this.currentRound();
      const optionId = this.selectedGuess();
      if (!round || !this.isPlayer2() || !optionId) return;

      await this.gameService.submitPlayer2Choice(round.id, optionId);

      // The database trigger will automatically:
      // - Calculate is_correct (if both chose same option)
      // - Set points_earned
      // - Update session connection_points
      // - Set completed_at

      // Wait a moment for the trigger to process
      await new Promise((resolve) => setTimeout(resolve, 500));

      // After submitting, move to waiting phase until Player 1 also chooses
      this.gamePhase.set('waiting');
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to submit choice');
      console.error('Submit choice error:', error);
    }
  }

  /**
   * @deprecated Use confirmPlayer2Choice instead
   */
  async confirmGuess() {
    return this.confirmPlayer2Choice();
  }

  getChosenOption(): GameOption | null {
    const choiceId = this.selectedChoice();
    if (!choiceId) return null;
    return this.options().find((o) => o.id === choiceId) || null;
  }

  async continueToNextRound() {
    const session = this.session();
    if (!session) return;

    if (session.current_round >= session.max_rounds) {
      // Game finished
      const supabase = this.authService.getSupabaseClient();
      await supabase
        .from('game_sessions')
        .update({
          status: 'finished',
          finished_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      await this.router.navigate(['/game/results', session.id]);
    } else {
      // Start next round
      try {
        const options = await this.gameService.getRandomOptions(session.session_type, 5);
        const question = await this.gameService.getRandomQuestion(session.session_type);

        const newRound = await this.gameService.startRound(
          session.id,
          options.map((o) => o.id),
          question?.id
        );

        // Update session current round
        const supabase = this.authService.getSupabaseClient();
        await supabase
          .from('game_sessions')
          .update({
            current_round: session.current_round + 1,
          })
          .eq('id', session.id);

        // Reload for next round
        this.selectedChoice.set(null);
        this.selectedGuess.set(null);
        window.location.reload();
      } catch (error: any) {
        this.errorMessage.set(error.message || 'Failed to start next round');
        console.error('Next round error:', error);
      }
    }
  }

  getSessionTypeLabel(type: string): string {
    switch (type) {
      case 'friends':
        return 'Friends Mode';
      case 'couple':
        return 'Couple Mode';
      case 'adult':
        return 'Adult Mode';
      default:
        return type;
    }
  }
}
