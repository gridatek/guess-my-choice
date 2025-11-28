import { test, expect } from '@playwright/test';

/**
 * Example E2E tests for the Angular application
 *
 * These tests demonstrate common patterns for testing with Playwright:
 * - Page navigation
 * - Element interaction
 * - Form submission
 * - API integration (with Supabase)
 */

test.describe('Example Test Suite', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear cookies and storage for test isolation
    await context.clearCookies();

    // Navigate to the app before each test
    await page.goto('/');
  });

  test('should display the application', async ({ page }) => {
    // Verify the app-root element is present
    const appRoot = page.locator('app-root');
    await expect(appRoot).toBeVisible();
  });

  test('should have correct page title', async ({ page }) => {
    // Check the page title
    await expect(page).toHaveTitle(/frontend/i);
  });

  // Example: Testing navigation (uncomment when routes are added)
  // test('should navigate to different pages', async ({ page }) => {
  //   // Click on a navigation link
  //   await page.click('a[href="/about"]');
  //
  //   // Verify URL changed
  //   await expect(page).toHaveURL(/about/);
  //
  //   // Verify content loaded
  //   await expect(page.locator('h1')).toContainText('About');
  // });

  // Example: Testing form submission (uncomment when forms are added)
  // test('should submit a form', async ({ page }) => {
  //   // Fill out a form
  //   await page.fill('input[name="email"]', 'test@example.com');
  //   await page.fill('input[name="password"]', 'password123');
  //
  //   // Submit the form
  //   await page.click('button[type="submit"]');
  //
  //   // Wait for navigation or success message
  //   await expect(page.locator('.success-message')).toBeVisible();
  // });

  // Example: Testing with Supabase authentication (uncomment when auth is implemented)
  // test('should login with valid credentials', async ({ page }) => {
  //   // Navigate to login page
  //   await page.goto('/login');
  //
  //   // Fill in login form with seeded user
  //   await page.fill('input[name="email"]', 'alice@example.com');
  //   await page.fill('input[name="password"]', 'password123');
  //
  //   // Submit form
  //   await page.click('button[type="submit"]');
  //
  //   // Wait for redirect to dashboard
  //   await expect(page).toHaveURL(/dashboard/);
  //
  //   // Verify user is logged in
  //   await expect(page.locator('.user-profile')).toContainText('Alice');
  // });

  // Example: Testing API calls (uncomment when API integration is added)
  // test('should fetch and display data from Supabase', async ({ page }) => {
  //   // Wait for API response
  //   const response = page.waitForResponse('**/rest/v1/profiles*');
  //
  //   // Navigate to page that fetches data
  //   await page.goto('/users');
  //
  //   // Wait for the response to complete
  //   await response;
  //
  //   // Verify data is displayed
  //   await expect(page.locator('.user-list')).toBeVisible();
  //   await expect(page.locator('.user-item')).toHaveCount(3); // 3 seeded users
  // });
});
