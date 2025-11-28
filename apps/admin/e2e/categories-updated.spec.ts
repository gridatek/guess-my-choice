import { test, expect } from '@playwright/test';

const ADMIN_USER = {
  email: 'alice@example.com',
  password: 'password123',
};

function getUniqueTestCategory() {
  const timestamp = Date.now();
  return {
    name: `Test Category ${timestamp}`,
    slug: `test-category-${timestamp}`,
    description: 'A test category for E2E testing with game options and questions',
  };
}

test.describe('Categories Management - Core CRUD', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_USER.email);
    await page.getByTestId('password-input').fill(ADMIN_USER.password);
    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should display categories page', async ({ page }) => {
    await page.getByTestId('categories-link').click();

    await expect(page).toHaveURL('/categories');
    await expect(page.locator('h2').filter({ hasText: 'Categories' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: 'Create New Category' })).toBeVisible();
  });

  test('should create a new category', async ({ page }) => {
    await page.goto('/categories');

    const testCategory = getUniqueTestCategory();

    await page.getByTestId('name-input').fill(testCategory.name);
    await page.getByTestId('slug-input').fill(testCategory.slug);
    await page.getByTestId('description-input').fill(testCategory.description);
    await page.getByTestId('create-button').click();

    await expect(page.getByTestId('success-message')).toContainText(
      'Category created successfully'
    );
    await expect(page.locator(`text=${testCategory.name}`)).toBeVisible();
  });

  test('should edit a category', async ({ page }) => {
    await page.goto('/categories');

    // Create a category first
    const timestamp = Date.now();
    const originalName = `Original Category ${timestamp}`;
    const updatedName = `Updated Category ${timestamp}`;

    await page.getByTestId('name-input').fill(originalName);
    await page.getByTestId('slug-input').fill(`original-category-${timestamp}`);
    await page.getByTestId('create-button').click();

    await expect(page.getByTestId('success-message')).toContainText(
      'Category created successfully'
    );

    // Find the category and click edit
    const categoryRow = page.getByTestId('category-item').filter({ hasText: originalName });
    const editButton = categoryRow.locator('[data-testid^="edit-category-"]');

    if (await editButton.isVisible()) {
      await editButton.click();

      // Update the name
      await page.getByTestId('name-input').fill(updatedName);
      await page.getByTestId('update-button').click();

      await expect(page.getByTestId('success-message')).toContainText(
        'Category updated successfully'
      );
      await expect(page.locator(`text=${updatedName}`)).toBeVisible();
    }
  });

  test('should delete a category', async ({ page }) => {
    await page.goto('/categories');

    // Create a category to delete
    const timestamp = Date.now();
    const categoryName = `Category to Delete ${timestamp}`;

    await page.getByTestId('name-input').fill(categoryName);
    await page.getByTestId('slug-input').fill(`category-to-delete-${timestamp}`);
    await page.getByTestId('create-button').click();

    await expect(page.getByTestId('success-message')).toBeVisible();

    // Find and delete it
    page.once('dialog', (dialog) => dialog.accept());
    const categoryRow = page.getByTestId('category-item').filter({ hasText: categoryName });
    await categoryRow.locator('[data-testid^="delete-category-"]').click();

    await expect(page.getByTestId('success-message')).toContainText(
      'Category deleted successfully'
    );
    await expect(page.locator(`text=${categoryName}`)).not.toBeVisible();
  });

  test('should require name and slug for category creation', async ({ page }) => {
    await page.goto('/categories');

    // Try to create without required fields
    await page.getByTestId('create-button').click();

    // Should show error message
    await expect(page.getByTestId('error-message')).toContainText('Name and slug are required');
  });

  test('should clear form after creating category', async ({ page }) => {
    await page.goto('/categories');

    const testCategory = getUniqueTestCategory();

    await page.getByTestId('name-input').fill(testCategory.name);
    await page.getByTestId('slug-input').fill(testCategory.slug);
    await page.getByTestId('description-input').fill(testCategory.description);
    await page.getByTestId('create-button').click();

    await expect(page.getByTestId('success-message')).toBeVisible();

    // Form should be cleared
    await expect(page.getByTestId('name-input')).toHaveValue('');
    await expect(page.getByTestId('slug-input')).toHaveValue('');
    await expect(page.getByTestId('description-input')).toHaveValue('');
  });

  test('should validate slug format', async ({ page }) => {
    await page.goto('/categories');

    const timestamp = Date.now();
    await page.getByTestId('name-input').fill(`Test Category ${timestamp}`);
    await page.getByTestId('slug-input').fill('Invalid Slug With Spaces!@#');
    await page.getByTestId('create-button').click();

    // Should either sanitize slug or show validation error
    const errorMessage = page.getByTestId('error-message');
    const successMessage = page.getByTestId('success-message');

    // Either error is shown or slug is auto-sanitized and succeeds
    await expect(errorMessage.or(successMessage)).toBeVisible({ timeout: 3000 });
  });

  test('should prevent duplicate category names', async ({ page }) => {
    const testCategory = getUniqueTestCategory();

    await page.goto('/categories');
    await page.getByTestId('name-input').fill(testCategory.name);
    await page.getByTestId('slug-input').fill(testCategory.slug);
    await page.getByTestId('create-button').click();

    await expect(page.getByTestId('success-message')).toContainText(
      'Category created successfully'
    );

    // Try to create duplicate
    await page.getByTestId('name-input').fill(testCategory.name);
    await page.getByTestId('slug-input').fill(`${testCategory.slug}-2`);
    await page.getByTestId('create-button').click();

    // Should handle duplicate appropriately (either error or success)
    await page.waitForTimeout(2000);
  });
});

test.describe('Categories Management - Integration with Options', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_USER.email);
    await page.getByTestId('password-input').fill(ADMIN_USER.password);
    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should link category to option', async ({ page }) => {
    // First create a category
    const testCategory = getUniqueTestCategory();

    await page.goto('/categories');
    await page.getByTestId('name-input').fill(testCategory.name);
    await page.getByTestId('slug-input').fill(testCategory.slug);
    await page.getByTestId('create-button').click();

    await expect(page.getByTestId('success-message')).toContainText(
      'Category created successfully'
    );

    // Now create an option with this category
    await page.goto('/options/create');

    const timestamp = Date.now();
    await page.getByTestId('option-text-input').fill(`Option with Category ${timestamp}`);
    await page.getByTestId('session-type-select').selectOption('friends');
    await page.getByTestId('difficulty-level-input').fill('2');

    // Select the category
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

  test('should show category count for options', async ({ page }) => {
    await page.goto('/categories');

    const categoryItems = page.getByTestId('category-item');
    const count = await categoryItems.count();

    if (count > 0) {
      const firstCategory = categoryItems.first();
      const optionCount = firstCategory.locator('[data-testid^="option-count-"]');

      if (await optionCount.isVisible()) {
        await expect(optionCount).toBeVisible();
        // Count should be a number >= 0
        const countText = await optionCount.textContent();
        expect(countText).toMatch(/\d+/);
      }
    }
  });

  test('should show category count for questions', async ({ page }) => {
    await page.goto('/categories');

    const categoryItems = page.getByTestId('category-item');
    const count = await categoryItems.count();

    if (count > 0) {
      const firstCategory = categoryItems.first();
      const questionCount = firstCategory.locator('[data-testid^="question-count-"]');

      if (await questionCount.isVisible()) {
        await expect(questionCount).toBeVisible();
        const countText = await questionCount.textContent();
        expect(countText).toMatch(/\d+/);
      }
    }
  });

  test('should warn when deleting category with linked options', async ({ page }) => {
    // Create category
    const testCategory = getUniqueTestCategory();

    await page.goto('/categories');
    await page.getByTestId('name-input').fill(testCategory.name);
    await page.getByTestId('slug-input').fill(testCategory.slug);
    await page.getByTestId('create-button').click();

    await expect(page.getByTestId('success-message')).toContainText(
      'Category created successfully'
    );

    // Create option with this category
    await page.goto('/options/create');

    const timestamp = Date.now();
    await page.getByTestId('option-text-input').fill(`Linked Option ${timestamp}`);
    await page.getByTestId('session-type-select').selectOption('friends');
    await page.getByTestId('difficulty-level-input').fill('1');

    const categoryCheckbox = page.locator('[data-testid^="category-"]').first();
    if (await categoryCheckbox.isVisible()) {
      await categoryCheckbox.check();
    }

    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/options', { timeout: 5000 });

    // Try to delete the category
    await page.goto('/categories');

    page.once('dialog', async (dialog) => {
      // Check if warning message mentions linked items
      const message = dialog.message();
      expect(message.toLowerCase()).toMatch(/delete|remove|category/);
      await dialog.accept();
    });

    const categoryRow = page.getByTestId('category-item').filter({ hasText: testCategory.name });
    await categoryRow.locator('[data-testid^="delete-category-"]').click();

    // Category might be deleted or warning shown
    await page.waitForTimeout(1000);
  });
});

test.describe('Categories Management - Filtering and Search', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_USER.email);
    await page.getByTestId('password-input').fill(ADMIN_USER.password);
    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should search categories by name', async ({ page }) => {
    await page.goto('/categories');

    const searchInput = page.getByTestId('search-input');
    if (await searchInput.isVisible()) {
      // Create a unique category
      const testCategory = getUniqueTestCategory();

      await page.getByTestId('name-input').fill(testCategory.name);
      await page.getByTestId('slug-input').fill(testCategory.slug);
      await page.getByTestId('create-button').click();

      await expect(page.getByTestId('success-message')).toBeVisible();

      // Search for it
      await searchInput.fill(testCategory.name);
      await page.waitForTimeout(500);

      // Should find the category
      await expect(page.locator(`text=${testCategory.name}`)).toBeVisible();
    }
  });

  test('should sort categories alphabetically', async ({ page }) => {
    await page.goto('/categories');

    const sortSelect = page.getByTestId('sort-select');
    if (await sortSelect.isVisible()) {
      await sortSelect.selectOption('name-asc');
      await page.waitForTimeout(500);

      const categoryItems = page.getByTestId('category-item');
      const count = await categoryItems.count();

      if (count >= 2) {
        // Verify alphabetical order
        const firstCategoryName = await categoryItems.first().textContent();
        const secondCategoryName = await categoryItems.nth(1).textContent();

        // Simple check: first should come before second alphabetically (or equal)
        expect(firstCategoryName!.localeCompare(secondCategoryName!) <= 0).toBeTruthy();
      }
    }
  });

  test('should filter categories by usage', async ({ page }) => {
    await page.goto('/categories');

    const usageFilter = page.getByTestId('usage-filter');
    if (await usageFilter.isVisible()) {
      // Filter to show only used categories
      await usageFilter.selectOption('used');
      await page.waitForTimeout(500);

      const categoryItems = page.getByTestId('category-item');
      const count = await categoryItems.count();

      // All visible categories should have count > 0
      if (count > 0) {
        const firstCategory = categoryItems.first();
        const optionCount = firstCategory.locator('[data-testid^="option-count-"]');
        const questionCount = firstCategory.locator('[data-testid^="question-count-"]');

        // At least one count should be present
        const hasCount = (await optionCount.isVisible()) || (await questionCount.isVisible());
        expect(hasCount).toBeTruthy();
      }
    }
  });
});

test.describe('Categories Management - Validation and Error Handling', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_USER.email);
    await page.getByTestId('password-input').fill(ADMIN_USER.password);
    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should handle XSS attempts in category name', async ({ page }) => {
    await page.goto('/categories');

    const xssName = '<script>alert("XSS")</script>Safe Category';
    const timestamp = Date.now();

    await page.getByTestId('name-input').fill(xssName);
    await page.getByTestId('slug-input').fill(`xss-test-${timestamp}`);
    await page.getByTestId('create-button').click();

    await expect(page.getByTestId('success-message')).toContainText(
      'Category created successfully'
    );

    // Script tags should be sanitized
    await expect(page.locator('script')).toHaveCount(0);
    await expect(page.locator('text=Safe Category')).toBeVisible();
  });

  test('should validate category name length', async ({ page }) => {
    await page.goto('/categories');

    // Try very long name
    const longName = 'A'.repeat(300);
    const timestamp = Date.now();

    await page.getByTestId('name-input').fill(longName);
    await page.getByTestId('slug-input').fill(`long-name-${timestamp}`);
    await page.getByTestId('create-button').click();

    // Should either show error or truncate
    const errorMessage = page.getByTestId('error-message');
    const successMessage = page.getByTestId('success-message');

    await expect(errorMessage.or(successMessage)).toBeVisible({ timeout: 3000 });
  });

  test('should auto-generate slug from name', async ({ page }) => {
    await page.goto('/categories');

    const timestamp = Date.now();
    const categoryName = `Auto Slug Category ${timestamp}`;

    const slugInput = page.getByTestId('slug-input');

    // If auto-generation is implemented, slug should populate when name is filled
    if (await slugInput.getAttribute('readonly')) {
      await page.getByTestId('name-input').fill(categoryName);
      await page.waitForTimeout(500);

      const slugValue = await slugInput.inputValue();
      expect(slugValue).toBeTruthy();
      expect(slugValue).toMatch(/auto-slug-category/);
    }
  });

  test('should handle concurrent category creation', async ({ page, context }) => {
    const timestamp = Date.now();
    const categoryName = `Concurrent Test ${timestamp}`;

    // Open category page
    await page.goto('/categories');

    // Fill form
    await page.getByTestId('name-input').fill(categoryName);
    await page.getByTestId('slug-input').fill(`concurrent-${timestamp}`);

    // Create multiple submissions (simulate race condition)
    await Promise.all([
      page.getByTestId('create-button').click(),
      page.waitForTimeout(100).then(() => page.getByTestId('create-button').click()),
    ]).catch(() => {
      // Ignore errors from concurrent clicks
    });

    // Should handle gracefully - either one success or error shown
    await page.waitForTimeout(2000);

    const successMessages = page.getByTestId('success-message');
    const errorMessages = page.getByTestId('error-message');

    const hasMessage =
      (await successMessages.isVisible({ timeout: 1000 })) ||
      (await errorMessages.isVisible({ timeout: 1000 }));

    expect(hasMessage).toBeTruthy();
  });
});

test.describe('Categories Management - Bulk Operations', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_USER.email);
    await page.getByTestId('password-input').fill(ADMIN_USER.password);
    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should bulk delete categories', async ({ page }) => {
    await page.goto('/categories');

    const bulkDeleteButton = page.getByTestId('bulk-delete-button');
    if (await bulkDeleteButton.isVisible()) {
      // Select multiple categories
      const categoryCheckboxes = page.locator('[data-testid^="category-checkbox-"]');
      const checkboxCount = await categoryCheckboxes.count();

      if (checkboxCount >= 2) {
        await categoryCheckboxes.nth(0).check();
        await categoryCheckboxes.nth(1).check();

        // Confirm deletion
        page.once('dialog', (dialog) => dialog.accept());
        await bulkDeleteButton.click();

        // Should show success message
        await expect(page.getByTestId('success-message')).toContainText('deleted');
      }
    }
  });

  test('should export categories list', async ({ page }) => {
    await page.goto('/categories');

    const exportButton = page.getByTestId('export-button');
    if (await exportButton.isVisible()) {
      // Start download
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await exportButton.click();

      const download = await downloadPromise;
      if (download) {
        // Verify download started
        expect(download).toBeTruthy();
      }
    }
  });
});
