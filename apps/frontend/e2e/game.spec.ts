import { test, expect, Page } from '@playwright/test';

// Helper function to login a user
async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('email-input').fill(email);
  await page.getByTestId('password-input').fill(password);
  await page.getByTestId('submit-button').click();
  await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
}

test.describe('Game Functionality', () => {
  test.describe('Game Home', () => {
    test.beforeEach(async ({ page, context }) => {
      await context.clearCookies();
      await loginUser(page, 'alice@example.com', 'password123');
      await page.getByTestId('play-game-button').click();
      await expect(page).toHaveURL('/game');
    });

    test('should display game home page', async ({ page }) => {
      // Create game section
      await expect(page.getByText('Create New Game')).toBeVisible();
      await expect(page.getByTestId('session-type-select')).toBeVisible();
      await expect(page.getByTestId('max-rounds-select')).toBeVisible();
      await expect(page.getByTestId('create-game-button')).toBeVisible();

      // Join game section
      await expect(page.getByRole('heading', { name: 'Join Game' })).toBeVisible();
      await expect(page.getByTestId('join-code-input')).toBeVisible();
      await expect(page.getByTestId('join-game-button')).toBeVisible();

      // My sessions section
      await expect(page.getByText('My Game Sessions')).toBeVisible();
    });

    test('should have default values for session creation', async ({ page }) => {
      const sessionTypeSelect = page.getByTestId('session-type-select');
      const maxRoundsSelect = page.getByTestId('max-rounds-select');

      await expect(sessionTypeSelect).toHaveValue('friends');
      await expect(maxRoundsSelect).toHaveValue('10');
    });

    test('should allow selecting different session types', async ({ page }) => {
      const sessionTypeSelect = page.getByTestId('session-type-select');

      await sessionTypeSelect.selectOption('couple');
      await expect(sessionTypeSelect).toHaveValue('couple');

      await sessionTypeSelect.selectOption('adult');
      await expect(sessionTypeSelect).toHaveValue('adult');

      await sessionTypeSelect.selectOption('friends');
      await expect(sessionTypeSelect).toHaveValue('friends');
    });

    test('should allow selecting different round counts', async ({ page }) => {
      const maxRoundsSelect = page.getByTestId('max-rounds-select');

      await maxRoundsSelect.selectOption('5');
      await expect(maxRoundsSelect).toHaveValue('5');

      await maxRoundsSelect.selectOption('15');
      await expect(maxRoundsSelect).toHaveValue('15');

      await maxRoundsSelect.selectOption('20');
      await expect(maxRoundsSelect).toHaveValue('20');
    });

    test('should create a new game session', async ({ page }) => {
      // Select session type and rounds
      await page.getByTestId('session-type-select').selectOption('friends');
      await page.getByTestId('max-rounds-select').selectOption('10');

      // Click create game
      await page.getByTestId('create-game-button').click();

      // Should navigate to lobby
      await expect(page).toHaveURL(/\/game\/lobby\/.+/, { timeout: 10000 });
      await expect(page.getByText('Game Lobby')).toBeVisible();
    });

    test('should disable join button when code is empty', async ({ page }) => {
      const joinButton = page.getByTestId('join-game-button');
      await expect(joinButton).toBeDisabled();
    });

    test('should enable join button when code is 6 characters', async ({ page }) => {
      const joinCodeInput = page.getByTestId('join-code-input');
      const joinButton = page.getByTestId('join-game-button');

      await joinCodeInput.fill('ABC123');
      await expect(joinButton).toBeEnabled();
    });

    test('should format join code to uppercase', async ({ page }) => {
      const joinCodeInput = page.getByTestId('join-code-input');

      await joinCodeInput.fill('abc123');
      await expect(joinCodeInput).toHaveValue('ABC123');
    });

    test('should show error for invalid session code', async ({ page }) => {
      await page.getByTestId('join-code-input').fill('INVALID');
      await page.getByTestId('join-game-button').click();

      await expect(page.getByTestId('error-message')).toBeVisible();
    });

    test('should navigate back to dashboard', async ({ page }) => {
      await page.getByText('← Back to Dashboard').click();
      await expect(page).toHaveURL('/dashboard');
    });
  });

  test.describe('Session Lobby', () => {
    let sessionCode: string;

    test.beforeEach(async ({ page, context }) => {
      await context.clearCookies();
      await loginUser(page, 'bob@example.com', 'password123');

      // Create a new game session
      await page.goto('/game');
      await page.getByTestId('create-game-button').click();

      // Wait for lobby page
      await expect(page).toHaveURL(/\/game\/lobby\/.+/, { timeout: 10000 });
    });

    test('should display session lobby correctly', async ({ page }) => {
      await expect(page.getByText('Game Lobby')).toBeVisible();
      await expect(page.getByText('Waiting for Player 2...')).toBeVisible();
      await expect(page.getByText('Share this code with your friend:')).toBeVisible();
      await expect(page.getByTestId('copy-code-button')).toBeVisible();
    });

    test('should display session code', async ({ page }) => {
      // The session code should be a 6-character string
      const codeElement = page.locator('div.font-mono.text-purple-700');
      await expect(codeElement).toBeVisible();
      const code = await codeElement.textContent();
      expect(code).toHaveLength(6);
    });

    test('should show player 1 as ready', async ({ page }) => {
      await expect(page.getByText('Player 1 (You)')).toBeVisible();
      await expect(page.getByText('Ready')).toBeVisible();
    });

    test('should show player 2 as waiting', async ({ page }) => {
      await expect(page.getByTestId('player2-name')).toBeVisible();
      await expect(page.getByText('Waiting to join...')).toBeVisible();
    });

    test('should display game settings', async ({ page }) => {
      await expect(page.getByText('Game Settings')).toBeVisible();
      await expect(page.getByText('Session Type')).toBeVisible();
      await expect(page.getByText('Total Rounds')).toBeVisible();
      await expect(page.getByText('Current Round')).toBeVisible();
      await expect(page.getByText('Status')).toBeVisible();
    });

    test('should have cancel game button', async ({ page }) => {
      await expect(page.getByTestId('cancel-button')).toBeVisible();
    });

    test('should navigate back when cancelling', async ({ page }) => {
      // Click cancel (this would show a confirm dialog in real scenario)
      await page.on('dialog', (dialog) => dialog.accept());
      await page.getByTestId('cancel-button').click();

      await expect(page).toHaveURL('/game', { timeout: 5000 });
    });

    test('should copy session code to clipboard', async ({ page }) => {
      // Grant clipboard permissions
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

      await page.getByTestId('copy-code-button').click();

      // Check button text changed
      await expect(page.getByText('✓ Copied!')).toBeVisible();
    });
  });

  test.describe('Game Play', () => {
    test.beforeEach(async ({ page, context }) => {
      await context.clearCookies();
      await loginUser(page, 'alice@example.com', 'password123');
    });

    test('should display game play UI for player 1', async ({ page }) => {
      // This test assumes there's an active game session
      // Navigate to existing game (using seed data)
      await page.goto('/game');

      // Click on an active session
      const sessionItem = page.getByTestId('session-item').first();
      if (await sessionItem.isVisible()) {
        await sessionItem.click();

        // Should be on game play page
        if (await page.url().includes('/game/play/')) {
          await expect(page.getByText(/Round \d+ \/ \d+/)).toBeVisible();
          await expect(page.getByText('Connection Points')).toBeVisible();
        }
      }
    });

    test('should show options for selection', async ({ page }) => {
      await page.goto('/game');

      const sessionItem = page.getByTestId('session-item').first();
      if (await sessionItem.isVisible()) {
        await sessionItem.click();

        if (await page.url().includes('/game/play/')) {
          // Options should be displayed
          const optionButtons = page.getByTestId('option-button');
          const count = await optionButtons.count();
          expect(count).toBeGreaterThan(0);
        }
      }
    });

    test('should display progress bar', async ({ page }) => {
      await page.goto('/game');

      const sessionItem = page.getByTestId('session-item').first();
      if (await sessionItem.isVisible()) {
        await sessionItem.click();

        if (await page.url().includes('/game/play/')) {
          // Progress bar should exist
          const progressBar = page.locator('.bg-gradient-to-r.from-purple-600.to-pink-600');
          await expect(progressBar).toBeVisible();
        }
      }
    });
  });

  test.describe('Game Results', () => {
    test.beforeEach(async ({ page, context }) => {
      await context.clearCookies();
      await loginUser(page, 'alice@example.com', 'password123');
    });

    test('should display game results for finished game', async ({ page }) => {
      await page.goto('/game');

      // Look for finished sessions
      const sessionItems = page.getByTestId('session-item');
      const count = await sessionItems.count();

      for (let i = 0; i < count; i++) {
        const item = sessionItems.nth(i);
        const text = await item.textContent();

        if (text?.includes('FINISHED')) {
          await item.click();

          // Should navigate to results page
          await expect(page).toHaveURL(/\/game\/results\/.+/, { timeout: 10000 });
          await expect(page.getByText('Game Complete!')).toBeVisible();
          break;
        }
      }
    });

    test('should display final score and statistics', async ({ page }) => {
      // Navigate to a finished game's results
      await page.goto('/game');

      const sessionItems = page.getByTestId('session-item');
      const count = await sessionItems.count();

      for (let i = 0; i < count; i++) {
        const item = sessionItems.nth(i);
        const text = await item.textContent();

        if (text?.includes('FINISHED')) {
          await item.click();

          if (await page.url().includes('/game/results/')) {
            await expect(page.getByText('Total Connection Points')).toBeVisible();
            await expect(page.getByText('Correct Guesses')).toBeVisible();
            await expect(page.getByText('Total Rounds')).toBeVisible();
            await expect(page.getByText('Accuracy')).toBeVisible();
          }
          break;
        }
      }
    });

    test('should display round summary', async ({ page }) => {
      await page.goto('/game');

      const sessionItems = page.getByTestId('session-item');
      const count = await sessionItems.count();

      for (let i = 0; i < count; i++) {
        const item = sessionItems.nth(i);
        const text = await item.textContent();

        if (text?.includes('FINISHED')) {
          await item.click();

          if (await page.url().includes('/game/results/')) {
            await expect(page.getByText('Round Summary')).toBeVisible();
          }
          break;
        }
      }
    });

    test('should have play again button', async ({ page }) => {
      await page.goto('/game');

      const sessionItems = page.getByTestId('session-item');
      const count = await sessionItems.count();

      for (let i = 0; i < count; i++) {
        const item = sessionItems.nth(i);
        const text = await item.textContent();

        if (text?.includes('FINISHED')) {
          await item.click();

          if (await page.url().includes('/game/results/')) {
            await expect(page.getByTestId('play-again-button')).toBeVisible();
          }
          break;
        }
      }
    });

    test('should navigate back to game home on play again', async ({ page }) => {
      await page.goto('/game');

      const sessionItems = page.getByTestId('session-item');
      const count = await sessionItems.count();

      for (let i = 0; i < count; i++) {
        const item = sessionItems.nth(i);
        const text = await item.textContent();

        if (text?.includes('FINISHED')) {
          await item.click();

          if (await page.url().includes('/game/results/')) {
            await page.getByTestId('play-again-button').click();
            await expect(page).toHaveURL('/game', { timeout: 5000 });
          }
          break;
        }
      }
    });

    test('should have back to home button', async ({ page }) => {
      await page.goto('/game');

      const sessionItems = page.getByTestId('session-item');
      const count = await sessionItems.count();

      for (let i = 0; i < count; i++) {
        const item = sessionItems.nth(i);
        const text = await item.textContent();

        if (text?.includes('FINISHED')) {
          await item.click();

          if (await page.url().includes('/game/results/')) {
            await expect(page.getByTestId('home-button')).toBeVisible();
          }
          break;
        }
      }
    });
  });

  test.describe('Two-Player Game Flow', () => {
    test('should allow two players to play a complete game', async ({ browser }) => {
      // This is a complex test that simulates a real two-player game
      const player1Context = await browser.newContext();
      const player2Context = await browser.newContext();

      const player1Page = await player1Context.newPage();
      const player2Page = await player2Context.newPage();

      try {
        // Player 1 logs in and creates a game
        await loginUser(player1Page, 'bob@example.com', 'password123');
        await player1Page.goto('/game');

        // Select friends session with 5 rounds
        await player1Page.getByTestId('session-type-select').selectOption('friends');
        await player1Page.getByTestId('max-rounds-select').selectOption('5');
        await player1Page.getByTestId('create-game-button').click();

        // Wait for lobby
        await expect(player1Page).toHaveURL(/\/game\/lobby\/.+/, { timeout: 10000 });

        // Get session code
        const codeElement = player1Page.locator('div.font-mono.text-purple-700');
        await expect(codeElement).toBeVisible();
        const sessionCode = await codeElement.textContent();

        expect(sessionCode).toHaveLength(6);

        // Player 2 logs in and joins the game
        await loginUser(player2Page, 'carol@example.com', 'password123');
        await player2Page.goto('/game');

        await player2Page.getByTestId('join-code-input').fill(sessionCode!);
        await player2Page.getByTestId('join-game-button').click();

        // Player 2 should be redirected to game play
        await expect(player2Page).toHaveURL(/\/game\/play\/.+/, { timeout: 10000 });

        // Player 1 should see both players ready
        await expect(player1Page.getByText('Both Players Ready!')).toBeVisible({ timeout: 10000 });

        // Player 1 starts the game
        await player1Page.getByTestId('start-game-button').click();

        // Both players should be on game play page
        await expect(player1Page).toHaveURL(/\/game\/play\/.+/, { timeout: 10000 });
        await expect(player2Page).toHaveURL(/\/game\/play\/.+/, { timeout: 10000 });

        // Verify game UI is visible for both players
        await expect(player1Page.getByText('Connection Points')).toBeVisible();
        await expect(player2Page.getByText('Connection Points')).toBeVisible();
      } finally {
        await player1Context.close();
        await player2Context.close();
      }
    });
  });

  test.describe('Navigation and Routing', () => {
    test.beforeEach(async ({ page, context }) => {
      await context.clearCookies();
      await loginUser(page, 'alice@example.com', 'password123');
    });

    test('should navigate from dashboard to game', async ({ page }) => {
      await expect(page).toHaveURL('/dashboard');
      await page.getByTestId('play-game-button').click();
      await expect(page).toHaveURL('/game');
    });

    test('should protect game routes with auth guard', async ({ page, context }) => {
      await context.clearCookies();
      await page.evaluate(() => localStorage.clear());

      // Try to access game routes without auth
      await page.goto('/game');
      await expect(page).toHaveURL(/\/login/);
    });

    test('should navigate between game states correctly', async ({ page }) => {
      await page.goto('/game');

      // Create a game
      await page.getByTestId('create-game-button').click();
      await expect(page).toHaveURL(/\/game\/lobby\/.+/);

      // Cancel and go back
      await page.on('dialog', (dialog) => dialog.accept());
      await page.getByTestId('cancel-button').click();
      await expect(page).toHaveURL('/game');
    });
  });

  test.describe('Session Management', () => {
    test.beforeEach(async ({ page, context }) => {
      await context.clearCookies();
      await loginUser(page, 'alice@example.com', 'password123');
      await page.goto('/game');
    });

    test('should display user sessions', async ({ page }) => {
      await expect(page.getByText('My Game Sessions')).toBeVisible();
    });

    test('should show session status badges', async ({ page }) => {
      const sessionItems = page.getByTestId('session-item');
      const count = await sessionItems.count();

      if (count > 0) {
        const firstSession = sessionItems.first();
        await expect(firstSession).toBeVisible();

        // Should have status badge (WAITING, ACTIVE, or FINISHED)
        const text = await firstSession.textContent();
        expect(text).toMatch(/WAITING|ACTIVE|FINISHED|CANCELLED/);
      }
    });

    test('should show session type badges', async ({ page }) => {
      const sessionItems = page.getByTestId('session-item');
      const count = await sessionItems.count();

      if (count > 0) {
        const firstSession = sessionItems.first();
        const text = await firstSession.textContent();
        expect(text).toMatch(/FRIENDS|COUPLE|ADULT/);
      }
    });

    test('should display session code', async ({ page }) => {
      const sessionItems = page.getByTestId('session-item');
      const count = await sessionItems.count();

      if (count > 0) {
        const firstSession = sessionItems.first();
        await expect(firstSession.getByText(/Code:/)).toBeVisible();
      }
    });

    test('should display round progress', async ({ page }) => {
      const sessionItems = page.getByTestId('session-item');
      const count = await sessionItems.count();

      if (count > 0) {
        const firstSession = sessionItems.first();
        await expect(firstSession.getByText(/Round \d+ \/ \d+/)).toBeVisible();
      }
    });

    test('should display connection points', async ({ page }) => {
      const sessionItems = page.getByTestId('session-item');
      const count = await sessionItems.count();

      if (count > 0) {
        const firstSession = sessionItems.first();
        await expect(firstSession.getByText(/Connection Points:/)).toBeVisible();
      }
    });
  });
});
