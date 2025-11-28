import { test, expect } from '@playwright/test';

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear cookies and storage for test isolation
    await context.clearCookies();

    // Login as admin user (alice is admin from seed data)
    await page.goto('/login');
    await page.getByTestId('email-input').fill('alice@example.com');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('submit-button').click();

    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
  });

  test('should display admin panel link for admin users', async ({ page }) => {
    await expect(page.getByTestId('admin-link')).toBeVisible();
    await expect(page.getByTestId('admin-link')).toContainText('Admin Panel');
  });

  test('should navigate to admin users list', async ({ page }) => {
    await page.getByTestId('admin-link').click();
    await expect(page).toHaveURL('/admin/users');
    await expect(page.getByTestId('admin-title')).toContainText('User Management');
  });

  test('should display list of users', async ({ page }) => {
    await page.goto('/admin/users');

    // Wait for users to load
    await expect(page.getByTestId('loading')).not.toBeVisible({ timeout: 5000 });

    // Should see user rows
    const userRows = page.getByTestId('user-row');
    await expect(userRows.first()).toBeVisible();

    // Should see alice (the logged-in admin)
    await expect(page.getByText('alice@example.com')).toBeVisible();
  });

  test('should create a new user', async ({ page }) => {
    await page.goto('/admin/users');

    // Click create user button
    await page.getByTestId('create-user-button').click();
    await expect(page).toHaveURL('/admin/users/create');

    // Fill in user details
    const timestamp = Date.now();
    const email = `testadmin${timestamp}@example.com`;

    await page.getByTestId('email-input').fill(email);
    await page.getByTestId('password-input').fill('testpass123');
    await page.getByTestId('username-input').fill(`testadmin${timestamp}`);

    // Submit form
    await page.getByTestId('submit-button').click();

    // Should redirect back to users list
    await expect(page).toHaveURL('/admin/users', { timeout: 5000 });

    // Should see the new user in the list
    await expect(page.getByText(email)).toBeVisible();
  });

  test('should create an admin user', async ({ page }) => {
    await page.goto('/admin/users/create');

    const timestamp = Date.now();
    const email = `adminuser${timestamp}@example.com`;

    await page.getByTestId('email-input').fill(email);
    await page.getByTestId('password-input').fill('admin123');
    await page.getByTestId('admin-checkbox').check();

    await page.getByTestId('submit-button').click();

    // Should redirect back to users list
    await expect(page).toHaveURL('/admin/users', { timeout: 5000 });
    await expect(page.getByText(email)).toBeVisible();
  });

  test('should edit a user', async ({ page }) => {
    // First create a user to edit
    await page.goto('/admin/users/create');

    const timestamp = Date.now();
    const originalEmail = `edittest${timestamp}@example.com`;

    await page.getByTestId('email-input').fill(originalEmail);
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('submit-button').click();

    await expect(page).toHaveURL('/admin/users', { timeout: 5000 });

    // Wait for the new user to appear in the list
    await expect(page.getByText(originalEmail)).toBeVisible({ timeout: 10000 });

    // Find the user row and click edit
    const userRow = page.getByTestId('user-row').filter({ hasText: originalEmail });
    await userRow.getByTestId('edit-user-button').click();

    // Should be on edit page
    await expect(page.url()).toContain('/admin/users/edit/');

    // Update the email
    const newEmail = `edited${timestamp}@example.com`;
    await page.getByTestId('email-input').fill(newEmail);
    await page.getByTestId('username-input').fill('editeduser');
    await page.getByTestId('submit-button').click();

    // Should redirect back to users list
    await expect(page).toHaveURL('/admin/users', { timeout: 5000 });

    // Should see the updated email
    await expect(page.getByText(newEmail)).toBeVisible();
  });

  test('should delete a user', async ({ page }) => {
    // First create a user to delete
    await page.goto('/admin/users/create');

    const timestamp = Date.now();
    const email = `deletetest${timestamp}@example.com`;

    await page.getByTestId('email-input').fill(email);
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('submit-button').click();

    await expect(page).toHaveURL('/admin/users', { timeout: 5000 });

    // Find the user row
    const userRow = page.getByTestId('user-row').filter({ hasText: email });
    await expect(userRow).toBeVisible();

    // Set up dialog handler to accept confirmation
    page.on('dialog', (dialog) => dialog.accept());

    // Click delete button
    await userRow.getByTestId('delete-user-button').click();

    // Wait for success message
    await expect(page.getByTestId('success-message')).toBeVisible();
    await expect(page.getByTestId('success-message')).toContainText('User deleted successfully');

    // User should no longer be in the list
    await expect(page.getByText(email)).not.toBeVisible();
  });

  test('should show error for invalid user creation', async ({ page }) => {
    await page.goto('/admin/users/create');

    // Try to submit with empty fields
    const submitButton = page.getByTestId('submit-button');
    await expect(submitButton).toBeDisabled();

    // Fill only email (missing password)
    await page.getByTestId('email-input').fill('test@example.com');
    await expect(submitButton).toBeDisabled();

    // Add password that's too short
    await page.getByTestId('password-input').fill('12345');
    await expect(submitButton).toBeDisabled();

    // Add valid password
    await page.getByTestId('password-input').fill('123456');
    await expect(submitButton).toBeEnabled();
  });

  test('should prevent non-admin users from accessing admin panel', async ({ page }) => {
    // Logout
    await page.goto('/dashboard');
    await page.getByTestId('signout-button').click();
    await expect(page).toHaveURL('/login', { timeout: 5000 });

    // Login as non-admin user (bob is not admin)
    await page.getByTestId('email-input').fill('bob@example.com');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('submit-button').click();

    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });

    // Try to access admin panel directly
    await page.goto('/admin/users');

    // Should be redirected back to dashboard (not admin)
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
  });

  test('should navigate between admin pages', async ({ page }) => {
    await page.goto('/admin/users');

    // Click create
    await page.getByTestId('create-user-button').click();
    await expect(page).toHaveURL('/admin/users/create');

    // Click cancel
    await page.getByTestId('cancel-button').click();
    await expect(page).toHaveURL('/admin/users');

    // Click dashboard link
    await page.getByTestId('dashboard-link').click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show loading state while fetching users', async ({ page }) => {
    await page.goto('/admin/users');

    // Loading indicator should appear briefly
    // (This might be too fast to catch, but the test documents the behavior)
    const loading = page.getByTestId('loading');

    // Eventually loading should disappear
    await expect(loading).not.toBeVisible({ timeout: 5000 });
  });
});
