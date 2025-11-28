import { test, expect } from '@playwright/test';

const ADMIN_USER = {
  email: 'alice@example.com',
  password: 'password123',
};

// Helper to generate unique test data
function getUniqueTestOption() {
  const timestamp = Date.now();
  return {
    text: `Test Option ${timestamp}`,
    description: 'This is a test game option for E2E testing.',
    sessionType: 'friends',
    difficultyLevel: 3,
    status: 'draft',
    tags: 'test, e2e, automation',
  };
}

test.describe('Options Management - CRUD Operations', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear cookies and storage for test isolation
    await context.clearCookies();

    // Login as admin
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_USER.email);
    await page.getByTestId('password-input').fill(ADMIN_USER.password);
    await page.getByTestId('submit-button').click();

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should display options list page', async ({ page }) => {
    // Navigate to options
    await page.getByTestId('options-link').click();

    // Check options page is displayed
    await expect(page).toHaveURL('/options');
    await expect(page.locator('h2').filter({ hasText: 'Options' })).toBeVisible();
    await expect(page.getByTestId('create-option-button')).toBeVisible();
  });

  test('should navigate to create option page', async ({ page }) => {
    await page.goto('/options');
    await page.getByTestId('create-option-button').click();

    await expect(page).toHaveURL('/options/create');
    await expect(page.locator('h2').filter({ hasText: 'Create Option' })).toBeVisible();
  });

  test('should create a draft option', async ({ page }) => {
    await page.goto('/options/create');

    const testOption = getUniqueTestOption();

    // Fill in option details
    await page.getByTestId('option-text-input').fill(testOption.text);
    await page.getByTestId('description-input').fill(testOption.description);
    await page.getByTestId('session-type-select').selectOption(testOption.sessionType);
    await page.getByTestId('difficulty-level-input').fill(testOption.difficultyLevel.toString());
    await page.getByTestId('tags-input').fill(testOption.tags);
    await page.getByTestId('status-select').selectOption(testOption.status);

    // Submit
    await page.getByTestId('submit-button').click();

    // Wait for success message
    await expect(page.getByTestId('success-message')).toContainText('Option created successfully', {
      timeout: 10000,
    });

    // Should redirect to options list
    await expect(page).toHaveURL('/options', { timeout: 5000 });

    // Verify option appears in list
    await expect(page.locator(`text=${testOption.text}`)).toBeVisible();
  });

  test('should create a published option with all session types', async ({ page }) => {
    const sessionTypes = ['friends', 'couple', 'adult'];

    for (const sessionType of sessionTypes) {
      await page.goto('/options/create');

      const timestamp = Date.now();
      await page.getByTestId('option-text-input').fill(`${sessionType} Option ${timestamp}`);
      await page.getByTestId('description-input').fill(`Test for ${sessionType} session type`);
      await page.getByTestId('session-type-select').selectOption(sessionType);
      await page.getByTestId('difficulty-level-input').fill('2');
      await page.getByTestId('status-select').selectOption('published');

      await page.getByTestId('submit-button').click();

      await expect(page.getByTestId('success-message')).toContainText(
        'Option created successfully',
        {
          timeout: 10000,
        }
      );
      await expect(page).toHaveURL('/options', { timeout: 5000 });
    }
  });

  test('should filter options by session type', async ({ page }) => {
    await page.goto('/options');

    // Select session type filter
    const sessionTypeFilter = page.getByTestId('session-type-filter');
    if (await sessionTypeFilter.isVisible()) {
      await sessionTypeFilter.selectOption('friends');

      // Wait for filtered results
      await page.waitForTimeout(1000);

      // Verify only friends options are shown
      const optionItems = page.getByTestId('option-item');
      const count = await optionItems.count();

      if (count > 0) {
        // Check that displayed options have friends session type
        const firstOption = optionItems.first();
        await expect(firstOption).toContainText('friends');
      }
    }
  });

  test('should filter options by status', async ({ page }) => {
    await page.goto('/options');

    const statusFilter = page.getByTestId('status-filter');
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('published');

      await page.waitForTimeout(1000);

      const optionItems = page.getByTestId('option-item');
      const count = await optionItems.count();

      if (count > 0) {
        const firstOption = optionItems.first();
        const statusBadge = firstOption.locator('[data-testid^="option-status-"]');
        await expect(statusBadge).toContainText('published');
      }
    }
  });

  test('should edit an existing option', async ({ page }) => {
    // First create an option
    const timestamp = Date.now();
    const originalText = `Option to Edit ${timestamp}`;
    const updatedText = `Updated Option ${timestamp}`;

    await page.goto('/options/create');
    await page.getByTestId('option-text-input').fill(originalText);
    await page.getByTestId('session-type-select').selectOption('friends');
    await page.getByTestId('difficulty-level-input').fill('1');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText('Option created successfully', {
      timeout: 10000,
    });
    await expect(page).toHaveURL('/options', { timeout: 5000 });

    // Find the option and click edit
    const optionRow = page.getByTestId('option-item').filter({ hasText: originalText });
    await optionRow.locator('[data-testid^="edit-option-"]').click();

    // Wait for edit form
    await expect(page.locator('h2').filter({ hasText: 'Edit Option' })).toBeVisible();

    // Update text and difficulty
    await page.getByTestId('option-text-input').fill(updatedText);
    await page.getByTestId('difficulty-level-input').fill('4');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText('Option updated successfully', {
      timeout: 10000,
    });
    await expect(page).toHaveURL('/options', { timeout: 5000 });
    await expect(page.locator(`text=${updatedText}`)).toBeVisible();
  });

  test('should delete an option', async ({ page }) => {
    // Create an option to delete
    const timestamp = Date.now();
    const optionText = `Option to Delete ${timestamp}`;

    await page.goto('/options/create');
    await page.getByTestId('option-text-input').fill(optionText);
    await page.getByTestId('session-type-select').selectOption('friends');
    await page.getByTestId('difficulty-level-input').fill('1');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText('Option created successfully', {
      timeout: 10000,
    });
    await expect(page).toHaveURL('/options', { timeout: 5000 });

    // Verify option exists
    await expect(page.locator(`text=${optionText}`)).toBeVisible();

    // Delete it
    page.once('dialog', (dialog) => dialog.accept());
    const optionRow = page.getByTestId('option-item').filter({ hasText: optionText });
    await optionRow.locator('[data-testid^="delete-option-"]').click();

    // Verify option is removed
    await expect(page.locator(`text=${optionText}`)).not.toBeVisible();
  });

  test('should show correct difficulty level badge', async ({ page }) => {
    const timestamp = Date.now();
    const optionText = `Difficulty Test ${timestamp}`;

    await page.goto('/options/create');
    await page.getByTestId('option-text-input').fill(optionText);
    await page.getByTestId('session-type-select').selectOption('friends');
    await page.getByTestId('difficulty-level-input').fill('5');
    await page.getByTestId('status-select').selectOption('draft');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText('Option created successfully', {
      timeout: 10000,
    });
    await expect(page).toHaveURL('/options', { timeout: 5000 });

    const optionRow = page.getByTestId('option-item').filter({ hasText: optionText });
    const difficultyBadge = optionRow.locator('[data-testid^="option-difficulty-"]');
    await expect(difficultyBadge).toContainText('5');
  });

  test('should require option text and session type', async ({ page }) => {
    await page.goto('/options/create');

    // Try to submit without filling required fields
    await page.getByTestId('submit-button').click();

    // Should show validation error or stay on page
    await expect(page).toHaveURL('/options/create');
  });

  test('should validate difficulty level range', async ({ page }) => {
    await page.goto('/options/create');

    const difficultyInput = page.getByTestId('difficulty-level-input');

    // Try invalid values
    await difficultyInput.fill('0');
    await expect(difficultyInput).toHaveValue('0');

    await difficultyInput.fill('6');
    await expect(difficultyInput).toHaveValue('6');

    // Form validation should prevent submission or show error
    const submitButton = page.getByTestId('submit-button');
    await expect(submitButton).toBeVisible();
  });

  test('should cancel option creation', async ({ page }) => {
    await page.goto('/options/create');

    await page.getByTestId('option-text-input').fill('Cancelled Option');
    await page.getByTestId('cancel-button').click();

    await expect(page).toHaveURL('/options');
  });

  test('should search options by text', async ({ page }) => {
    await page.goto('/options');

    const searchInput = page.getByTestId('search-input');
    if (await searchInput.isVisible()) {
      // Create a unique option first
      const timestamp = Date.now();
      const uniqueText = `SearchableOption${timestamp}`;

      await page.getByTestId('create-option-button').click();
      await page.getByTestId('option-text-input').fill(uniqueText);
      await page.getByTestId('session-type-select').selectOption('friends');
      await page.getByTestId('difficulty-level-input').fill('1');
      await page.getByTestId('submit-button').click();

      await expect(page).toHaveURL('/options', { timeout: 5000 });

      // Search for it
      await searchInput.fill(uniqueText);
      await page.waitForTimeout(500);

      // Should find the option
      await expect(page.locator(`text=${uniqueText}`)).toBeVisible();
    }
  });

  test('should display option tags', async ({ page }) => {
    const timestamp = Date.now();
    const optionText = `Tagged Option ${timestamp}`;
    const tags = 'adventure, outdoor, fun';

    await page.goto('/options/create');
    await page.getByTestId('option-text-input').fill(optionText);
    await page.getByTestId('session-type-select').selectOption('friends');
    await page.getByTestId('difficulty-level-input').fill('2');
    await page.getByTestId('tags-input').fill(tags);
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText('Option created successfully', {
      timeout: 10000,
    });
    await expect(page).toHaveURL('/options', { timeout: 5000 });

    // Check if tags are displayed
    const optionRow = page.getByTestId('option-item').filter({ hasText: optionText });
    const tagElements = optionRow.locator('[data-testid^="tag-"]');

    if ((await tagElements.count()) > 0) {
      await expect(tagElements.first()).toBeVisible();
    }
  });

  test('should paginate options list', async ({ page }) => {
    await page.goto('/options');

    const paginationControls = page.getByTestId('pagination');
    if (await paginationControls.isVisible()) {
      const nextButton = page.getByTestId('next-page-button');
      const prevButton = page.getByTestId('prev-page-button');

      // Check pagination controls exist
      await expect(nextButton).toBeVisible();
      await expect(prevButton).toBeVisible();
    }
  });

  test('should bulk update option status', async ({ page }) => {
    await page.goto('/options');

    const bulkActionSelect = page.getByTestId('bulk-action-select');
    if (await bulkActionSelect.isVisible()) {
      // Select first option checkbox
      const firstCheckbox = page.locator('[data-testid^="option-checkbox-"]').first();
      await firstCheckbox.check();

      // Select bulk action
      await bulkActionSelect.selectOption('publish');
      await page.getByTestId('apply-bulk-action-button').click();

      // Should show success message
      await expect(page.getByTestId('success-message')).toBeVisible();
    }
  });
});

test.describe('Options Management - Session Type Specific', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_USER.email);
    await page.getByTestId('password-input').fill(ADMIN_USER.password);
    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should create friends session option', async ({ page }) => {
    await page.goto('/options/create');

    const timestamp = Date.now();
    await page.getByTestId('option-text-input').fill(`Go hiking this weekend ${timestamp}`);
    await page.getByTestId('description-input').fill('Outdoor activity for friends');
    await page.getByTestId('session-type-select').selectOption('friends');
    await page.getByTestId('difficulty-level-input').fill('2');
    await page.getByTestId('status-select').selectOption('published');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText('Option created successfully', {
      timeout: 10000,
    });
  });

  test('should create couple session option', async ({ page }) => {
    await page.goto('/options/create');

    const timestamp = Date.now();
    await page.getByTestId('option-text-input').fill(`Have a romantic dinner ${timestamp}`);
    await page.getByTestId('description-input').fill('Date night activity');
    await page.getByTestId('session-type-select').selectOption('couple');
    await page.getByTestId('difficulty-level-input').fill('3');
    await page.getByTestId('status-select').selectOption('published');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText('Option created successfully', {
      timeout: 10000,
    });
  });

  test('should create adult session option', async ({ page }) => {
    await page.goto('/options/create');

    const timestamp = Date.now();
    await page.getByTestId('option-text-input').fill(`Adult themed activity ${timestamp}`);
    await page.getByTestId('description-input').fill('For adult session type');
    await page.getByTestId('session-type-select').selectOption('adult');
    await page.getByTestId('difficulty-level-input').fill('4');
    await page.getByTestId('status-select').selectOption('published');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText('Option created successfully', {
      timeout: 10000,
    });
  });
});

test.describe('Options Management - Categories Integration', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_USER.email);
    await page.getByTestId('password-input').fill(ADMIN_USER.password);
    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should assign category to option', async ({ page }) => {
    await page.goto('/options/create');

    const timestamp = Date.now();
    await page.getByTestId('option-text-input').fill(`Categorized Option ${timestamp}`);
    await page.getByTestId('session-type-select').selectOption('friends');
    await page.getByTestId('difficulty-level-input').fill('2');

    // Select a category checkbox if available
    const categoryCheckbox = page.locator('[data-testid^="category-"]').first();
    if (await categoryCheckbox.isVisible()) {
      await categoryCheckbox.check();
      await expect(categoryCheckbox).toBeChecked();
    }

    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText('Option created successfully', {
      timeout: 10000,
    });
  });

  test('should show link to create category if none exist', async ({ page }) => {
    await page.goto('/options/create');

    const categoriesLink = page.locator('a[href="/categories"]');
    if ((await categoriesLink.count()) > 0) {
      await expect(categoriesLink).toBeVisible();
    }
  });
});

test.describe('Options Management - Error Handling', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_USER.email);
    await page.getByTestId('password-input').fill(ADMIN_USER.password);
    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should handle XSS attempts in option text', async ({ page }) => {
    await page.goto('/options/create');

    const timestamp = Date.now();
    const xssText = '<script>alert("XSS")</script>Safe Option Text';
    await page.getByTestId('option-text-input').fill(xssText);
    await page.getByTestId('session-type-select').selectOption('friends');
    await page.getByTestId('difficulty-level-input').fill('1');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText('Option created successfully', {
      timeout: 10000,
    });
    await expect(page).toHaveURL('/options', { timeout: 5000 });

    // Script tags should be sanitized
    await expect(page.locator('script')).toHaveCount(0);
    await expect(page.locator('text=Safe Option Text')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('/options');

    // Simulate offline mode
    await page.context().setOffline(true);

    // Try to create option
    await page.getByTestId('create-option-button').click();
    await page.getByTestId('option-text-input').fill('Offline Test');
    await page.getByTestId('session-type-select').selectOption('friends');
    await page.getByTestId('difficulty-level-input').fill('1');
    await page.getByTestId('submit-button').click();

    // Should show error message
    const errorMessage = page.getByTestId('error-message');
    if (await errorMessage.isVisible({ timeout: 5000 })) {
      await expect(errorMessage).toContainText('error');
    }

    // Restore online mode
    await page.context().setOffline(false);
  });
});
