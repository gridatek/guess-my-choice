/**
 * Seed test users using Supabase Admin API
 * This ensures passwords are hashed correctly and compatible with GoTrue
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321';
const serviceRoleKey =
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

console.log('🔧 Configuration:');
console.log('  Supabase URL:', supabaseUrl);
console.log('  Service Role Key length:', serviceRoleKey.length);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const testUsers = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    email: 'alice@example.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: {
      full_name: 'Alice Johnson',
    },
    profile: {
      username: 'alice',
      bio: 'Software engineer passionate about web development',
      website: 'https://alice.dev',
      is_admin: true,
    },
  },
  {
    id: 'b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    email: 'bob@example.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: {
      full_name: 'Bob Smith',
    },
    profile: {
      username: 'bob',
      bio: 'Designer & creative developer',
      website: 'https://bobdesigns.com',
      is_admin: false,
    },
  },
  {
    id: 'c2ffbc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    email: 'carol@example.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: {
      full_name: 'Carol Williams',
    },
    profile: {
      username: 'carol',
      bio: 'Product manager and tech enthusiast',
      website: 'https://carol.tech',
      is_admin: false,
    },
  },
];

console.log('🌱 Seeding test users via Admin API...');
console.log(`📍 Supabase URL: ${supabaseUrl}`);

for (const userData of testUsers) {
  console.log(`\n👤 Creating user: ${userData.email}`);

  try {
    // Create user via Admin API (this will properly hash the password)
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: userData.email_confirm,
      user_metadata: userData.user_metadata,
      // Use the specific ID so we can reference it later
      // Note: This requires user_id to be passed, but some versions don't support it
      // If this fails, remove the id field
    });

    if (createError) {
      // User might already exist - try to update instead
      console.log(`⚠️  User might exist, attempting to update: ${createError.message}`);

      // List users to find the existing one
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users?.users.find((u) => u.email === userData.email);

      if (existingUser) {
        console.log(`🔄 Updating existing user: ${existingUser.id}`);

        // Update the user's password and metadata
        const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
          password: userData.password,
          email_confirm: userData.email_confirm,
          user_metadata: userData.user_metadata,
        });

        if (updateError) {
          console.error(`❌ Failed to update user: ${updateError.message}`);
          continue;
        }

        // Update the profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            username: userData.profile.username,
            bio: userData.profile.bio,
            website: userData.profile.website,
            is_admin: userData.profile.is_admin,
          })
          .eq('id', existingUser.id);

        if (profileError) {
          console.error(`❌ Failed to update profile: ${profileError.message}`);
        } else {
          console.log(`✅ User updated successfully`);
        }
      } else {
        console.error(`❌ Failed to create user and couldn't find existing user`);
      }
    } else {
      console.log(`✅ User created: ${user.user.id}`);

      // Update profile with additional fields
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: userData.profile.username,
          bio: userData.profile.bio,
          website: userData.profile.website,
          is_admin: userData.profile.is_admin,
        })
        .eq('id', user.user.id);

      if (profileError) {
        console.error(`❌ Failed to update profile: ${profileError.message}`);
      }
    }
  } catch (error) {
    console.error(`❌ Unexpected error: ${error}`);
  }
}

console.log('\n✅ User seeding complete!');
