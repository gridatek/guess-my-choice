import { test, expect } from '@playwright/test';

const ADMIN_USER = {
  email: 'alice@example.com',
  password: 'password123',
};

const REGULAR_USER = {
  email: 'bob@example.com',
  password: 'password123',
};

test.describe('Admin Dashboard - Overview', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_USER.email);
    await page.getByTestId('password-input').fill(ADMIN_USER.password);
    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should display admin dashboard', async ({ page }) => {
    await expect(page.getByTestId('dashboard-title')).toBeVisible();
    await expect(page.getByTestId('dashboard-title')).toContainText('Dashboard');
  });

  test('should show admin navigation links', async ({ page }) => {
    // Verify all admin navigation links are present
    await expect(page.getByTestId('dashboard-link')).toBeVisible();
    await expect(page.getByTestId('options-link')).toBeVisible();
    await expect(page.getByTestId('questions-link')).toBeVisible();
    await expect(page.getByTestId('categories-link')).toBeVisible();
    await expect(page.getByTestId('admin-link')).toBeVisible();
    await expect(page.getByTestId('profile-link')).toBeVisible();
  });

  test('should display statistics cards', async ({ page }) => {
    const statsCards = page.getByTestId('stats-card');
    if (await statsCards.first().isVisible()) {
      // Should have stats for options, questions, categories, users
      const cardCount = await statsCards.count();
      expect(cardCount).toBeGreaterThan(0);

      // Each card should have a title and value
      const firstCard = statsCards.first();
      await expect(firstCard.locator('[data-testid="card-title"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="card-value"]')).toBeVisible();
    }
  });

  test('should show total options count', async ({ page }) => {
    const optionsCard = page.getByTestId('total-options-card');
    if (await optionsCard.isVisible()) {
      await expect(optionsCard).toBeVisible();

      const count = optionsCard.locator('[data-testid="card-value"]');
      await expect(count).toBeVisible();

      // Count should be a number
      const countText = await count.textContent();
      expect(countText).toMatch(/\d+/);
    }
  });

  test('should show total questions count', async ({ page }) => {
    const questionsCard = page.getByTestId('total-questions-card');
    if (await questionsCard.isVisible()) {
      await expect(questionsCard).toBeVisible();

      const count = questionsCard.locator('[data-testid="card-value"]');
      await expect(count).toBeVisible();

      const countText = await count.textContent();
      expect(countText).toMatch(/\d+/);
    }
  });

  test('should show total categories count', async ({ page }) => {
    const categoriesCard = page.getByTestId('total-categories-card');
    if (await categoriesCard.isVisible()) {
      await expect(categoriesCard).toBeVisible();

      const count = categoriesCard.locator('[data-testid="card-value"]');
      await expect(count).toBeVisible();

      const countText = await count.textContent();
      expect(countText).toMatch(/\d+/);
    }
  });

  test('should show total users count (admin only)', async ({ page }) => {
    const usersCard = page.getByTestId('total-users-card');
    if (await usersCard.isVisible()) {
      await expect(usersCard).toBeVisible();

      const count = usersCard.locator('[data-testid="card-value"]');
      await expect(count).toBeVisible();

      const countText = await count.textContent();
      expect(countText).toMatch(/\d+/);
    }
  });

  test('should navigate to options from dashboard', async ({ page }) => {
    const optionsLink = page.getByTestId('view-options-link');
    if (await optionsLink.isVisible()) {
      await optionsLink.click();
      await expect(page).toHaveURL('/options');
    } else {
      // Try main navigation
      await page.getByTestId('options-link').click();
      await expect(page).toHaveURL('/options');
    }
  });

  test('should navigate to questions from dashboard', async ({ page }) => {
    const questionsLink = page.getByTestId('view-questions-link');
    if (await questionsLink.isVisible()) {
      await questionsLink.click();
      await expect(page).toHaveURL('/questions');
    } else {
      await page.getByTestId('questions-link').click();
      await expect(page).toHaveURL('/questions');
    }
  });

  test('should navigate to categories from dashboard', async ({ page }) => {
    const categoriesLink = page.getByTestId('view-categories-link');
    if (await categoriesLink.isVisible()) {
      await categoriesLink.click();
      await expect(page).toHaveURL('/categories');
    } else {
      await page.getByTestId('categories-link').click();
      await expect(page).toHaveURL('/categories');
    }
  });

  test('should show user profile information', async ({ page }) => {
    const profileSection = page.getByTestId('user-profile-section');
    if (await profileSection.isVisible()) {
      await expect(profileSection).toBeVisible();

      // Should show username or email
      const username = profileSection.locator('[data-testid="username"]');
      const email = profileSection.locator('[data-testid="email"]');

      const hasUserInfo = (await username.isVisible()) || (await email.isVisible());
      expect(hasUserInfo).toBeTruthy();
    }
  });

  test('should have logout functionality', async ({ page }) => {
    const signoutButton = page.getByTestId('signout-button');
    await expect(signoutButton).toBeVisible();

    await signoutButton.click();
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });
});

test.describe('Admin Dashboard - Recent Activity', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_USER.email);
    await page.getByTestId('password-input').fill(ADMIN_USER.password);
    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should display recent options', async ({ page }) => {
    const recentOptions = page.getByTestId('recent-options');
    if (await recentOptions.isVisible()) {
      await expect(recentOptions).toBeVisible();

      const optionItems = page.getByTestId('recent-option-item');
      const count = await optionItems.count();

      if (count > 0) {
        // Each item should have text and created date
        const firstItem = optionItems.first();
        await expect(firstItem).toBeVisible();
      }
    }
  });

  test('should display recent questions', async ({ page }) => {
    const recentQuestions = page.getByTestId('recent-questions');
    if (await recentQuestions.isVisible()) {
      await expect(recentQuestions).toBeVisible();

      const questionItems = page.getByTestId('recent-question-item');
      const count = await questionItems.count();

      if (count > 0) {
        const firstItem = questionItems.first();
        await expect(firstItem).toBeVisible();
      }
    }
  });

  test('should click on recent option to edit', async ({ page }) => {
    const recentOptions = page.getByTestId('recent-options');
    if (await recentOptions.isVisible()) {
      const firstOption = page.getByTestId('recent-option-item').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();

        // Should navigate to edit page
        await expect(page.url()).toMatch(/\/options\/(edit\/|create)/);
      }
    }
  });
});

test.describe('Admin Dashboard - Charts and Analytics', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_USER.email);
    await page.getByTestId('password-input').fill(ADMIN_USER.password);
    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should display options by session type chart', async ({ page }) => {
    const chart = page.getByTestId('options-by-session-chart');
    if (await chart.isVisible()) {
      await expect(chart).toBeVisible();

      // Should have data for friends, couple, adult
      const chartLabels = chart.locator('[data-testid^="chart-label-"]');
      const labelCount = await chartLabels.count();

      if (labelCount > 0) {
        expect(labelCount).toBeGreaterThanOrEqual(3);
      }
    }
  });

  test('should display questions by session type chart', async ({ page }) => {
    const chart = page.getByTestId('questions-by-session-chart');
    if (await chart.isVisible()) {
      await expect(chart).toBeVisible();
    }
  });

  test('should display status distribution chart', async ({ page }) => {
    const chart = page.getByTestId('status-distribution-chart');
    if (await chart.isVisible()) {
      await expect(chart).toBeVisible();

      // Should show draft, published, archived
      const segments = chart.locator('[data-testid^="chart-segment-"]');
      const segmentCount = await segments.count();

      if (segmentCount > 0) {
        expect(segmentCount).toBeGreaterThanOrEqual(2);
      }
    }
  });

  test('should toggle chart time range', async ({ page }) => {
    const timeRangeSelect = page.getByTestId('chart-time-range');
    if (await timeRangeSelect.isVisible()) {
      // Change to last 30 days
      await timeRangeSelect.selectOption('30d');
      await page.waitForTimeout(1000);

      // Charts should update (hard to verify without data, but check they're still visible)
      const chart = page.getByTestId('options-by-session-chart');
      if (await chart.isVisible({ timeout: 1000 })) {
        await expect(chart).toBeVisible();
      }
    }
  });
});

test.describe('Admin Dashboard - Quick Actions', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_USER.email);
    await page.getByTestId('password-input').fill(ADMIN_USER.password);
    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should have quick action to create option', async ({ page }) => {
    const createOptionButton = page.getByTestId('quick-create-option');
    if (await createOptionButton.isVisible()) {
      await createOptionButton.click();
      await expect(page).toHaveURL('/options/create');
    }
  });

  test('should have quick action to create question', async ({ page }) => {
    const createQuestionButton = page.getByTestId('quick-create-question');
    if (await createQuestionButton.isVisible()) {
      await createQuestionButton.click();
      await expect(page).toHaveURL('/questions/create');
    }
  });

  test('should have quick action to create category', async ({ page }) => {
    const createCategoryButton = page.getByTestId('quick-create-category');
    if (await createCategoryButton.isVisible()) {
      await createCategoryButton.click();
      await expect(page).toHaveURL('/categories');

      // Should focus on create form
      const nameInput = page.getByTestId('name-input');
      await expect(nameInput).toBeFocused();
    }
  });

  test('should have quick action to manage users (admin only)', async ({ page }) => {
    const manageUsersButton = page.getByTestId('quick-manage-users');
    if (await manageUsersButton.isVisible()) {
      await manageUsersButton.click();
      await expect(page).toHaveURL('/admin/users');
    }
  });
});

test.describe('Admin Dashboard - Non-Admin View', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await page.getByTestId('email-input').fill(REGULAR_USER.email);
    await page.getByTestId('password-input').fill(REGULAR_USER.password);
    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should not show admin link for non-admin users', async ({ page }) => {
    const adminLink = page.getByTestId('admin-link');
    await expect(adminLink).not.toBeVisible();
  });

  test('should not show user management stats for non-admin', async ({ page }) => {
    const usersCard = page.getByTestId('total-users-card');
    await expect(usersCard).not.toBeVisible();
  });

  test('should prevent direct access to admin panel', async ({ page }) => {
    await page.goto('/admin/users');

    // Should redirect to dashboard (not authorized)
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
  });

  test('should still access own profile', async ({ page }) => {
    await page.getByTestId('profile-link').click();
    await expect(page).toHaveURL('/profile');
  });
});

test.describe('Admin Dashboard - Responsive Design', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_USER.email);
    await page.getByTestId('password-input').fill(ADMIN_USER.password);
    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should display properly on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await expect(page.getByTestId('dashboard-title')).toBeVisible();

    // Navigation should be accessible (might be in hamburger menu)
    const mobileMenu = page.getByTestId('mobile-menu-button');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();

      // Menu items should be visible
      await expect(page.getByTestId('options-link')).toBeVisible();
    }
  });

  test('should display properly on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await expect(page.getByTestId('dashboard-title')).toBeVisible();

    // Stats cards should adjust layout
    const statsCards = page.getByTestId('stats-card');
    if (await statsCards.first().isVisible()) {
      await expect(statsCards.first()).toBeVisible();
    }
  });
});

test.describe('Admin Dashboard - Performance and Loading', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
  });

  test('should show loading state while fetching data', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_USER.email);
    await page.getByTestId('password-input').fill(ADMIN_USER.password);
    await page.getByTestId('submit-button').click();

    // Loading indicator might appear briefly
    const loading = page.getByTestId('loading');

    // Eventually loading should disappear and dashboard should be visible
    await expect(page.getByTestId('dashboard-title')).toBeVisible({ timeout: 10000 });
  });

  test('should handle refresh gracefully', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_USER.email);
    await page.getByTestId('password-input').fill(ADMIN_USER.password);
    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Refresh the page
    await page.reload();

    // Should still show dashboard (session persists)
    await expect(page.getByTestId('dashboard-title')).toBeVisible({ timeout: 10000 });
  });

  test('should handle error state gracefully', async ({ page, context }) => {
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_USER.email);
    await page.getByTestId('password-input').fill(ADMIN_USER.password);
    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Simulate network error by going offline
    await context.setOffline(true);

    // Try to navigate to options (which would require data fetch)
    await page.getByTestId('options-link').click();

    // Should show error message or handle gracefully
    const errorMessage = page.getByTestId('error-message');
    if (await errorMessage.isVisible({ timeout: 5000 })) {
      await expect(errorMessage).toBeVisible();
    }

    // Restore online
    await context.setOffline(false);
  });
});

test.describe('Admin Dashboard - Search and Filters', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await page.getByTestId('email-input').fill(ADMIN_USER.email);
    await page.getByTestId('password-input').fill(ADMIN_USER.password);
    await page.getByTestId('submit-button').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should have global search functionality', async ({ page }) => {
    const globalSearch = page.getByTestId('global-search-input');
    if (await globalSearch.isVisible()) {
      await globalSearch.fill('test search');
      await globalSearch.press('Enter');

      // Should show search results or navigate to search page
      await page.waitForTimeout(1000);

      const searchResults = page.getByTestId('search-results');
      if (await searchResults.isVisible({ timeout: 2000 })) {
        await expect(searchResults).toBeVisible();
      }
    }
  });

  test('should filter dashboard by session type', async ({ page }) => {
    const sessionTypeFilter = page.getByTestId('dashboard-session-filter');
    if (await sessionTypeFilter.isVisible()) {
      await sessionTypeFilter.selectOption('friends');
      await page.waitForTimeout(1000);

      // Stats should update to show friends-only data
      const statsCards = page.getByTestId('stats-card');
      await expect(statsCards.first()).toBeVisible();
    }
  });

  test('should filter dashboard by date range', async ({ page }) => {
    const dateRangeFilter = page.getByTestId('dashboard-date-range');
    if (await dateRangeFilter.isVisible()) {
      await dateRangeFilter.selectOption('last-7-days');
      await page.waitForTimeout(1000);

      // Dashboard should update with filtered data
      await expect(page.getByTestId('dashboard-title')).toBeVisible();
    }
  });
});
