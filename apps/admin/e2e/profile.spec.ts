import { test, expect } from '@playwright/test';

test.describe('User Profile', () => {
  let testUser: { email: string; password: string } | null = null;

  test.beforeEach(async ({ page, context }) => {
    // Clear storage before each test for isolation
    await context.clearCookies();

    // Create a dedicated test user for profile tests to avoid modifying seeded users
    const timestamp = Date.now();
    const email = `profiletest${timestamp}@example.com`;
    const password = 'password123';

    // Create user via signup
    await page.goto('/signup');
    await page.getByTestId('email-input').fill(email);
    await page.getByTestId('password-input').fill(password);
    await page.getByTestId('confirm-password-input').fill(password);
    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/login', { timeout: 5000 });

    // Login with the new user
    await page.getByTestId('email-input').fill(email);
    await page.getByTestId('password-input').fill(password);
    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });

    testUser = { email, password };
  });

  // Helper to create a dedicated user for password update tests
  async function createPasswordTestUser(page: any): Promise<{ email: string; password: string }> {
    const timestamp = Date.now();
    const email = `pwdtest${timestamp}@example.com`;
    const password = 'password123';

    // Logout current user
    await page.getByTestId('signout-button').click();
    await expect(page).toHaveURL('/login', { timeout: 5000 });

    // Create new user
    await page.goto('/signup');
    await page.getByTestId('email-input').fill(email);
    await page.getByTestId('password-input').fill(password);
    await page.getByTestId('confirm-password-input').fill(password);
    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/login', { timeout: 5000 });

    // Login with new user
    await page.getByTestId('email-input').fill(email);
    await page.getByTestId('password-input').fill(password);
    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });

    return { email, password };
  }

  test('should display edit profile link in dashboard', async ({ page }) => {
    await expect(page.getByTestId('profile-link')).toBeVisible();
    await expect(page.getByTestId('profile-link')).toContainText('Edit Profile');
  });

  test('should navigate to profile edit page', async ({ page }) => {
    await page.getByTestId('profile-link').click();
    await expect(page).toHaveURL('/profile');
    await expect(page.getByText('Edit Your Profile')).toBeVisible();
  });

  test('should load user email (read-only)', async ({ page }) => {
    await page.goto('/profile');

    // Wait for loading to complete
    await expect(page.getByTestId('loading')).not.toBeVisible({ timeout: 5000 });

    // Email should be displayed and disabled
    const emailInput = page.getByTestId('email-input');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toBeDisabled();
    if (testUser) {
      await expect(emailInput).toHaveValue(testUser.email);
    }
  });

  test('should update username and full name', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByTestId('loading')).not.toBeVisible({ timeout: 5000 });

    // Fill in profile fields
    const timestamp = Date.now();
    await page.getByTestId('username-input').fill(`bob_${timestamp}`);
    await page.getByTestId('fullname-input').fill('Bob Smith');

    // Submit form
    await page.getByTestId('submit-button').click();

    // Should see success message
    await expect(page.getByTestId('success-message')).toBeVisible();
    await expect(page.getByTestId('success-message')).toContainText('Profile updated successfully');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 3000 });
  });

  test('should update password', async ({ page }) => {
    // Create dedicated user for password testing (avoid modifying shared test user)
    const user = await createPasswordTestUser(page);

    await page.goto('/profile');
    await expect(page.getByTestId('loading')).not.toBeVisible({ timeout: 5000 });

    const newPassword = 'newpassword123';

    // Fill in password fields
    await page.getByTestId('password-input').fill(newPassword);
    await page.getByTestId('confirm-password-input').fill(newPassword);

    // Submit form
    await page.getByTestId('submit-button').click();

    // Should see success message
    await expect(page.getByTestId('success-message')).toBeVisible();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 3000 });

    // Verify can login with new password
    await page.getByTestId('signout-button').click();
    await expect(page).toHaveURL('/login', { timeout: 5000 });

    // Login with new password
    await page.getByTestId('email-input').fill(user.email);
    await page.getByTestId('password-input').fill(newPassword);
    await page.getByTestId('submit-button').click();

    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
  });

  test('should show password mismatch error', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByTestId('loading')).not.toBeVisible({ timeout: 5000 });

    // Enter mismatched passwords
    await page.getByTestId('password-input').fill('newpassword123');
    await page.getByTestId('confirm-password-input').fill('differentpassword');

    // Should show mismatch message
    await expect(page.getByTestId('password-mismatch')).toBeVisible();
    await expect(page.getByTestId('password-mismatch')).toContainText('Passwords do not match');

    // Submit button should be disabled
    await expect(page.getByTestId('submit-button')).toBeDisabled();
  });

  test('should allow updating profile without changing password', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByTestId('loading')).not.toBeVisible({ timeout: 5000 });

    const timestamp = Date.now();

    // Update only username (leave password blank)
    await page.getByTestId('username-input').fill(`bob_no_pwd_${timestamp}`);

    // Submit form without filling password fields
    await page.getByTestId('submit-button').click();

    // Should see success message
    await expect(page.getByTestId('success-message')).toBeVisible();
    await expect(page).toHaveURL('/dashboard', { timeout: 3000 });
  });

  test('should cancel and return to dashboard', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByTestId('loading')).not.toBeVisible({ timeout: 5000 });

    // Click cancel button
    await page.getByTestId('cancel-button').click();

    // Should return to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should require minimum password length', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByTestId('loading')).not.toBeVisible({ timeout: 5000 });

    // Enter password that's too short
    const passwordInput = page.getByTestId('password-input');
    await passwordInput.fill('12345');

    // Check HTML5 validation (minlength attribute)
    const validationMessage = await passwordInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );

    // Should have validation message or be invalid
    expect(validationMessage).toBeTruthy();
  });

  test('should update profile with both username and password', async ({ page }) => {
    // Create dedicated user for password testing (avoid modifying shared test user)
    const user = await createPasswordTestUser(page);

    await page.goto('/profile');
    await expect(page.getByTestId('loading')).not.toBeVisible({ timeout: 5000 });

    const timestamp = Date.now();
    const newPassword = `temppass${timestamp}`;

    // Update username, full name, and password
    await page.getByTestId('username-input').fill(`testuser_full_${timestamp}`);
    await page.getByTestId('fullname-input').fill('Test User Complete Update');
    await page.getByTestId('password-input').fill(newPassword);
    await page.getByTestId('confirm-password-input').fill(newPassword);

    // Submit form
    await page.getByTestId('submit-button').click();

    // Should see success message
    await expect(page.getByTestId('success-message')).toBeVisible();
    await expect(page).toHaveURL('/dashboard', { timeout: 3000 });

    // Verify can login with new password
    await page.getByTestId('signout-button').click();
    await page.getByTestId('email-input').fill(user.email);
    await page.getByTestId('password-input').fill(newPassword);
    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
  });

  test('should require authentication to access profile page', async ({ page }) => {
    // Logout first
    await page.getByTestId('signout-button').click();
    await expect(page).toHaveURL('/login', { timeout: 5000 });

    // Try to access profile page
    await page.goto('/profile');

    // Should be redirected to login
    await expect(page).toHaveURL('/login?returnUrl=%2Fprofile');
  });
});
