import { createClient } from 'supabase';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Basic sanitization helper (temporary - replace with proper sanitization later)
function sanitizeText(text: string): string {
  return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

function sanitizeSlug(slug: string): string {
  return slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

interface UpdatePostRequest {
  id: string;
  title?: string;
  content?: string;
  slug?: string;
  status?: 'draft' | 'published';
  tags?: string[];
  category_ids?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body: UpdatePostRequest = await req.json();

    if (!body.id) {
      return new Response(JSON.stringify({ error: 'Post ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user owns the post
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('user_id, published_at')
      .eq('id', body.id)
      .single();

    if (fetchError || !existingPost) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (existingPost.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: You can only update your own posts' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Build update object with sanitized values
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) {
      updateData.title = sanitizeText(body.title);
    }

    if (body.content !== undefined) {
      updateData.content = body.content ? sanitizeText(body.content) : null;
    }

    if (body.slug !== undefined) {
      updateData.slug = sanitizeSlug(body.slug);
    }

    if (body.status !== undefined) {
      updateData.status = body.status;
      updateData.published = body.status === 'published';
      if (body.status === 'published' && !existingPost.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }

    if (body.tags !== undefined) {
      updateData.tags = body.tags?.map((tag) => sanitizeText(tag)) || null;
    }

    // Update post
    const { error: updateError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', body.id);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update categories if provided
    if (body.category_ids !== undefined) {
      // Delete existing categories
      await supabase.from('post_categories').delete().eq('post_id', body.id);

      // Add new categories
      if (body.category_ids.length > 0) {
        const postCategories = body.category_ids.map((categoryId) => ({
          post_id: body.id,
          category_id: categoryId,
        }));

        const { error: categoryError } = await supabase
          .from('post_categories')
          .insert(postCategories);

        if (categoryError) {
          return new Response(JSON.stringify({ error: categoryError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
