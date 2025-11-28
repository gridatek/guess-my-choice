import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { ConfigService } from './config.service';

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  full_name?: string;
  username?: string;
  is_admin?: boolean;
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  full_name?: string;
  username?: string;
  is_admin?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private get functionsUrl(): string {
    const config = this.configService.getConfig();
    return `${config.supabase.url}/functions/v1`;
  }

  constructor(
    private authService: AuthService,
    private configService: ConfigService
  ) {}

  private async callFunction<T>(
    functionName: string,
    method: string = 'POST',
    body?: any
  ): Promise<T> {
    const session = this.authService.getCurrentSession();
    if (!session) {
      throw new Error('No active session');
    }

    const response = await fetch(`${this.functionsUrl}/${functionName}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  /**
   * List all users (admin only)
   */
  async listUsers(): Promise<AdminUser[]> {
    const result = await this.callFunction<{ success: boolean; users: AdminUser[] }>(
      'admin-list-users',
      'GET'
    );
    return result.users;
  }

  /**
   * Create a new user (admin only)
   */
  async createUser(request: CreateUserRequest): Promise<{ id: string; email: string }> {
    const result = await this.callFunction<{ success: boolean; user: any }>(
      'admin-create-user',
      'POST',
      request
    );
    return result.user;
  }

  /**
   * Update a user (admin only)
   */
  async updateUser(userId: string, request: UpdateUserRequest): Promise<void> {
    await this.callFunction<{ success: boolean }>('admin-update-user', 'POST', {
      user_id: userId,
      ...request,
    });
  }

  /**
   * Delete a user (admin only)
   */
  async deleteUser(userId: string): Promise<void> {
    await this.callFunction<{ success: boolean }>('admin-delete-user', 'POST', {
      user_id: userId,
    });
  }
}
