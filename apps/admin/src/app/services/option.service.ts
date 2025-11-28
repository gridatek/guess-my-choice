import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

export type SessionType = 'friends' | 'couple' | 'adult';
export type OptionStatus = 'draft' | 'published' | 'archived';

export interface Option {
  id: string;
  user_id: string;
  option_text: string;
  description: string | null;
  session_type: SessionType;
  difficulty_level: number;
  status: OptionStatus;
  tags: string[] | null;
  metadata: any;
  view_count: number;
  created_at: string;
  updated_at: string;
  categories?: OptionCategory[];
}

export interface Question {
  id: string;
  user_id: string;
  question_text: string;
  description: string | null;
  session_type: SessionType;
  status: OptionStatus;
  tags: string[] | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface OptionCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateOptionRequest {
  option_text: string;
  description?: string;
  session_type: SessionType;
  difficulty_level?: number;
  status?: OptionStatus;
  tags?: string[];
  category_ids?: string[];
}

export interface UpdateOptionRequest {
  option_text?: string;
  description?: string;
  session_type?: SessionType;
  difficulty_level?: number;
  status?: OptionStatus;
  tags?: string[];
  category_ids?: string[];
}

export interface CreateQuestionRequest {
  question_text: string;
  description?: string;
  session_type: SessionType;
  status?: OptionStatus;
  tags?: string[];
}

export interface UpdateQuestionRequest {
  question_text?: string;
  description?: string;
  session_type?: SessionType;
  status?: OptionStatus;
  tags?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class OptionService {
  constructor(private authService: AuthService) {}

  /**
   * Get all options (admins see all, regular users see published only)
   */
  async getOptions(): Promise<Option[]> {
    const supabase = this.authService.getSupabaseClient();
    const { data, error } = await supabase
      .from('options')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a single option by ID
   */
  async getOption(id: string): Promise<Option | null> {
    const supabase = this.authService.getSupabaseClient();
    const { data, error } = await supabase.from('options').select('*').eq('id', id).single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new option (direct DB insert with RLS)
   */
  async createOption(request: CreateOptionRequest): Promise<Option> {
    const supabase = this.authService.getSupabaseClient();
    const user = await this.authService.getCurrentUser();

    if (!user) {
      throw new Error('No active user');
    }

    // Create option
    const { data: option, error: optionError } = await supabase
      .from('options')
      .insert({
        user_id: user.id,
        option_text: request.option_text,
        description: request.description || null,
        session_type: request.session_type,
        difficulty_level: request.difficulty_level || 1,
        status: request.status || 'draft',
        tags: request.tags || null,
      })
      .select()
      .single();

    if (optionError) throw optionError;

    // Add categories if provided
    if (request.category_ids && request.category_ids.length > 0) {
      const assignments = request.category_ids.map((categoryId) => ({
        option_id: option.id,
        option_category_id: categoryId,
      }));

      const { error: categoryError } = await supabase
        .from('option_category_assignments')
        .insert(assignments);

      if (categoryError) {
        // Delete the option if category assignment fails
        await supabase.from('options').delete().eq('id', option.id);
        throw categoryError;
      }
    }

    return option;
  }

  /**
   * Update an option (direct DB update with RLS)
   */
  async updateOption(id: string, request: UpdateOptionRequest): Promise<void> {
    const supabase = this.authService.getSupabaseClient();

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (request.option_text !== undefined) updateData.option_text = request.option_text;
    if (request.description !== undefined) updateData.description = request.description || null;
    if (request.session_type !== undefined) updateData.session_type = request.session_type;
    if (request.difficulty_level !== undefined)
      updateData.difficulty_level = request.difficulty_level;
    if (request.status !== undefined) updateData.status = request.status;
    if (request.tags !== undefined) updateData.tags = request.tags || null;

    // Update option
    const { error: updateError } = await supabase.from('options').update(updateData).eq('id', id);

    if (updateError) throw updateError;

    // Update categories if provided
    if (request.category_ids !== undefined) {
      // Delete existing assignments
      await supabase.from('option_category_assignments').delete().eq('option_id', id);

      // Add new assignments
      if (request.category_ids.length > 0) {
        const assignments = request.category_ids.map((categoryId) => ({
          option_id: id,
          option_category_id: categoryId,
        }));

        const { error: categoryError } = await supabase
          .from('option_category_assignments')
          .insert(assignments);

        if (categoryError) throw categoryError;
      }
    }
  }

  /**
   * Delete an option
   */
  async deleteOption(id: string): Promise<void> {
    const supabase = this.authService.getSupabaseClient();
    const { error } = await supabase.from('options').delete().eq('id', id);

    if (error) throw error;
  }

  /**
   * Get all option categories
   */
  async getCategories(): Promise<OptionCategory[]> {
    const supabase = this.authService.getSupabaseClient();
    const { data, error } = await supabase
      .from('option_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a category
   */
  async createCategory(
    name: string,
    slug: string,
    description?: string
  ): Promise<OptionCategory> {
    const supabase = this.authService.getSupabaseClient();
    const { data, error } = await supabase
      .from('option_categories')
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
    const { error } = await supabase.from('option_categories').delete().eq('id', id);

    if (error) throw error;
  }

  /**
   * Get categories for an option
   */
  async getOptionCategories(optionId: string): Promise<OptionCategory[]> {
    const supabase = this.authService.getSupabaseClient();
    const { data, error } = await supabase
      .from('option_category_assignments')
      .select('option_category_id, option_categories(*)')
      .eq('option_id', optionId);

    if (error) throw error;
    return data?.map((oc: any) => oc.option_categories) || [];
  }

  /**
   * Get all questions
   */
  async getQuestions(): Promise<Question[]> {
    const supabase = this.authService.getSupabaseClient();
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a single question by ID
   */
  async getQuestion(id: string): Promise<Question | null> {
    const supabase = this.authService.getSupabaseClient();
    const { data, error } = await supabase.from('questions').select('*').eq('id', id).single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new question
   */
  async createQuestion(request: CreateQuestionRequest): Promise<Question> {
    const supabase = this.authService.getSupabaseClient();
    const user = await this.authService.getCurrentUser();

    if (!user) {
      throw new Error('No active user');
    }

    const { data, error } = await supabase
      .from('questions')
      .insert({
        user_id: user.id,
        question_text: request.question_text,
        description: request.description || null,
        session_type: request.session_type,
        status: request.status || 'draft',
        tags: request.tags || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a question
   */
  async updateQuestion(id: string, request: UpdateQuestionRequest): Promise<void> {
    const supabase = this.authService.getSupabaseClient();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (request.question_text !== undefined) updateData.question_text = request.question_text;
    if (request.description !== undefined) updateData.description = request.description || null;
    if (request.session_type !== undefined) updateData.session_type = request.session_type;
    if (request.status !== undefined) updateData.status = request.status;
    if (request.tags !== undefined) updateData.tags = request.tags || null;

    const { error } = await supabase.from('questions').update(updateData).eq('id', id);

    if (error) throw error;
  }

  /**
   * Delete a question
   */
  async deleteQuestion(id: string): Promise<void> {
    const supabase = this.authService.getSupabaseClient();
    const { error } = await supabase.from('questions').delete().eq('id', id);

    if (error) throw error;
  }
}
