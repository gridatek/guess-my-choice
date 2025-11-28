import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

export interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
}

export interface UpdateProfileRequest {
  username?: string;
  full_name?: string;
  avatar_url?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  constructor(private authService: AuthService) {}

  /**
   * Get current user's profile
   */
  async getProfile(): Promise<UserProfile | null> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('No authenticated user');
    }

    const supabase = this.authService.getSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, updated_at')
      .eq('id', user.id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Update current user's profile
   */
  async updateProfile(updates: UpdateProfileRequest): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('No authenticated user');
    }

    const supabase = this.authService.getSupabaseClient();
    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      throw error;
    }
  }

  /**
   * Update current user's password
   */
  async updatePassword(newPassword: string): Promise<void> {
    await this.authService.updatePassword(newPassword);
  }
}
