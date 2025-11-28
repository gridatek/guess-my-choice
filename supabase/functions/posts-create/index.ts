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

interface CreatePostRequest {
  title: string;
  content?: string;
  slug: string;
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
    const body: CreatePostRequest = await req.json();

    // Validate required fields
    if (!body.title || !body.slug) {
      return new Response(JSON.stringify({ error: 'Title and slug are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize content to prevent XSS (basic sanitization - TODO: enhance)
    const sanitizedTitle = sanitizeText(body.title);
    const sanitizedContent = body.content ? sanitizeText(body.content) : null;
    const sanitizedSlug = sanitizeSlug(body.slug);

    // Sanitize tags
    const sanitizedTags = body.tags?.map((tag) => sanitizeText(tag));

    // Create post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        title: sanitizedTitle,
        content: sanitizedContent,
        slug: sanitizedSlug,
        status: body.status || 'draft',
        published: body.status === 'published',
        tags: sanitizedTags || null,
        published_at: body.status === 'published' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (postError) {
      return new Response(JSON.stringify({ error: postError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Add categories if provided
    if (body.category_ids && body.category_ids.length > 0) {
      const postCategories = body.category_ids.map((categoryId) => ({
        post_id: post.id,
        category_id: categoryId,
      }));

      const { error: categoryError } = await supabase
        .from('post_categories')
        .insert(postCategories);

      if (categoryError) {
        // Delete the post if category assignment fails
        await supabase.from('posts').delete().eq('id', post.id);
        return new Response(JSON.stringify({ error: categoryError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ success: true, post }), {
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
