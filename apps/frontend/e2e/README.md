# E2E Tests with Playwright

This directory contains end-to-end tests for the Angular application using [Playwright](https://playwright.dev/).

## Running Tests

```bash
# Run all tests (headless)
npm run e2e

# Run tests with UI mode (recommended for development)
npm run e2e:ui

# Run tests in headed mode (see the browser)
npm run e2e:headed

# Debug tests
npm run e2e:debug

# View test report
npm run e2e:report
```

## Writing Tests

### Basic Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Your test code here
    const element = page.locator('selector');
    await expect(element).toBeVisible();
  });
});
```

### Testing with Supabase Authentication

The backend has seeded test users you can use in your tests:

```typescript
test('should login as admin user', async ({ page }) => {
  await page.goto('/login');

  // Use seeded admin user
  await page.fill('input[name="email"]', 'alice@example.com');
  await page.fill('input[name="password"]', 'password123');

  await page.click('button[type="submit"]');

  // Verify login success
  await expect(page).toHaveURL(/dashboard/);
});
```

**Available Test Users:**
- `alice@example.com` - Admin user (`is_admin: true`)
- `bob@example.com` - Regular user
- `carol@example.com` - Regular user

Password for all: `password123`

### Testing API Calls

```typescript
test('should fetch data from Supabase', async ({ page }) => {
  // Wait for API response
  const responsePromise = page.waitForResponse('**/rest/v1/profiles*');

  await page.goto('/users');

  const response = await responsePromise;
  const data = await response.json();

  // Verify response
  expect(response.status()).toBe(200);
  expect(data).toHaveLength(3); // 3 seeded users
});
```

### Common Patterns

**Navigation:**
```typescript
await page.goto('/path');
await page.click('a[href="/about"]');
await expect(page).toHaveURL(/about/);
```

**Forms:**
```typescript
await page.fill('input[name="email"]', 'test@example.com');
await page.selectOption('select[name="role"]', 'admin');
await page.check('input[type="checkbox"]');
await page.click('button[type="submit"]');
```

**Waiting:**
```typescript
await page.waitForLoadState('networkidle');
await page.waitForSelector('.success-message');
await page.waitForURL(/dashboard/);
```

**Assertions:**
```typescript
await expect(page.locator('h1')).toContainText('Welcome');
await expect(page.locator('.error')).toBeVisible();
await expect(page).toHaveTitle(/Dashboard/);
```

## Configuration

The Playwright configuration is in `playwright.config.ts`:

- **Test directory**: `e2e/`
- **Base URL**: `http://localhost:4200`
- **Browsers**: Chromium (Firefox and WebKit available)
- **Dev server**: Automatically starts before tests
- **Timeout**: 2 minutes for dev server startup

## Best Practices

1. **Test user flows, not implementation details**
   - ✅ Test that users can login and see their dashboard
   - ❌ Test that a specific function was called

2. **Use descriptive test names**
   - ✅ `should display error when login fails with invalid credentials`
   - ❌ `test login error`

3. **Keep tests independent**
   - Each test should be able to run in isolation
   - Use `test.beforeEach()` for common setup

4. **Use the seeded test data**
   - Backend has pre-seeded users, posts, and relationships
   - Reset the database with `npm run seed` if needed

5. **Leverage Playwright's auto-waiting**
   - Playwright automatically waits for elements to be ready
   - Only use explicit waits when necessary

6. **Use locators wisely**
   - Prefer role-based selectors: `page.getByRole('button', { name: 'Submit' })`
   - Use data-testid for complex elements: `page.locator('[data-testid="user-menu"]')`
   - Avoid fragile selectors like classes that might change

## Debugging

### Visual Debugging
```bash
npm run e2e:ui     # Interactive UI mode
npm run e2e:headed # See the browser
npm run e2e:debug  # Step through tests
```

### View Traces
After a test fails, view the trace:
```bash
npm run e2e:report
```

### Screenshots and Videos
Playwright automatically captures:
- Screenshots on failure (in `test-results/`)
- Trace on first retry

## CI/CD Integration

The tests are configured to:
- Run in headless mode on CI
- Retry failed tests up to 2 times
- Run tests serially (not in parallel) for stability
- Generate HTML reports

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Locators Guide](https://playwright.dev/docs/locators)
- [Testing Library Queries](https://playwright.dev/docs/test-annotations)
