import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear cookies and storage for test isolation
    await context.clearCookies();
    await page.goto('/');
  });

  test.describe('Login', () => {
    test('should display login form', async ({ page }) => {
      await expect(page).toHaveURL('/login');
      await expect(page.getByTestId('email-input')).toBeVisible();
      await expect(page.getByTestId('password-input')).toBeVisible();
      await expect(page.getByTestId('submit-button')).toBeVisible();
      await expect(page.getByTestId('forgot-password-link')).toBeVisible();
      await expect(page.getByTestId('signup-link')).toBeVisible();
    });

    test('should navigate to signup page', async ({ page }) => {
      await page.getByTestId('signup-link').click();
      await expect(page).toHaveURL('/signup');
    });

    test('should navigate to forgot password page', async ({ page }) => {
      await page.getByTestId('forgot-password-link').click();
      await expect(page).toHaveURL('/forgot-password');
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.getByTestId('email-input').fill('invalid@example.com');
      await page.getByTestId('password-input').fill('wrongpassword');
      await page.getByTestId('submit-button').click();

      await expect(page.getByTestId('error-message')).toBeVisible();
    });

    test('should login successfully with valid credentials', async ({ page }) => {
      // Using seeded user: alice@example.com with password: password123
      await page.getByTestId('email-input').fill('alice@example.com');
      await page.getByTestId('password-input').fill('password123');
      await page.getByTestId('submit-button').click();

      // Wait for success message
      await expect(page.getByTestId('success-message')).toBeVisible();

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
      await expect(page.getByTestId('dashboard-title')).toBeVisible();
    });

    test('should disable submit button when form is invalid', async ({ page }) => {
      const submitButton = page.getByTestId('submit-button');
      await expect(submitButton).toBeDisabled();

      await page.getByTestId('email-input').fill('test@example.com');
      await expect(submitButton).toBeDisabled();

      await page.getByTestId('password-input').fill('password123');
      await expect(submitButton).toBeEnabled();
    });
  });

  test.describe('Signup', () => {
    test.beforeEach(async ({ page, context }) => {
      await context.clearCookies();
      await page.goto('/signup');
    });

    test('should display signup form', async ({ page }) => {
      await expect(page.getByTestId('email-input')).toBeVisible();
      await expect(page.getByTestId('password-input')).toBeVisible();
      await expect(page.getByTestId('confirm-password-input')).toBeVisible();
      await expect(page.getByTestId('submit-button')).toBeVisible();
      await expect(page.getByTestId('login-link')).toBeVisible();
    });

    test('should navigate to login page', async ({ page }) => {
      await page.getByTestId('login-link').click();
      await expect(page).toHaveURL('/login');
    });

    test('should show error when passwords do not match', async ({ page }) => {
      await page.getByTestId('email-input').fill('newuser@example.com');
      await page.getByTestId('password-input').fill('password123');
      await page.getByTestId('confirm-password-input').fill('different123');

      await expect(page.getByTestId('password-mismatch')).toBeVisible();
      await expect(page.getByTestId('submit-button')).toBeDisabled();
    });

    test('should create account successfully', async ({ page }) => {
      const timestamp = Date.now();
      const email = `testuser${timestamp}@example.com`;

      await page.getByTestId('email-input').fill(email);
      await page.getByTestId('password-input').fill('password123');
      await page.getByTestId('confirm-password-input').fill('password123');
      await page.getByTestId('submit-button').click();

      // Wait for success message
      await expect(page.getByTestId('success-message')).toBeVisible();

      // Should redirect to login page
      await expect(page).toHaveURL('/login', { timeout: 5000 });
    });

    test('should enforce minimum password length', async ({ page }) => {
      await page.getByTestId('email-input').fill('test@example.com');
      await page.getByTestId('password-input').fill('12345');
      await page.getByTestId('confirm-password-input').fill('12345');

      await expect(page.getByTestId('submit-button')).toBeDisabled();

      await page.getByTestId('password-input').fill('123456');
      await page.getByTestId('confirm-password-input').fill('123456');

      await expect(page.getByTestId('submit-button')).toBeEnabled();
    });
  });

  test.describe('Forgot Password', () => {
    test.beforeEach(async ({ page, context }) => {
      await context.clearCookies();
      await page.goto('/forgot-password');
    });

    test('should display forgot password form', async ({ page }) => {
      await expect(page.getByTestId('email-input')).toBeVisible();
      await expect(page.getByTestId('submit-button')).toBeVisible();
      await expect(page.getByTestId('login-link')).toBeVisible();
    });

    test('should navigate to login page', async ({ page }) => {
      await page.getByTestId('login-link').click();
      await expect(page).toHaveURL('/login');
    });

    test('should send password reset email', async ({ page }) => {
      await page.getByTestId('email-input').fill('alice@example.com');
      await page.getByTestId('submit-button').click();

      // Wait for success message
      await expect(page.getByTestId('success-message')).toBeVisible();
      await expect(page.getByTestId('success-message')).toContainText('Password reset link sent');
    });

    test('should disable submit button when email is empty', async ({ page }) => {
      const submitButton = page.getByTestId('submit-button');
      await expect(submitButton).toBeDisabled();

      await page.getByTestId('email-input').fill('test@example.com');
      await expect(submitButton).toBeEnabled();
    });
  });

  test.describe('Dashboard (Protected Route)', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL('/login?returnUrl=%2Fdashboard');
    });

    test('should display user information when authenticated', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.getByTestId('email-input').fill('alice@example.com');
      await page.getByTestId('password-input').fill('password123');
      await page.getByTestId('submit-button').click();

      // Wait for redirect to dashboard
      await expect(page).toHaveURL('/dashboard', { timeout: 5000 });

      // Check user information is displayed
      await expect(page.getByTestId('user-email')).toBeVisible();
      await expect(page.getByTestId('user-email')).toContainText('alice@example.com');
      await expect(page.getByTestId('user-id')).toBeVisible();
      await expect(page.getByTestId('user-created')).toBeVisible();
    });

    test('should sign out successfully', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.getByTestId('email-input').fill('alice@example.com');
      await page.getByTestId('password-input').fill('password123');
      await page.getByTestId('submit-button').click();

      // Wait for redirect to dashboard
      await expect(page).toHaveURL('/dashboard', { timeout: 5000 });

      // Sign out
      await page.getByTestId('signout-button').click();

      // Should redirect to login
      await expect(page).toHaveURL('/login', { timeout: 5000 });
    });

    test('should prevent access to dashboard after signout', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.getByTestId('email-input').fill('alice@example.com');
      await page.getByTestId('password-input').fill('password123');
      await page.getByTestId('submit-button').click();

      // Wait for redirect to dashboard
      await expect(page).toHaveURL('/dashboard', { timeout: 5000 });

      // Sign out
      await page.getByTestId('signout-button').click();
      await expect(page).toHaveURL('/login', { timeout: 5000 });

      // Try to access dashboard directly
      await page.goto('/dashboard');
      await expect(page).toHaveURL('/login?returnUrl=%2Fdashboard');
    });
  });

  test.describe('Complete User Journey', () => {
    test('should complete full signup and login flow', async ({ page }) => {
      const timestamp = Date.now();
      const email = `journey${timestamp}@example.com`;
      const password = 'testpassword123';

      // 1. Sign up
      await page.goto('/signup');
      await page.getByTestId('email-input').fill(email);
      await page.getByTestId('password-input').fill(password);
      await page.getByTestId('confirm-password-input').fill(password);
      await page.getByTestId('submit-button').click();

      await expect(page.getByTestId('success-message')).toBeVisible();
      await expect(page).toHaveURL('/login', { timeout: 5000 });

      // 2. Login with new account
      await page.getByTestId('email-input').fill(email);
      await page.getByTestId('password-input').fill(password);
      await page.getByTestId('submit-button').click();

      await expect(page.getByTestId('success-message')).toBeVisible();
      await expect(page).toHaveURL('/dashboard', { timeout: 5000 });

      // 3. Verify dashboard content
      await expect(page.getByTestId('user-email')).toContainText(email);
      await expect(page.getByTestId('dashboard-title')).toBeVisible();

      // 4. Sign out
      await page.getByTestId('signout-button').click();
      await expect(page).toHaveURL('/login', { timeout: 5000 });
    });
  });
});
