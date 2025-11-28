#!/usr/bin/env -S deno run --allow-net --allow-env

/**
 * Test script for Edge Functions
 * Tests admin functions locally
 *
 * Usage:
 *   deno run --allow-net --allow-env test-functions.ts
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321'
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''

interface TestResult {
  name: string
  passed: boolean
  error?: string
}

const results: TestResult[] = []

function logTest(name: string, passed: boolean, error?: string) {
  results.push({ name, passed, error })
  const icon = passed ? '✅' : '❌'
  console.log(`${icon} ${name}`)
  if (error) {
    console.log(`   Error: ${error}`)
  }
}

async function login(email: string, password: string): Promise<string | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`Login failed with status ${response.status}:`, error)
      throw new Error(`Login failed (${response.status}): ${error}`)
    }

    const data = await response.json()
    if (!data.access_token) {
      console.error('Login response missing access_token:', data)
      throw new Error('Login response missing access_token')
    }
    return data.access_token
  } catch (error) {
    console.error('Login error for', email, ':', error.message)
    return null
  }
}

async function testCreateUser(token: string, testEmail: string): Promise<string | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-create-user`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: 'testPassword123',
        full_name: 'Test User',
        username: 'testuser',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Create user failed')
    }

    if (!data.success) {
      throw new Error('Response does not indicate success')
    }

    logTest('Create User', true)
    return data.user.id
  } catch (error) {
    logTest('Create User', false, error.message)
    return null
  }
}

async function testListUsers(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-list-users`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'List users failed')
    }

    if (!data.success || !Array.isArray(data.users)) {
      throw new Error('Invalid response format')
    }

    logTest(`List Users (found ${data.users.length})`, true)
    return true
  } catch (error) {
    logTest('List Users', false, error.message)
    return false
  }
}

async function testUpdateUser(token: string, userId: string): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-update-user`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        full_name: 'Updated Test User',
        username: 'updateduser',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Update user failed')
    }

    if (!data.success) {
      throw new Error('Response does not indicate success')
    }

    logTest('Update User', true)
    return true
  } catch (error) {
    logTest('Update User', false, error.message)
    return false
  }
}

async function testDeleteUser(token: string, userId: string): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-delete-user`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Delete user failed')
    }

    if (!data.success) {
      throw new Error('Response does not indicate success')
    }

    logTest('Delete User', true)
    return true
  } catch (error) {
    logTest('Delete User', false, error.message)
    return false
  }
}

async function testUnauthorizedAccess(): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-create-user`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    })

    let data
    try {
      data = await response.json()
    } catch (e) {
      throw new Error(`Failed to parse response (status ${response.status}): ${e.message}`)
    }

    if (response.status === 401 && data.error) {
      logTest('Unauthorized Access Prevention', true)
      return true
    } else {
      console.error('Unexpected response:', { status: response.status, data })
      throw new Error(`Should have rejected unauthorized request (got status ${response.status}, data: ${JSON.stringify(data)})`)
    }
  } catch (error) {
    logTest('Unauthorized Access Prevention', false, error.message)
    return false
  }
}

async function testNonAdminAccess(email: string, password: string): Promise<boolean> {
  try {
    // Login as non-admin user
    const token = await login(email, password)
    if (!token) {
      throw new Error('Failed to login as non-admin user')
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-create-user`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    })

    const data = await response.json()

    if (response.status === 403 && data.error) {
      logTest('Non-Admin Access Prevention', true)
      return true
    } else {
      throw new Error(`Should have rejected non-admin request (got status ${response.status})`)
    }
  } catch (error) {
    logTest('Non-Admin Access Prevention', false, error.message)
    return false
  }
}

async function main() {
  console.log('🧪 Testing Edge Functions\n')
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`)
  console.log(`🔑 API Key: ${SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'NOT SET'}\n`)

  // Validate environment
  if (!SUPABASE_URL) {
    console.error('❌ SUPABASE_URL is not set')
    Deno.exit(1)
  }
  if (!SUPABASE_ANON_KEY) {
    console.error('❌ SUPABASE_ANON_KEY is not set')
    Deno.exit(1)
  }

  // Test 0: Verify Edge Functions endpoint is accessible
  console.log('Verifying Edge Functions are accessible...')
  try {
    const testResponse = await fetch(`${SUPABASE_URL}/functions/v1/admin-create-user`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })
    console.log(`✅ Edge Functions endpoint responding (status: ${testResponse.status})\n`)
  } catch (error) {
    console.error('❌ Cannot reach Edge Functions endpoint:', error.message)
    console.error('Make sure Supabase is running and Edge Functions are deployed')
    Deno.exit(1)
  }

  // Test 1: Unauthorized access
  console.log('Testing security...')
  await testUnauthorizedAccess()

  // Test 2: Login as admin
  console.log('\nLogging in as admin...')
  const adminToken = await login('alice@example.com', 'password123')

  if (!adminToken) {
    console.error('❌ Failed to login as admin.')
    console.error('   Checking if users exist in database...')

    // Try to check if users exist via REST API
    try {
      const checkUsers = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=username,is_admin`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      })
      const profiles = await checkUsers.json()
      console.error('   Profiles in database:', JSON.stringify(profiles, null, 2))
    } catch (e) {
      console.error('   Could not check profiles:', e.message)
    }

    Deno.exit(1)
  }

  console.log('✅ Logged in as admin\n')

  // Test 3: Non-admin access
  console.log('Testing non-admin access...')
  await testNonAdminAccess('bob@example.com', 'password123')

  // Test 4: Create user
  console.log('\nTesting admin functions...')
  const testEmail = `test${Date.now()}@example.com`
  const userId = await testCreateUser(adminToken, testEmail)

  // Test 5: Update user
  if (userId) {
    await testUpdateUser(adminToken, userId)
  }

  // Test 6: List users
  await testListUsers(adminToken)

  // Test 7: Delete user
  if (userId) {
    await testDeleteUser(adminToken, userId)
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Test Summary\n')

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length

  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`)

  if (failed > 0) {
    console.log('\n❌ Some tests failed:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`)
    })
    Deno.exit(1)
  } else {
    console.log('\n✅ All tests passed!')
    Deno.exit(0)
  }
}

// Run tests
main()
