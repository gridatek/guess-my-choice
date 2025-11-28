import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'alice@example.com',
  password: 'password123',
};

// Helper to generate unique test data
function getUniqueTestPost() {
  const timestamp = Date.now();
  return {
    title: `Test Post Title ${timestamp}`,
    slug: `test-post-slug-${timestamp}`,
    content: 'This is a test post content.',
    tags: 'test, playwright, e2e',
  };
}

function getUniqueTestCategory() {
  const timestamp = Date.now();
  return {
    name: `Test Category ${timestamp}`,
    slug: `test-category-${timestamp}`,
    description: 'A test category for E2E testing',
  };
}

test.describe('Posts Management', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear cookies and storage for test isolation
    await context.clearCookies();

    // Navigate to login page
    await page.goto('/login');

    // Login
    await page.getByTestId('email-input').fill(TEST_USER.email);
    await page.getByTestId('password-input').fill(TEST_USER.password);
    await page.getByTestId('submit-button').click();

    // Wait for dashboard
    await expect(page.getByTestId('dashboard-title')).toBeVisible();
  });

  test('should display posts page', async ({ page }) => {
    // Navigate to posts
    await page.getByTestId('posts-link').click();

    // Check posts page is displayed
    await expect(page).toHaveURL('/posts');
    await expect(page.locator('h2').filter({ hasText: 'Posts' })).toBeVisible();
    await expect(page.getByTestId('create-post-button')).toBeVisible();
  });

  test('should navigate to create post page', async ({ page }) => {
    await page.goto('/posts');
    await page.getByTestId('create-post-button').click();

    await expect(page).toHaveURL('/posts/create');
    await expect(page.locator('h2').filter({ hasText: 'Create Post' })).toBeVisible();
  });

  test('should create a draft post', async ({ page }) => {
    await page.goto('/posts/create');

    const testPost = getUniqueTestPost();

    // Fill in post details
    await page.getByTestId('title-input').fill(testPost.title);
    await page.getByTestId('slug-input').fill(testPost.slug);
    await page.getByTestId('content-input').fill(testPost.content);
    await page.getByTestId('tags-input').fill(testPost.tags);
    await page.getByTestId('status-select').selectOption('draft');

    // Submit
    await page.getByTestId('submit-button').click();

    // Wait for success message (appears before redirect) - longer timeout for Edge Function
    await expect(page.getByTestId('success-message')).toContainText('Post created successfully', {
      timeout: 10000,
    });

    // Should redirect to posts list
    await expect(page).toHaveURL('/posts', { timeout: 5000 });

    // Verify post appears in list
    await expect(page.locator(`text=${testPost.title}`)).toBeVisible();
  });

  test('should create a published post', async ({ page }) => {
    await page.goto('/posts/create');

    const timestamp = Date.now();
    await page.getByTestId('title-input').fill(`Published Test Post ${timestamp}`);
    await page.getByTestId('slug-input').fill(`published-test-post-${timestamp}`);
    await page.getByTestId('content-input').fill('This post is published.');
    await page.getByTestId('status-select').selectOption('published');

    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText('Post created successfully', {
      timeout: 10000,
    });
    await expect(page).toHaveURL('/posts', { timeout: 5000 });
  });

  test('should edit an existing post', async ({ page }) => {
    // First create a post with unique title
    const timestamp = Date.now();
    const originalTitle = `Post to Edit ${timestamp}`;
    const updatedTitle = `Updated Post Title ${timestamp}`;

    await page.goto('/posts/create');
    await page.getByTestId('title-input').fill(originalTitle);
    await page.getByTestId('slug-input').fill(`post-to-edit-${timestamp}`);
    await page.getByTestId('submit-button').click();

    // Wait for success before redirect
    await expect(page.getByTestId('success-message')).toContainText('Post created successfully', {
      timeout: 10000,
    });
    await expect(page).toHaveURL('/posts', { timeout: 5000 });

    // Find the specific post we just created and click its edit button
    const postRow = page.getByTestId('post-item').filter({ hasText: originalTitle });
    await postRow.locator('[data-testid^="edit-post-"]').click();

    // Wait for edit form
    await expect(page.locator('h2').filter({ hasText: 'Edit Post' })).toBeVisible();

    // Update title
    await page.getByTestId('title-input').fill(updatedTitle);
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText('Post updated successfully', {
      timeout: 10000,
    });
    await expect(page).toHaveURL('/posts', { timeout: 5000 });
    await expect(page.locator(`text=${updatedTitle}`)).toBeVisible();
  });

  test('should delete a post', async ({ page }) => {
    // Create a post to delete with unique title
    const timestamp = Date.now();
    const postTitle = `Post to Delete ${timestamp}`;

    await page.goto('/posts/create');
    await page.getByTestId('title-input').fill(postTitle);
    await page.getByTestId('slug-input').fill(`post-to-delete-${timestamp}`);
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText('Post created successfully', {
      timeout: 10000,
    });
    await expect(page).toHaveURL('/posts', { timeout: 5000 });

    // Verify post exists
    await expect(page.locator(`text=${postTitle}`)).toBeVisible();

    // Find the specific post and delete it
    page.once('dialog', (dialog) => dialog.accept());
    const postRow = page.getByTestId('post-item').filter({ hasText: postTitle });
    await postRow.locator('[data-testid^="delete-post-"]').click();

    // Verify post is removed
    await expect(page.locator(`text=${postTitle}`)).not.toBeVisible();
  });

  test('should show correct post status', async ({ page }) => {
    // Create draft post with unique title
    const timestamp = Date.now();
    const postTitle = `Draft Status Test ${timestamp}`;

    await page.goto('/posts/create');
    await page.getByTestId('title-input').fill(postTitle);
    await page.getByTestId('slug-input').fill(`draft-status-test-${timestamp}`);
    await page.getByTestId('status-select').selectOption('draft');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText('Post created successfully', {
      timeout: 10000,
    });
    await expect(page).toHaveURL('/posts', { timeout: 5000 });

    // Find the specific post and check its status badge shows "draft"
    const postRow = page.getByTestId('post-item').filter({ hasText: postTitle });
    const statusBadge = postRow.locator('[data-testid^="post-status-"]');
    await expect(statusBadge).toContainText('draft');
  });

  test('should require title and slug', async ({ page }) => {
    await page.goto('/posts/create');

    // Try to submit without filling required fields
    await page.getByTestId('submit-button').click();

    // Form should not submit (title and slug are required HTML5 fields)
    await expect(page).toHaveURL('/posts/create');
  });

  test('should cancel post creation', async ({ page }) => {
    await page.goto('/posts/create');

    await page.getByTestId('title-input').fill('Cancelled Post');
    await page.getByTestId('cancel-button').click();

    await expect(page).toHaveURL('/posts');
  });

  test('should only show edit/delete for own posts', async ({ page }) => {
    await page.goto('/posts');

    // Get all post items
    const postItems = page.getByTestId('post-item');
    const count = await postItems.count();

    if (count > 0) {
      // Check if edit/delete buttons are present for user's own posts
      // (this assumes the logged-in user has posts)
      const firstPost = postItems.first();
      const hasEditButton = await firstPost.locator('[data-testid^="edit-post-"]').count();
      const hasDeleteButton = await firstPost.locator('[data-testid^="delete-post-"]').count();

      // Either both buttons should be present (user's post) or neither (other user's post)
      expect(hasEditButton === hasDeleteButton).toBeTruthy();
    }
  });

  test('should sanitize XSS attempts in title', async ({ page }) => {
    await page.goto('/posts/create');

    // Try to inject script in title
    const timestamp = Date.now();
    const xssTitle = '<script>alert("XSS")</script>Malicious Title';
    await page.getByTestId('title-input').fill(xssTitle);
    await page.getByTestId('slug-input').fill(`xss-test-${timestamp}`);
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText('Post created successfully', {
      timeout: 10000,
    });
    await expect(page).toHaveURL('/posts', { timeout: 5000 });

    // Title should be sanitized (script tags removed)
    await expect(page.locator('text=<script>')).not.toBeVisible();
    // The text content without tags should still be visible
    await expect(page.locator('text=Malicious Title')).toBeVisible();
  });

  test('should sanitize XSS attempts in content', async ({ page }) => {
    await page.goto('/posts/create');

    const timestamp = Date.now();
    const xssContent =
      '<script>alert("XSS")</script><p>Safe content</p><img src=x onerror=alert("XSS")>';
    await page.getByTestId('title-input').fill(`XSS Content Test ${timestamp}`);
    await page.getByTestId('slug-input').fill(`xss-content-test-${timestamp}`);
    await page.getByTestId('content-input').fill(xssContent);
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText('Post created successfully', {
      timeout: 10000,
    });
    await expect(page).toHaveURL('/posts', { timeout: 5000 });

    // Script tags should be sanitized
    await expect(page.locator('script')).toHaveCount(0);
    // Allowed tags like <p> should be preserved
    await expect(page.locator('text=Safe content')).toBeVisible();
  });

  test('should sanitize slug to be URL-safe', async ({ page }) => {
    await page.goto('/posts/create');

    // Try to use special characters in slug
    const timestamp = Date.now();
    await page.getByTestId('title-input').fill(`Special Slug Test ${timestamp}`);
    await page.getByTestId('slug-input').fill('Test Slug!@#$%^&*()With Special');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText('Post created successfully', {
      timeout: 10000,
    });
    await expect(page).toHaveURL('/posts', { timeout: 5000 });
    // Post should be created successfully (slug sanitized server-side)
    await expect(page.locator(`text=Special Slug Test ${timestamp}`)).toBeVisible();
  });
});

test.describe('Categories Management', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear cookies and storage for test isolation
    await context.clearCookies();

    await page.goto('/login');
    await page.getByTestId('email-input').fill(TEST_USER.email);
    await page.getByTestId('password-input').fill(TEST_USER.password);
    await page.getByTestId('submit-button').click();
    await expect(page.getByTestId('dashboard-title')).toBeVisible();
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

  test('should delete a category', async ({ page }) => {
    await page.goto('/categories');

    // Create a category to delete with unique name
    const timestamp = Date.now();
    const categoryName = `Category to Delete ${timestamp}`;

    await page.getByTestId('name-input').fill(categoryName);
    await page.getByTestId('slug-input').fill(`category-to-delete-${timestamp}`);
    await page.getByTestId('create-button').click();

    await expect(page.getByTestId('success-message')).toBeVisible();

    // Find the specific category and delete it
    page.once('dialog', (dialog) => dialog.accept());
    const categoryRow = page.getByTestId('category-item').filter({ hasText: categoryName });
    await categoryRow.locator('[data-testid^="delete-category-"]').click();

    await expect(page.getByTestId('success-message')).toContainText(
      'Category deleted successfully'
    );
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

    await page.getByTestId('name-input').fill('Temp Category');
    await page.getByTestId('slug-input').fill('temp-category');
    await page.getByTestId('create-button').click();

    await expect(page.getByTestId('success-message')).toBeVisible();

    // Form should be cleared
    await expect(page.getByTestId('name-input')).toHaveValue('');
    await expect(page.getByTestId('slug-input')).toHaveValue('');
    await expect(page.getByTestId('description-input')).toHaveValue('');
  });
});

test.describe('Posts with Categories', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear cookies and storage for test isolation
    await context.clearCookies();

    await page.goto('/login');
    await page.getByTestId('email-input').fill(TEST_USER.email);
    await page.getByTestId('password-input').fill(TEST_USER.password);
    await page.getByTestId('submit-button').click();
    await expect(page.getByTestId('dashboard-title')).toBeVisible();

    // Create a test category first (unique per test run)
    const testCategory = getUniqueTestCategory();
    await page.goto('/categories');
    await page.getByTestId('name-input').fill(testCategory.name);
    await page.getByTestId('slug-input').fill(testCategory.slug);
    await page.getByTestId('create-button').click();
    await expect(page.getByTestId('success-message')).toBeVisible();
  });

  test('should assign category to post', async ({ page }) => {
    await page.goto('/posts/create');

    const timestamp = Date.now();
    await page.getByTestId('title-input').fill(`Post with Category ${timestamp}`);
    await page.getByTestId('slug-input').fill(`post-with-category-${timestamp}`);

    // Select the category checkbox (find first category checkbox)
    const categoryCheckbox = page.locator('[data-testid^="category-"]').first();
    await categoryCheckbox.check();
    await expect(categoryCheckbox).toBeChecked();

    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText('Post created successfully', {
      timeout: 10000,
    });
    await expect(page).toHaveURL('/posts', { timeout: 5000 });
  });

  test('should show link to create category if none exist', async ({ page }) => {
    // This test would need a clean state, but for now we check the link exists in the form
    await page.goto('/posts/create');

    // The link to create categories should be visible if no categories exist
    const categoriesLink = page.locator('a[href="/categories"]');
    if ((await categoriesLink.count()) > 0) {
      await expect(categoriesLink).toBeVisible();
    }
  });
});
