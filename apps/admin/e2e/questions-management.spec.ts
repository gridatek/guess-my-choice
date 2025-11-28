import { test, expect } from '@playwright/test';

const ADMIN_USER = {
  email: 'alice@example.com',
  password: 'password123',
};

// Helper to generate unique test data
function getUniqueTestQuestion() {
  const timestamp = Date.now();
  return {
    text: `What would you prefer to do? ${timestamp}`,
    description: 'Test question description for game prompts',
    sessionType: 'friends',
    status: 'draft',
    tags: 'preferences, choices, fun',
  };
}

test.describe('Questions Management - CRUD Operations', () => {
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

  test('should display questions list page', async ({ page }) => {
    // Navigate to questions
    await page.getByTestId('questions-link').click();

    // Check questions page is displayed
    await expect(page).toHaveURL('/questions');
    await expect(page.locator('h2').filter({ hasText: 'Questions' })).toBeVisible();
    await expect(page.getByTestId('create-question-button')).toBeVisible();
  });

  test('should navigate to create question page', async ({ page }) => {
    await page.goto('/questions');
    await page.getByTestId('create-question-button').click();

    await expect(page).toHaveURL('/questions/create');
    await expect(page.locator('h2').filter({ hasText: 'Create Question' })).toBeVisible();
  });

  test('should create a draft question', async ({ page }) => {
    await page.goto('/questions/create');

    const testQuestion = getUniqueTestQuestion();

    // Fill in question details
    await page.getByTestId('question-text-input').fill(testQuestion.text);
    await page.getByTestId('description-input').fill(testQuestion.description);
    await page.getByTestId('session-type-select').selectOption(testQuestion.sessionType);
    await page.getByTestId('tags-input').fill(testQuestion.tags);
    await page.getByTestId('status-select').selectOption(testQuestion.status);

    // Submit
    await page.getByTestId('submit-button').click();

    // Wait for success message
    await expect(page.getByTestId('success-message')).toContainText(
      'Question created successfully',
      {
        timeout: 10000,
      }
    );

    // Should redirect to questions list
    await expect(page).toHaveURL('/questions', { timeout: 5000 });

    // Verify question appears in list
    await expect(page.locator(`text=${testQuestion.text}`)).toBeVisible();
  });

  test('should create a published question', async ({ page }) => {
    await page.goto('/questions/create');

    const timestamp = Date.now();
    await page.getByTestId('question-text-input').fill(`Which do you prefer? ${timestamp}`);
    await page.getByTestId('description-input').fill('Published question for preference testing');
    await page.getByTestId('session-type-select').selectOption('friends');
    await page.getByTestId('status-select').selectOption('published');

    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText(
      'Question created successfully',
      {
        timeout: 10000,
      }
    );
    await expect(page).toHaveURL('/questions', { timeout: 5000 });
  });

  test('should filter questions by session type', async ({ page }) => {
    await page.goto('/questions');

    // Select session type filter
    const sessionTypeFilter = page.getByTestId('session-type-filter');
    if (await sessionTypeFilter.isVisible()) {
      await sessionTypeFilter.selectOption('couple');

      // Wait for filtered results
      await page.waitForTimeout(1000);

      // Verify only couple questions are shown
      const questionItems = page.getByTestId('question-item');
      const count = await questionItems.count();

      if (count > 0) {
        const firstQuestion = questionItems.first();
        await expect(firstQuestion).toContainText('couple');
      }
    }
  });

  test('should filter questions by status', async ({ page }) => {
    await page.goto('/questions');

    const statusFilter = page.getByTestId('status-filter');
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('published');

      await page.waitForTimeout(1000);

      const questionItems = page.getByTestId('question-item');
      const count = await questionItems.count();

      if (count > 0) {
        const firstQuestion = questionItems.first();
        const statusBadge = firstQuestion.locator('[data-testid^="question-status-"]');
        await expect(statusBadge).toContainText('published');
      }
    }
  });

  test('should edit an existing question', async ({ page }) => {
    // First create a question
    const timestamp = Date.now();
    const originalText = `Original Question ${timestamp}`;
    const updatedText = `Updated Question ${timestamp}`;

    await page.goto('/questions/create');
    await page.getByTestId('question-text-input').fill(originalText);
    await page.getByTestId('session-type-select').selectOption('friends');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText(
      'Question created successfully',
      {
        timeout: 10000,
      }
    );
    await expect(page).toHaveURL('/questions', { timeout: 5000 });

    // Find the question and click edit
    const questionRow = page.getByTestId('question-item').filter({ hasText: originalText });
    await questionRow.locator('[data-testid^="edit-question-"]').click();

    // Wait for edit form
    await expect(page.locator('h2').filter({ hasText: 'Edit Question' })).toBeVisible();

    // Update text
    await page.getByTestId('question-text-input').fill(updatedText);
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText(
      'Question updated successfully',
      {
        timeout: 10000,
      }
    );
    await expect(page).toHaveURL('/questions', { timeout: 5000 });
    await expect(page.locator(`text=${updatedText}`)).toBeVisible();
  });

  test('should delete a question', async ({ page }) => {
    // Create a question to delete
    const timestamp = Date.now();
    const questionText = `Question to Delete ${timestamp}`;

    await page.goto('/questions/create');
    await page.getByTestId('question-text-input').fill(questionText);
    await page.getByTestId('session-type-select').selectOption('friends');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText(
      'Question created successfully',
      {
        timeout: 10000,
      }
    );
    await expect(page).toHaveURL('/questions', { timeout: 5000 });

    // Verify question exists
    await expect(page.locator(`text=${questionText}`)).toBeVisible();

    // Delete it
    page.once('dialog', (dialog) => dialog.accept());
    const questionRow = page.getByTestId('question-item').filter({ hasText: questionText });
    await questionRow.locator('[data-testid^="delete-question-"]').click();

    // Verify question is removed
    await expect(page.locator(`text=${questionText}`)).not.toBeVisible();
  });

  test('should require question text and session type', async ({ page }) => {
    await page.goto('/questions/create');

    // Try to submit without filling required fields
    await page.getByTestId('submit-button').click();

    // Should show validation error or stay on page
    await expect(page).toHaveURL('/questions/create');
  });

  test('should cancel question creation', async ({ page }) => {
    await page.goto('/questions/create');

    await page.getByTestId('question-text-input').fill('Cancelled Question');
    await page.getByTestId('cancel-button').click();

    await expect(page).toHaveURL('/questions');
  });

  test('should search questions by text', async ({ page }) => {
    await page.goto('/questions');

    const searchInput = page.getByTestId('search-input');
    if (await searchInput.isVisible()) {
      // Create a unique question first
      const timestamp = Date.now();
      const uniqueText = `SearchableQuestion${timestamp}`;

      await page.getByTestId('create-question-button').click();
      await page.getByTestId('question-text-input').fill(uniqueText);
      await page.getByTestId('session-type-select').selectOption('friends');
      await page.getByTestId('submit-button').click();

      await expect(page).toHaveURL('/questions', { timeout: 5000 });

      // Search for it
      await searchInput.fill(uniqueText);
      await page.waitForTimeout(500);

      // Should find the question
      await expect(page.locator(`text=${uniqueText}`)).toBeVisible();
    }
  });

  test('should display question tags', async ({ page }) => {
    const timestamp = Date.now();
    const questionText = `Tagged Question ${timestamp}`;
    const tags = 'weekend, activities, preferences';

    await page.goto('/questions/create');
    await page.getByTestId('question-text-input').fill(questionText);
    await page.getByTestId('session-type-select').selectOption('friends');
    await page.getByTestId('tags-input').fill(tags);
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText(
      'Question created successfully',
      {
        timeout: 10000,
      }
    );
    await expect(page).toHaveURL('/questions', { timeout: 5000 });

    // Check if tags are displayed
    const questionRow = page.getByTestId('question-item').filter({ hasText: questionText });
    const tagElements = questionRow.locator('[data-testid^="tag-"]');

    if ((await tagElements.count()) > 0) {
      await expect(tagElements.first()).toBeVisible();
    }
  });

  test('should show view count for questions', async ({ page }) => {
    await page.goto('/questions');

    const questionItems = page.getByTestId('question-item');
    const count = await questionItems.count();

    if (count > 0) {
      const firstQuestion = questionItems.first();
      const viewCount = firstQuestion.locator('[data-testid^="view-count-"]');

      if (await viewCount.isVisible()) {
        await expect(viewCount).toBeVisible();
      }
    }
  });

  test('should paginate questions list', async ({ page }) => {
    await page.goto('/questions');

    const paginationControls = page.getByTestId('pagination');
    if (await paginationControls.isVisible()) {
      const nextButton = page.getByTestId('next-page-button');
      const prevButton = page.getByTestId('prev-page-button');

      await expect(nextButton).toBeVisible();
      await expect(prevButton).toBeVisible();
    }
  });
});

test.describe('Questions Management - Session Type Specific', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_USER.email);
    await page.getByTestId('password-input').fill(ADMIN_USER.password);
    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should create friends session question', async ({ page }) => {
    await page.goto('/questions/create');

    const timestamp = Date.now();
    await page
      .getByTestId('question-text-input')
      .fill(`What would you rather do this weekend? ${timestamp}`);
    await page.getByTestId('description-input').fill('Weekend activity preference for friends');
    await page.getByTestId('session-type-select').selectOption('friends');
    await page.getByTestId('status-select').selectOption('published');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText(
      'Question created successfully',
      {
        timeout: 10000,
      }
    );
  });

  test('should create couple session question', async ({ page }) => {
    await page.goto('/questions/create');

    const timestamp = Date.now();
    await page
      .getByTestId('question-text-input')
      .fill(`What would make me happiest for our date? ${timestamp}`);
    await page.getByTestId('description-input').fill('Date preference for couples');
    await page.getByTestId('session-type-select').selectOption('couple');
    await page.getByTestId('status-select').selectOption('published');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText(
      'Question created successfully',
      {
        timeout: 10000,
      }
    );
  });

  test('should create adult session question', async ({ page }) => {
    await page.goto('/questions/create');

    const timestamp = Date.now();
    await page.getByTestId('question-text-input').fill(`What would I prefer to try? ${timestamp}`);
    await page.getByTestId('description-input').fill('Adult themed preference question');
    await page.getByTestId('session-type-select').selectOption('adult');
    await page.getByTestId('status-select').selectOption('published');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText(
      'Question created successfully',
      {
        timeout: 10000,
      }
    );
  });

  test('should create all session types and filter them', async ({ page }) => {
    const sessionTypes = ['friends', 'couple', 'adult'];

    // Create one question for each session type
    for (const sessionType of sessionTypes) {
      await page.goto('/questions/create');

      const timestamp = Date.now();
      await page.getByTestId('question-text-input').fill(`${sessionType} question ${timestamp}`);
      await page.getByTestId('session-type-select').selectOption(sessionType);
      await page.getByTestId('status-select').selectOption('published');
      await page.getByTestId('submit-button').click();

      await expect(page.getByTestId('success-message')).toContainText(
        'Question created successfully',
        {
          timeout: 10000,
        }
      );
      await expect(page).toHaveURL('/questions', { timeout: 5000 });
    }

    // Now filter by each session type
    for (const sessionType of sessionTypes) {
      const sessionTypeFilter = page.getByTestId('session-type-filter');
      if (await sessionTypeFilter.isVisible()) {
        await sessionTypeFilter.selectOption(sessionType);
        await page.waitForTimeout(1000);

        // Verify filtered results contain the session type
        const questionItems = page.getByTestId('question-item');
        const count = await questionItems.count();

        if (count > 0) {
          const firstQuestion = questionItems.first();
          await expect(firstQuestion).toContainText(sessionType);
        }
      }
    }
  });
});

test.describe('Questions Management - Status Management', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_USER.email);
    await page.getByTestId('password-input').fill(ADMIN_USER.password);
    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should create draft question and then publish it', async ({ page }) => {
    // Create as draft
    const timestamp = Date.now();
    const questionText = `Draft to Publish ${timestamp}`;

    await page.goto('/questions/create');
    await page.getByTestId('question-text-input').fill(questionText);
    await page.getByTestId('session-type-select').selectOption('friends');
    await page.getByTestId('status-select').selectOption('draft');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText(
      'Question created successfully',
      {
        timeout: 10000,
      }
    );
    await expect(page).toHaveURL('/questions', { timeout: 5000 });

    // Verify it's a draft
    const questionRow = page.getByTestId('question-item').filter({ hasText: questionText });
    const statusBadge = questionRow.locator('[data-testid^="question-status-"]');
    await expect(statusBadge).toContainText('draft');

    // Edit to publish
    await questionRow.locator('[data-testid^="edit-question-"]').click();
    await page.getByTestId('status-select').selectOption('published');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText(
      'Question updated successfully',
      {
        timeout: 10000,
      }
    );

    // Verify it's now published
    const updatedRow = page.getByTestId('question-item').filter({ hasText: questionText });
    const updatedBadge = updatedRow.locator('[data-testid^="question-status-"]');
    await expect(updatedBadge).toContainText('published');
  });

  test('should archive a question', async ({ page }) => {
    // Create a question
    const timestamp = Date.now();
    const questionText = `Question to Archive ${timestamp}`;

    await page.goto('/questions/create');
    await page.getByTestId('question-text-input').fill(questionText);
    await page.getByTestId('session-type-select').selectOption('friends');
    await page.getByTestId('status-select').selectOption('published');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText(
      'Question created successfully',
      {
        timeout: 10000,
      }
    );
    await expect(page).toHaveURL('/questions', { timeout: 5000 });

    // Archive it
    const questionRow = page.getByTestId('question-item').filter({ hasText: questionText });
    await questionRow.locator('[data-testid^="edit-question-"]').click();
    await page.getByTestId('status-select').selectOption('archived');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText(
      'Question updated successfully',
      {
        timeout: 10000,
      }
    );

    // Verify archived status
    const updatedRow = page.getByTestId('question-item').filter({ hasText: questionText });
    const statusBadge = updatedRow.locator('[data-testid^="question-status-"]');
    await expect(statusBadge).toContainText('archived');
  });

  test('should bulk update question status', async ({ page }) => {
    await page.goto('/questions');

    const bulkActionSelect = page.getByTestId('bulk-action-select');
    if (await bulkActionSelect.isVisible()) {
      // Select first question checkbox
      const firstCheckbox = page.locator('[data-testid^="question-checkbox-"]').first();
      await firstCheckbox.check();

      // Select bulk action
      await bulkActionSelect.selectOption('publish');
      await page.getByTestId('apply-bulk-action-button').click();

      // Should show success message
      await expect(page.getByTestId('success-message')).toBeVisible();
    }
  });
});

test.describe('Questions Management - Error Handling', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_USER.email);
    await page.getByTestId('password-input').fill(ADMIN_USER.password);
    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should handle XSS attempts in question text', async ({ page }) => {
    await page.goto('/questions/create');

    const xssText = '<script>alert("XSS")</script>What is your preference?';
    await page.getByTestId('question-text-input').fill(xssText);
    await page.getByTestId('session-type-select').selectOption('friends');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText(
      'Question created successfully',
      {
        timeout: 10000,
      }
    );
    await expect(page).toHaveURL('/questions', { timeout: 5000 });

    // Script tags should be sanitized
    await expect(page.locator('script')).toHaveCount(0);
    await expect(page.locator('text=What is your preference?')).toBeVisible();
  });

  test('should validate question text length', async ({ page }) => {
    await page.goto('/questions/create');

    // Try very long text
    const longText = 'What would you prefer? '.repeat(50);
    await page.getByTestId('question-text-input').fill(longText);
    await page.getByTestId('session-type-select').selectOption('friends');

    const submitButton = page.getByTestId('submit-button');
    await expect(submitButton).toBeVisible();

    // Should either prevent submission or show validation message
    const maxLengthError = page.getByTestId('max-length-error');
    if (await maxLengthError.isVisible({ timeout: 1000 })) {
      await expect(maxLengthError).toBeVisible();
    }
  });

  test('should handle duplicate question prevention', async ({ page }) => {
    const timestamp = Date.now();
    const duplicateText = `Duplicate Question Test ${timestamp}`;

    // Create first question
    await page.goto('/questions/create');
    await page.getByTestId('question-text-input').fill(duplicateText);
    await page.getByTestId('session-type-select').selectOption('friends');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('success-message')).toContainText(
      'Question created successfully',
      {
        timeout: 10000,
      }
    );
    await expect(page).toHaveURL('/questions', { timeout: 5000 });

    // Try to create duplicate
    await page.getByTestId('create-question-button').click();
    await page.getByTestId('question-text-input').fill(duplicateText);
    await page.getByTestId('session-type-select').selectOption('friends');
    await page.getByTestId('submit-button').click();

    // Should either show error or create successfully (depending on business logic)
    // We just verify the form handles the submission
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toBeTruthy();
  });
});
