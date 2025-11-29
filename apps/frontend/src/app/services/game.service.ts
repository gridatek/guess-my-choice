import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

export type SessionType = 'friends' | 'couple' | 'adult';
export type SessionStatus = 'waiting' | 'active' | 'finished' | 'cancelled';

export interface GameSession {
  id: string;
  player1_id: string;
  player2_id: string | null;
  session_type: SessionType;
  connection_points: number;
  status: SessionStatus;
  current_round: number;
  max_rounds: number;
  session_code: string;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface GameRound {
  id: string;
  game_session_id: string;
  round_number: number;
  selected_options: string[]; // Array of option UUIDs
  question_id: string | null; // Optional question that frames the round
  player1_choice: string | null;
  player2_guess: string | null;
  is_correct: boolean | null;
  points_earned: number;
  player1_feedback: string | null;
  player2_feedback: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface GameOption {
  id: string;
  option_text: string;
  description: string | null;
  session_type: SessionType;
  difficulty_level: number;
}

export interface Question {
  id: string;
  question_text: string;
  description: string | null;
  session_type: SessionType;
  tags: string[] | null;
}

export interface CreateSessionRequest {
  session_type: SessionType;
  max_rounds?: number;
}

export interface JoinSessionRequest {
  session_code: string;
}

@Injectable({
  providedIn: 'root',
})
export class GameService {
  constructor(private authService: AuthService) {}

  /**
   * Create a new game session
   */
  async createSession(request: CreateSessionRequest): Promise<GameSession> {
    const supabase = this.authService.getSupabaseClient();
    const user = await this.authService.getCurrentUser();

    if (!user) {
      throw new Error('No active user');
    }

    // Generate session code
    const sessionCode = this.generateSessionCode();

    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        player1_id: user.id,
        session_type: request.session_type,
        max_rounds: request.max_rounds || 10,
        session_code: sessionCode,
        status: 'waiting',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Join an existing game session by code
   */
  async joinSession(request: JoinSessionRequest): Promise<GameSession> {
    const supabase = this.authService.getSupabaseClient();
    const user = await this.authService.getCurrentUser();

    if (!user) {
      throw new Error('No active user');
    }

    // Validate session code format
    const sessionCode = request.session_code.toUpperCase().trim();
    if (!sessionCode || sessionCode.length !== 6) {
      throw new Error('Invalid session code');
    }

    // Find session by code
    const { data: session, error: findError } = await supabase
      .from('game_sessions')
      .select()
      .eq('session_code', sessionCode)
      .eq('status', 'waiting')
      .single();

    if (findError) {
      // Check if session exists at all
      const { data: anySession } = await supabase
        .from('game_sessions')
        .select()
        .eq('session_code', sessionCode)
        .single();

      if (!anySession) {
        throw new Error('Session not found');
      } else {
        throw new Error('Session not found or already started');
      }
    }

    // Update session with player 2
    const { data, error } = await supabase
      .from('game_sessions')
      .update({
        player2_id: user.id,
        status: 'active',
      })
      .eq('id', session.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get a game session by ID
   */
  async getSession(sessionId: string): Promise<GameSession | null> {
    const supabase = this.authService.getSupabaseClient();
    const { data, error } = await supabase
      .from('game_sessions')
      .select()
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get user's game sessions
   */
  async getMySessions(): Promise<GameSession[]> {
    const supabase = this.authService.getSupabaseClient();
    const user = await this.authService.getCurrentUser();

    if (!user) {
      throw new Error('No active user');
    }

    const { data, error } = await supabase
      .from('game_sessions')
      .select()
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get random options for a round
   */
  async getRandomOptions(sessionType: SessionType, count: number = 5): Promise<GameOption[]> {
    const supabase = this.authService.getSupabaseClient();
    const { data, error } = await supabase
      .from('options')
      .select('id, option_text, description, session_type, difficulty_level')
      .eq('session_type', sessionType)
      .eq('status', 'published')
      .limit(count);

    if (error) throw error;

    // Randomize the results
    const shuffled = (data || []).sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Get random question for a session type
   */
  async getRandomQuestion(sessionType: SessionType): Promise<Question | null> {
    const supabase = this.authService.getSupabaseClient();
    const { data, error } = await supabase
      .from('questions')
      .select('id, question_text, description, session_type, tags')
      .eq('session_type', sessionType)
      .eq('status', 'published')
      .limit(10);

    if (error) throw error;
    if (!data || data.length === 0) return null;

    // Return random question
    const randomIndex = Math.floor(Math.random() * data.length);
    return data[randomIndex];
  }

  /**
   * Start a new round (Player 1 initiates)
   */
  async startRound(
    sessionId: string,
    optionIds: string[],
    questionId?: string
  ): Promise<GameRound> {
    const supabase = this.authService.getSupabaseClient();

    // Get current session
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const roundNumber = session.current_round + 1;

    const { data, error } = await supabase
      .from('game_rounds')
      .insert({
        game_session_id: sessionId,
        round_number: roundNumber,
        selected_options: optionIds,
        question_id: questionId || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Player 1 submits their choice
   */
  async submitChoice(roundId: string, choiceId: string): Promise<void> {
    const supabase = this.authService.getSupabaseClient();
    const { error } = await supabase
      .from('game_rounds')
      .update({ player1_choice: choiceId })
      .eq('id', roundId);

    if (error) throw error;
  }

  /**
   * Player 2 submits their guess
   */
  async submitGuess(roundId: string, guessId: string): Promise<void> {
    const supabase = this.authService.getSupabaseClient();
    const { error } = await supabase
      .from('game_rounds')
      .update({ player2_guess: guessId })
      .eq('id', roundId);

    if (error) throw error;
  }

  /**
   * Get rounds for a session
   */
  async getSessionRounds(sessionId: string): Promise<GameRound[]> {
    const supabase = this.authService.getSupabaseClient();
    const { data, error } = await supabase
      .from('game_rounds')
      .select()
      .eq('game_session_id', sessionId)
      .order('round_number', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a specific round
   */
  async getRound(roundId: string): Promise<GameRound | null> {
    const supabase = this.authService.getSupabaseClient();
    const { data, error } = await supabase.from('game_rounds').select().eq('id', roundId).single();

    if (error) throw error;
    return data;
  }

  /**
   * Subscribe to session changes (for real-time updates)
   */
  subscribeToSession(sessionId: string, callback: (session: GameSession) => void) {
    const supabase = this.authService.getSupabaseClient();
    return supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          callback(payload.new as GameSession);
        }
      )
      .subscribe();
  }

  /**
   * Subscribe to round changes (for real-time updates)
   */
  subscribeToRound(roundId: string, callback: (round: GameRound) => void) {
    const supabase = this.authService.getSupabaseClient();
    return supabase
      .channel(`round:${roundId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_rounds',
          filter: `id=eq.${roundId}`,
        },
        (payload) => {
          callback(payload.new as GameRound);
        }
      )
      .subscribe();
  }

  /**
   * Generate a random 6-character session code
   */
  private generateSessionCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
