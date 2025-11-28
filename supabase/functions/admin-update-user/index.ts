import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const { user_id, email, password, full_name, username, metadata, is_admin } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update user in auth.users if email or password is provided
    if (email || password) {
      const updateData: any = {}
      if (email) updateData.email = email
      if (password) updateData.password = password

      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        user_id,
        updateData
      )

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Update user metadata if full_name or custom metadata is provided
    if (full_name || metadata) {
      const userMetadata = {
        ...(full_name && { full_name }),
        ...metadata
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        user_id,
        { user_metadata: userMetadata }
      )

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Update profile if username or is_admin is provided
    if (username !== undefined || is_admin !== undefined || full_name !== undefined) {
      const updateData: any = {}
      if (username !== undefined) updateData.username = username
      if (is_admin !== undefined) updateData.is_admin = is_admin
      if (full_name !== undefined) updateData.full_name = full_name

      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', user_id)

      if (profileUpdateError) {
        return new Response(
          JSON.stringify({ error: profileUpdateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Get updated user data
    const { data: updatedUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(user_id)

    if (getUserError) {
      return new Response(
        JSON.stringify({ error: getUserError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: updatedUser.user.id,
          email: updatedUser.user.email,
          user_metadata: updatedUser.user.user_metadata,
          updated_at: updatedUser.user.updated_at
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
