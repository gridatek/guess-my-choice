import { test, expect } from '@playwright/test';

test.describe('Application', () => {
  test('should load the homepage', async ({ page, context }) => {
    // Clear cookies and storage for test isolation
    await context.clearCookies();

    // Navigate to the application
    await page.goto('/');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Check that the page loaded successfully
    await expect(page).toHaveTitle(/frontend/i);
  });

  test('should have working navigation', async ({ page, context }) => {
    // Clear cookies and storage for test isolation
    await context.clearCookies();

    await page.goto('/');

    // Check if the main app component is rendered
    const appElement = page.locator('app-root');
    await expect(appElement).toBeVisible();
  });
});
