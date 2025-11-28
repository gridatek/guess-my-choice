import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { ConfigService } from './config.service';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase: SupabaseClient;

  // Using Angular signals for reactive state
  authState = signal<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  constructor(
    private router: Router,
    private configService: ConfigService
  ) {
    const config = this.configService.getConfig();
    this.supabase = createClient(config.supabase.url, config.supabase.anonKey);
    this.initializeAuth();
  }

  private async initializeAuth() {
    // Get initial session
    const {
      data: { session },
    } = await this.supabase.auth.getSession();

    this.authState.set({
      user: session?.user ?? null,
      session: session ?? null,
      loading: false,
    });

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.authState.set({
        user: session?.user ?? null,
        session: session ?? null,
        loading: false,
      });
    });
  }

  /**
   * Sign up a new user with email and password
   */
  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign out the current user
   */
  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
    this.router.navigate(['/login']);
  }

  /**
   * Send password recovery email
   */
  async resetPassword(email: string) {
    const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Update user password (after receiving reset email)
   */
  async updatePassword(newPassword: string) {
    const { data, error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Wait for auth initialization to complete
   * Returns a promise that resolves when auth state is loaded
   */
  async waitForAuthReady(): Promise<void> {
    // If already loaded, return immediately
    if (!this.authState().loading) {
      return;
    }

    // Wait for loading to complete
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!this.authState().loading) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
    });
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authState().user !== null;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.authState().user;
  }

  /**
   * Get current session
   */
  getCurrentSession(): Session | null {
    return this.authState().session;
  }

  /**
   * Get the Supabase client instance
   * Useful for making authenticated requests to Supabase
   */
  getSupabaseClient(): SupabaseClient {
    return this.supabase;
  }
}
