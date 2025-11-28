import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { ConfigService } from './config.service';

export type PostStatus = 'draft' | 'published';

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  slug: string;
  status: PostStatus;
  published: boolean;
  tags: string[] | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  categories?: Category[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePostRequest {
  title: string;
  content?: string;
  slug: string;
  status?: PostStatus;
  tags?: string[];
  category_ids?: string[];
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  slug?: string;
  status?: PostStatus;
  tags?: string[];
  category_ids?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class PostService {
  constructor(
    private authService: AuthService,
    private configService: ConfigService
  ) {}

  /**
   * Get all posts (user's own posts or published posts)
   */
  async getPosts(): Promise<Post[]> {
    const supabase = this.authService.getSupabaseClient();
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a single post by ID
   */
  async getPost(id: string): Promise<Post | null> {
    const supabase = this.authService.getSupabaseClient();
    const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new post (server-side sanitization via Edge Function)
   */
  async createPost(request: CreatePostRequest): Promise<Post> {
    const session = this.authService.getCurrentSession();
    if (!session) {
      throw new Error('No active session');
    }

    const config = this.configService.getConfig();
    const response = await fetch(`${config.supabase.url}/functions/v1/posts-create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create post');
    }

    const result = await response.json();
    return result.post;
  }

  /**
   * Update a post (server-side sanitization via Edge Function)
   */
  async updatePost(id: string, request: UpdatePostRequest): Promise<void> {
    const session = this.authService.getCurrentSession();
    if (!session) {
      throw new Error('No active session');
    }

    const config = this.configService.getConfig();
    const response = await fetch(`${config.supabase.url}/functions/v1/posts-update`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...request }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update post');
    }
  }

  /**
   * Delete a post
   */
  async deletePost(id: string): Promise<void> {
    const supabase = this.authService.getSupabaseClient();
    const { error } = await supabase.from('posts').delete().eq('id', id);

    if (error) throw error;
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    const supabase = this.authService.getSupabaseClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a category
   */
  async createCategory(name: string, slug: string, description?: string): Promise<Category> {
    const supabase = this.authService.getSupabaseClient();
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, slug, description: description || null })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<void> {
    const supabase = this.authService.getSupabaseClient();
    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) throw error;
  }

  /**
   * Get categories for a post
   */
  async getPostCategories(postId: string): Promise<Category[]> {
    const supabase = this.authService.getSupabaseClient();
    const { data, error } = await supabase
      .from('post_categories')
      .select('category_id, categories(*)')
      .eq('post_id', postId);

    if (error) throw error;
    return data?.map((pc: any) => pc.categories) || [];
  }
}
