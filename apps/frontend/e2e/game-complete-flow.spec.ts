import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Complete E2E Test Suite for Guess My Choice Game
 * Test-Driven Development approach - these tests define the expected behavior
 */

// Helper function to login a user
async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('email-input').fill(email);
  await page.getByTestId('password-input').fill(password);
  await page.getByTestId('submit-button').click();
  await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
}

// Helper to extract session code from lobby
async function getSessionCode(page: Page): Promise<string> {
  const codeElement = page.getByTestId('session-code');
  await expect(codeElement).toBeVisible();
  const code = await codeElement.textContent();
  return code!.trim();
}

// Helper to start a game with both players ready
async function startGameWithBothPlayers(
  player1Page: Page,
  player2Page: Page,
  player1Email: string = 'bob@example.com',
  player2Email: string = 'carol@example.com'
): Promise<string> {
  // Player 1 creates game
  await loginUser(player1Page, player1Email, 'password123');
  await player1Page.goto('/game');
  await player1Page.getByTestId('create-game-button').click();
  const sessionCode = await getSessionCode(player1Page);
  const sessionId = player1Page.url().split('/').pop()!;

  // Player 2 joins
  await loginUser(player2Page, player2Email, 'password123');
  await player2Page.goto('/game');
  await player2Page.getByTestId('join-code-input').fill(sessionCode);
  await player2Page.getByTestId('join-game-button').click();

  // Wait for Player 2 to be on play page
  await expect(player2Page).toHaveURL(`/game/play/${sessionId}`, { timeout: 15000 });

  // Player 1 clicks start
  await expect(player1Page.getByTestId('start-game-button')).toBeVisible({ timeout: 10000 });
  await player1Page.getByTestId('start-game-button').click();

  // Wait for Player 1 to be on play page
  await expect(player1Page).toHaveURL(`/game/play/${sessionId}`, { timeout: 15000 });

  return sessionId;
}

test.describe('Complete 2-Player Game Flow - TDD', () => {
  test.describe('1. Game Creation Flow', () => {
    test('Player 1 can create a friends session', async ({ page }) => {
      await loginUser(page, 'bob@example.com', 'password123');
      await page.goto('/game');

      // Verify game home loaded
      await expect(page.getByTestId('game-home-title')).toHaveText('Guess My Choice');

      // Select session type
      await page.getByTestId('session-type-select').selectOption('friends');
      await expect(page.getByTestId('session-type-select')).toHaveValue('friends');

      // Select rounds
      await page.getByTestId('max-rounds-select').selectOption('5');
      await expect(page.getByTestId('max-rounds-select')).toHaveValue('5');

      // Create game
      await page.getByTestId('create-game-button').click();

      // Should navigate to lobby
      await expect(page).toHaveURL(/\/game\/lobby\/[a-f0-9-]+/, { timeout: 10000 });
    });

    test('Player 1 can create a couple session', async ({ page }) => {
      await loginUser(page, 'bob@example.com', 'password123');
      await page.goto('/game');

      await page.getByTestId('session-type-select').selectOption('couple');
      await page.getByTestId('max-rounds-select').selectOption('10');
      await page.getByTestId('create-game-button').click();

      await expect(page).toHaveURL(/\/game\/lobby\/[a-f0-9-]+/);

      // Verify session type is displayed
      await expect(page.getByTestId('session-type-badge')).toHaveText('COUPLE');
    });

    test('Player 1 can create an adult session', async ({ page }) => {
      await loginUser(page, 'bob@example.com', 'password123');
      await page.goto('/game');

      await page.getByTestId('session-type-select').selectOption('adult');
      await page.getByTestId('max-rounds-select').selectOption('15');
      await page.getByTestId('create-game-button').click();

      await expect(page).toHaveURL(/\/game\/lobby\/[a-f0-9-]+/);
      await expect(page.getByTestId('session-type-badge')).toHaveText('ADULT');
    });

    test('Default values should be friends/10 rounds', async ({ page }) => {
      await loginUser(page, 'bob@example.com', 'password123');
      await page.goto('/game');

      await expect(page.getByTestId('session-type-select')).toHaveValue('friends');
      await expect(page.getByTestId('max-rounds-select')).toHaveValue('10');
    });
  });

  test.describe('2. Session Lobby - Player 1 Waiting', () => {
    test('Lobby displays session code correctly', async ({ page }) => {
      await loginUser(page, 'bob@example.com', 'password123');
      await page.goto('/game');
      await page.getByTestId('create-game-button').click();
      await expect(page).toHaveURL(/\/game\/lobby\/.+/);

      // Session code should be 6 characters
      const code = await getSessionCode(page);
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[A-Z0-9]{6}$/);
    });

    test('Copy button copies session code to clipboard', async ({ page }) => {
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

      await loginUser(page, 'bob@example.com', 'password123');
      await page.goto('/game');
      await page.getByTestId('create-game-button').click();

      const code = await getSessionCode(page);
      await page.getByTestId('copy-code-button').click();

      // Button should show copied state
      await expect(page.getByTestId('copy-code-button')).toContainText('Copied');

      // Clipboard should have the code
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toBe(code);
    });

    test('Shows player 1 as ready', async ({ page }) => {
      await loginUser(page, 'bob@example.com', 'password123');
      await page.goto('/game');
      await page.getByTestId('create-game-button').click();

      await expect(page.getByTestId('player1-status')).toContainText('Ready');
      await expect(page.getByTestId('player1-name')).toContainText('Player 1 (You)');
    });

    test('Shows player 2 as waiting', async ({ page }) => {
      await loginUser(page, 'bob@example.com', 'password123');
      await page.goto('/game');
      await page.getByTestId('create-game-button').click();

      await expect(page.getByTestId('player2-status')).toContainText('Waiting');
    });

    test('Shows auto-start message when waiting for player 2', async ({ page }) => {
      await loginUser(page, 'bob@example.com', 'password123');
      await page.goto('/game');
      await page.getByTestId('create-game-button').click();

      await expect(
        page.getByText('Game will start automatically when both players join')
      ).toBeVisible();
    });

    test('Cancel button returns to game home', async ({ page }) => {
      await loginUser(page, 'bob@example.com', 'password123');
      await page.goto('/game');
      await page.getByTestId('create-game-button').click();

      page.on('dialog', (dialog) => dialog.accept());
      await page.getByTestId('cancel-button').click();

      await expect(page).toHaveURL('/game');
    });

    test('Displays game settings correctly', async ({ page }) => {
      await loginUser(page, 'bob@example.com', 'password123');
      await page.goto('/game');

      await page.getByTestId('session-type-select').selectOption('couple');
      await page.getByTestId('max-rounds-select').selectOption('15');
      await page.getByTestId('create-game-button').click();

      await expect(page.getByTestId('session-type-display')).toHaveText('couple');
      await expect(page.getByTestId('max-rounds-display')).toHaveText('15');
      await expect(page.getByTestId('current-round-display')).toHaveText('1');
    });
  });

  test.describe('3. Player 2 Joining', () => {
    test('Player 2 can join with valid code', async ({ browser }) => {
      const player1Context = await browser.newContext();
      const player2Context = await browser.newContext();
      const player1Page = await player1Context.newPage();
      const player2Page = await player2Context.newPage();

      try {
        // Player 1 creates game
        await loginUser(player1Page, 'bob@example.com', 'password123');
        await player1Page.goto('/game');
        await player1Page.getByTestId('create-game-button').click();
        const sessionCode = await getSessionCode(player1Page);

        // Player 2 joins
        await loginUser(player2Page, 'carol@example.com', 'password123');
        await player2Page.goto('/game');

        await player2Page.getByTestId('join-code-input').fill(sessionCode);
        await expect(player2Page.getByTestId('join-game-button')).toBeEnabled();
        await player2Page.getByTestId('join-game-button').click();

        // Player 2 should go directly to play page (waiting for game to start)
        await expect(player2Page).toHaveURL(/\/game\/play\/.+/, { timeout: 10000 });
      } finally {
        await player1Context.close();
        await player2Context.close();
      }
    });

    test('Shows error for invalid session code', async ({ page }) => {
      await loginUser(page, 'carol@example.com', 'password123');
      await page.goto('/game');

      await page.getByTestId('join-code-input').fill('INVALID');
      await page.getByTestId('join-game-button').click();

      await expect(page.getByTestId('error-message')).toBeVisible();
      await expect(page.getByTestId('error-message')).toContainText('Session not found');
    });

    test('Shows error for non-existent session code', async ({ page }) => {
      await loginUser(page, 'carol@example.com', 'password123');
      await page.goto('/game');

      await page.getByTestId('join-code-input').fill('ZZZ999');
      await page.getByTestId('join-game-button').click();

      await expect(page.getByTestId('error-message')).toContainText('Session not found');
    });

    test('Join code input auto-formats to uppercase', async ({ page }) => {
      await loginUser(page, 'carol@example.com', 'password123');
      await page.goto('/game');

      await page.getByTestId('join-code-input').fill('abc123');
      await expect(page.getByTestId('join-code-input')).toHaveValue('ABC123');
    });

    test('Join button disabled with empty code', async ({ page }) => {
      await loginUser(page, 'carol@example.com', 'password123');
      await page.goto('/game');

      await expect(page.getByTestId('join-game-button')).toBeDisabled();
    });

    test('Join button disabled with code less than 6 characters', async ({ page }) => {
      await loginUser(page, 'carol@example.com', 'password123');
      await page.goto('/game');

      await page.getByTestId('join-code-input').fill('ABC12');
      await expect(page.getByTestId('join-game-button')).toBeDisabled();
    });
  });

  test.describe('4. Lobby - Both Players Ready', () => {
    test('Game starts when Player 1 clicks Start Game button', async ({ browser }) => {
      const player1Context = await browser.newContext();
      const player2Context = await browser.newContext();
      const player1Page = await player1Context.newPage();
      const player2Page = await player2Context.newPage();

      try {
        // Player 1 creates
        await loginUser(player1Page, 'bob@example.com', 'password123');
        await player1Page.goto('/game');
        await player1Page.getByTestId('create-game-button').click();
        const sessionCode = await getSessionCode(player1Page);
        const sessionId = player1Page.url().split('/').pop();

        // Player 2 joins and goes directly to play page
        await loginUser(player2Page, 'carol@example.com', 'password123');
        await player2Page.goto('/game');
        await player2Page.getByTestId('join-code-input').fill(sessionCode);
        await player2Page.getByTestId('join-game-button').click();

        // Player 2 should be on play page, waiting
        await expect(player2Page).toHaveURL(`/game/play/${sessionId}`, { timeout: 15000 });

        // Player 1 should see "Both Players Ready!" and start game button
        await expect(player1Page.getByText('Both Players Ready!')).toBeVisible({ timeout: 10000 });
        const startButton = player1Page.getByTestId('start-game-button');
        await expect(startButton).toBeVisible();

        // Player 1 clicks start game
        await startButton.click();

        // Both players should navigate to game play
        await expect(player1Page).toHaveURL(`/game/play/${sessionId}`, { timeout: 15000 });
        await expect(player2Page).toHaveURL(`/game/play/${sessionId}`, { timeout: 15000 });
      } finally {
        await player1Context.close();
        await player2Context.close();
      }
    });

    test('Shows Start Game button when both players ready', async ({ browser }) => {
      const player1Context = await browser.newContext();
      const player2Context = await browser.newContext();
      const player1Page = await player1Context.newPage();
      const player2Page = await player2Context.newPage();

      try {
        await loginUser(player1Page, 'bob@example.com', 'password123');
        await player1Page.goto('/game');
        await player1Page.getByTestId('create-game-button').click();
        const sessionCode = await getSessionCode(player1Page);

        // Player 2 joins
        await loginUser(player2Page, 'carol@example.com', 'password123');
        await player2Page.goto('/game');
        await player2Page.getByTestId('join-code-input').fill(sessionCode);
        await player2Page.getByTestId('join-game-button').click();

        // Player 1 should see "Both Players Ready!" and Start Game button
        await expect(player1Page.getByText('Both Players Ready!')).toBeVisible({ timeout: 10000 });
        await expect(player1Page.getByTestId('start-game-button')).toBeVisible();
      } finally {
        await player1Context.close();
        await player2Context.close();
      }
    });
  });

  test.describe('5. Auto-start Behavior', () => {
    test('Game starts when Player 1 clicks start button', async ({ browser }) => {
      const player1Context = await browser.newContext();
      const player2Context = await browser.newContext();
      const player1Page = await player1Context.newPage();
      const player2Page = await player2Context.newPage();

      try {
        await loginUser(player1Page, 'bob@example.com', 'password123');
        await player1Page.goto('/game');
        await player1Page.getByTestId('create-game-button').click();
        const sessionCode = await getSessionCode(player1Page);
        const sessionId = player1Page.url().split('/').pop();

        await loginUser(player2Page, 'carol@example.com', 'password123');
        await player2Page.goto('/game');
        await player2Page.getByTestId('join-code-input').fill(sessionCode);
        await player2Page.getByTestId('join-game-button').click();

        // Player 2 goes to play page, Player 1 stays on lobby
        await expect(player2Page).toHaveURL(`/game/play/${sessionId}`, { timeout: 15000 });

        // Player 1 sees start button and clicks it
        await expect(player1Page.getByTestId('start-game-button')).toBeVisible({ timeout: 10000 });
        await player1Page.getByTestId('start-game-button').click();

        // Both players should be on play page
        await expect(player1Page).toHaveURL(`/game/play/${sessionId}`, { timeout: 15000 });
        await expect(player2Page).toHaveURL(`/game/play/${sessionId}`, { timeout: 15000 });
      } finally {
        await player1Context.close();
        await player2Context.close();
      }
    });

    test('Player 2 does not see start button', async ({ browser }) => {
      const player1Context = await browser.newContext();
      const player2Context = await browser.newContext();
      const player1Page = await player1Context.newPage();
      const player2Page = await player2Context.newPage();

      try {
        await loginUser(player1Page, 'bob@example.com', 'password123');
        await player1Page.goto('/game');
        await player1Page.getByTestId('create-game-button').click();
        const sessionCode = await getSessionCode(player1Page);

        await loginUser(player2Page, 'carol@example.com', 'password123');
        await player2Page.goto('/game');
        await player2Page.getByTestId('join-code-input').fill(sessionCode);
        await player2Page.getByTestId('join-game-button').click();

        // Player 2 goes to play page and waits there (no lobby for them)
        await expect(player2Page).toHaveURL(/\/game\/play\/.+/, { timeout: 10000 });

        // Player 1 should see start button on lobby
        await expect(player1Page.getByTestId('start-game-button')).toBeVisible();
      } finally {
        await player1Context.close();
        await player2Context.close();
      }
    });
  });

  test.describe('6. Game Play - Round 1', () => {
    test('Player 1 sees "your turn" message', async ({ browser }) => {
      const player1Context = await browser.newContext();
      const player2Context = await browser.newContext();
      const player1Page = await player1Context.newPage();
      const player2Page = await player2Context.newPage();

      try {
        await startGameWithBothPlayers(player1Page, player2Page);

        // Player 1 should see their turn message
        await expect(player1Page.getByTestId('turn-message')).toContainText('Choose your option');
        await expect(player1Page.getByTestId('player-role')).toContainText('You are Player 1');
      } finally {
        await player1Context.close();
        await player2Context.close();
      }
    });

    test('Player 2 sees "waiting" message', async ({ browser }) => {
      const player1Context = await browser.newContext();
      const player2Context = await browser.newContext();
      const player1Page = await player1Context.newPage();
      const player2Page = await player2Context.newPage();

      try {
        await startGameWithBothPlayers(player1Page, player2Page);

        // Player 2 should see waiting message
        await expect(player2Page.getByTestId('turn-message')).toContainText('Waiting for Player 1');
      } finally {
        await player1Context.close();
        await player2Context.close();
      }
    });

    test('Displays 4 options for selection', async ({ browser }) => {
      const player1Context = await browser.newContext();
      const player2Context = await browser.newContext();
      const player1Page = await player1Context.newPage();
      const player2Page = await player2Context.newPage();

      try {
        await startGameWithBothPlayers(player1Page, player2Page);

        // Should show 4 options
        const options = player1Page.getByTestId('option-button');
        await expect(options).toHaveCount(4);
      } finally {
        await player1Context.close();
        await player2Context.close();
      }
    });

    test('Player 1 can select an option', async ({ browser }) => {
      const player1Context = await browser.newContext();
      const player2Context = await browser.newContext();
      const player1Page = await player1Context.newPage();
      const player2Page = await player2Context.newPage();

      try {
        await startGameWithBothPlayers(player1Page, player2Page);

        // Select first option
        const firstOption = player1Page.getByTestId('option-button').first();
        await firstOption.click();

        // Should show as selected
        await expect(firstOption).toHaveClass(/selected|bg-purple/);

        // Confirm button should be enabled
        await expect(player1Page.getByTestId('confirm-choice-button')).toBeEnabled();
      } finally {
        await player1Context.close();
        await player2Context.close();
      }
    });

    test('Player 1 confirms choice and Player 2 can guess', async ({ browser }) => {
      const player1Context = await browser.newContext();
      const player2Context = await browser.newContext();
      const player1Page = await player1Context.newPage();
      const player2Page = await player2Context.newPage();

      try {
        await startGameWithBothPlayers(player1Page, player2Page);

        // Player 1 selects and confirms
        await player1Page.getByTestId('option-button').first().click();
        await player1Page.getByTestId('confirm-choice-button').click();

        // Player 1 should see waiting message
        await expect(player1Page.getByTestId('turn-message')).toContainText('Waiting for Player 2');

        // Player 2 should now see their turn
        await expect(player2Page.getByTestId('turn-message')).toContainText('Guess Player 1', {
          timeout: 10000,
        });
      } finally {
        await player1Context.close();
        await player2Context.close();
      }
    });

    test('Displays round number and progress', async ({ browser }) => {
      const player1Context = await browser.newContext();
      const player2Context = await browser.newContext();
      const player1Page = await player1Context.newPage();
      const player2Page = await player2Context.newPage();

      try {
        await loginUser(player1Page, 'bob@example.com', 'password123');
        await player1Page.goto('/game');
        await player1Page.getByTestId('max-rounds-select').selectOption('5');
        await player1Page.getByTestId('create-game-button').click();
        const sessionCode = await getSessionCode(player1Page);
        const sessionId = player1Page.url().split('/').pop()!;

        await loginUser(player2Page, 'carol@example.com', 'password123');
        await player2Page.goto('/game');
        await player2Page.getByTestId('join-code-input').fill(sessionCode);
        await player2Page.getByTestId('join-game-button').click();

        // Wait for Player 2 to be on play page
        await expect(player2Page).toHaveURL(`/game/play/${sessionId}`, { timeout: 15000 });

        // Player 1 clicks start
        await expect(player1Page.getByTestId('start-game-button')).toBeVisible({ timeout: 10000 });
        await player1Page.getByTestId('start-game-button').click();

        // Wait for Player 1 to be on play page
        await expect(player1Page).toHaveURL(`/game/play/${sessionId}`, { timeout: 15000 });

        // Check round display
        await expect(player1Page.getByTestId('round-number')).toContainText('1 / 5');
        await expect(player2Page.getByTestId('round-number')).toContainText('1 / 5');
      } finally {
        await player1Context.close();
        await player2Context.close();
      }
    });

    test('Displays connection points', async ({ browser }) => {
      const player1Context = await browser.newContext();
      const player2Context = await browser.newContext();
      const player1Page = await player1Context.newPage();
      const player2Page = await player2Context.newPage();

      try {
        await startGameWithBothPlayers(player1Page, player2Page);

        // Initial points should be 0
        await expect(player1Page.getByTestId('connection-points')).toContainText('0');
        await expect(player2Page.getByTestId('connection-points')).toContainText('0');
      } finally {
        await player1Context.close();
        await player2Context.close();
      }
    });
  });

  test.describe('7. Round Completion', () => {
    test('Correct guess awards 10 points', async ({ browser }) => {
      const player1Context = await browser.newContext();
      const player2Context = await browser.newContext();
      const player1Page = await player1Context.newPage();
      const player2Page = await player2Context.newPage();

      try {
        await startGameWithBothPlayers(player1Page, player2Page);

        // Player 1 selects first option
        const player1Choice = player1Page.getByTestId('option-button').first();
        const choiceText = await player1Choice.textContent();
        await player1Choice.click();
        await player1Page.getByTestId('confirm-choice-button').click();

        // Player 2 guesses the same option
        const player2Options = player2Page.getByTestId('option-button');
        for (let i = 0; i < (await player2Options.count()); i++) {
          const option = player2Options.nth(i);
          if ((await option.textContent()) === choiceText) {
            await option.click();
            break;
          }
        }
        await player2Page.getByTestId('confirm-guess-button').click();

        // Points should be 10
        await expect(player1Page.getByTestId('connection-points')).toContainText('10', {
          timeout: 10000,
        });
        await expect(player2Page.getByTestId('connection-points')).toContainText('10', {
          timeout: 10000,
        });
      } finally {
        await player1Context.close();
        await player2Context.close();
      }
    });

    test('Shows result overlay with correct/incorrect message', async ({ browser }) => {
      const player1Context = await browser.newContext();
      const player2Context = await browser.newContext();
      const player1Page = await player1Context.newPage();
      const player2Page = await player2Context.newPage();

      try {
        await startGameWithBothPlayers(player1Page, player2Page);

        // Player 1 selects
        await player1Page.getByTestId('option-button').first().click();
        await player1Page.getByTestId('confirm-choice-button').click();

        // Player 2 guesses
        await player2Page.getByTestId('option-button').first().click();
        await player2Page.getByTestId('confirm-guess-button').click();

        // Result overlay should appear
        await expect(player1Page.getByTestId('result-overlay')).toBeVisible({ timeout: 10000 });
        await expect(player2Page.getByTestId('result-overlay')).toBeVisible({ timeout: 10000 });
      } finally {
        await player1Context.close();
        await player2Context.close();
      }
    });

    test('Progresses to next round after result shown', async ({ browser }) => {
      const player1Context = await browser.newContext();
      const player2Context = await browser.newContext();
      const player1Page = await player1Context.newPage();
      const player2Page = await player2Context.newPage();

      try {
        await startGameWithBothPlayers(player1Page, player2Page);

        // Complete round 1
        await player1Page.getByTestId('option-button').first().click();
        await player1Page.getByTestId('confirm-choice-button').click();
        await player2Page.getByTestId('option-button').first().click();
        await player2Page.getByTestId('confirm-guess-button').click();

        // Wait for result overlay
        await expect(player1Page.getByTestId('result-overlay')).toBeVisible({ timeout: 10000 });

        // Click next round (auto or manual)
        const nextButton = player1Page.getByTestId('next-round-button');
        if (await nextButton.isVisible({ timeout: 5000 })) {
          await nextButton.click();
        }

        // Should be on round 2
        await expect(player1Page.getByTestId('round-number')).toContainText('2', {
          timeout: 10000,
        });
      } finally {
        await player1Context.close();
        await player2Context.close();
      }
    });
  });

  test.describe('8. Game Completion', () => {
    test('Navigates to results after final round', async ({ browser }) => {
      const player1Context = await browser.newContext();
      const player2Context = await browser.newContext();
      const player1Page = await player1Context.newPage();
      const player2Page = await player2Context.newPage();

      try {
        // Create game with 1 round for quick test
        await loginUser(player1Page, 'bob@example.com', 'password123');
        await player1Page.goto('/game');
        await player1Page.getByTestId('max-rounds-select').selectOption('1');
        await player1Page.getByTestId('create-game-button').click();
        const sessionCode = await getSessionCode(player1Page);
        const sessionId = player1Page.url().split('/').pop()!;

        await loginUser(player2Page, 'carol@example.com', 'password123');
        await player2Page.goto('/game');
        await player2Page.getByTestId('join-code-input').fill(sessionCode);
        await player2Page.getByTestId('join-game-button').click();

        // Wait for Player 2 to be on play page
        await expect(player2Page).toHaveURL(`/game/play/${sessionId}`, { timeout: 15000 });

        // Player 1 clicks start
        await expect(player1Page.getByTestId('start-game-button')).toBeVisible({ timeout: 10000 });
        await player1Page.getByTestId('start-game-button').click();

        // Wait for Player 1 to be on play page
        await expect(player1Page).toHaveURL(`/game/play/${sessionId}`, { timeout: 15000 });

        // Complete the round
        await player1Page.getByTestId('option-button').first().click();
        await player1Page.getByTestId('confirm-choice-button').click();
        await player2Page.getByTestId('option-button').first().click();
        await player2Page.getByTestId('confirm-guess-button').click();

        // Should navigate to results
        await expect(player1Page).toHaveURL(/\/game\/results\/.+/, { timeout: 15000 });
        await expect(player2Page).toHaveURL(/\/game\/results\/.+/, { timeout: 15000 });
      } finally {
        await player1Context.close();
        await player2Context.close();
      }
    });
  });

  test.describe('9. Results Page', () => {
    test('Displays final statistics', async ({ page }) => {
      // Assuming there's a finished game in seed data
      await loginUser(page, 'bob@example.com', 'password123');
      await page.goto('/game');

      // Look for a finished session
      const sessions = page.getByTestId('session-item');
      const count = await sessions.count();

      for (let i = 0; i < count; i++) {
        const session = sessions.nth(i);
        const text = await session.textContent();

        if (text?.includes('FINISHED')) {
          await session.click();
          await expect(page).toHaveURL(/\/game\/results\/.+/);

          // Check stats are displayed
          await expect(page.getByTestId('total-points')).toBeVisible();
          await expect(page.getByTestId('correct-guesses')).toBeVisible();
          await expect(page.getByTestId('total-rounds')).toBeVisible();
          await expect(page.getByTestId('accuracy-percentage')).toBeVisible();
          break;
        }
      }
    });

    test('Displays connection message based on score', async ({ page }) => {
      await loginUser(page, 'bob@example.com', 'password123');
      await page.goto('/game');

      const sessions = page.getByTestId('session-item');
      const count = await sessions.count();

      for (let i = 0; i < count; i++) {
        const session = sessions.nth(i);
        const text = await session.textContent();

        if (text?.includes('FINISHED')) {
          await session.click();

          // Should show a connection message
          await expect(page.getByTestId('connection-message')).toBeVisible();
          break;
        }
      }
    });

    test('Shows round by round breakdown', async ({ page }) => {
      await loginUser(page, 'bob@example.com', 'password123');
      await page.goto('/game');

      const sessions = page.getByTestId('session-item');
      const count = await sessions.count();

      for (let i = 0; i < count; i++) {
        const session = sessions.nth(i);
        const text = await session.textContent();

        if (text?.includes('FINISHED')) {
          await session.click();

          // Should show round breakdown
          await expect(page.getByTestId('round-breakdown')).toBeVisible();
          break;
        }
      }
    });

    test('Play again button returns to game home', async ({ page }) => {
      await loginUser(page, 'bob@example.com', 'password123');
      await page.goto('/game');

      const sessions = page.getByTestId('session-item');
      const count = await sessions.count();

      for (let i = 0; i < count; i++) {
        const session = sessions.nth(i);
        const text = await session.textContent();

        if (text?.includes('FINISHED')) {
          await session.click();

          await page.getByTestId('play-again-button').click();
          await expect(page).toHaveURL('/game');
          break;
        }
      }
    });

    test('Back to dashboard button works', async ({ page }) => {
      await loginUser(page, 'bob@example.com', 'password123');
      await page.goto('/game');

      const sessions = page.getByTestId('session-item');
      const count = await sessions.count();

      for (let i = 0; i < count; i++) {
        const session = sessions.nth(i);
        const text = await session.textContent();

        if (text?.includes('FINISHED')) {
          await session.click();

          await page.getByTestId('back-to-dashboard-button').click();
          await expect(page).toHaveURL('/dashboard');
          break;
        }
      }
    });
  });

  test.describe('10. Session List Management', () => {
    test('Shows all user sessions on game home', async ({ page }) => {
      await loginUser(page, 'bob@example.com', 'password123');
      await page.goto('/game');

      await expect(page.getByTestId('my-sessions-section')).toBeVisible();
    });

    test('Clicking active session navigates to play', async ({ page }) => {
      await loginUser(page, 'bob@example.com', 'password123');
      await page.goto('/game');

      const sessions = page.getByTestId('session-item');
      const count = await sessions.count();

      for (let i = 0; i < count; i++) {
        const session = sessions.nth(i);
        const text = await session.textContent();

        if (text?.includes('ACTIVE')) {
          await session.click();
          await expect(page).toHaveURL(/\/game\/play\/.+/);
          break;
        }
      }
    });

    test('Clicking waiting session navigates to lobby', async ({ page }) => {
      await loginUser(page, 'bob@example.com', 'password123');
      await page.goto('/game');

      const sessions = page.getByTestId('session-item');
      const count = await sessions.count();

      for (let i = 0; i < count; i++) {
        const session = sessions.nth(i);
        const text = await session.textContent();

        if (text?.includes('WAITING')) {
          await session.click();
          await expect(page).toHaveURL(/\/game\/lobby\/.+/);
          break;
        }
      }
    });

    test('Sessions show correct badges for status and type', async ({ page }) => {
      await loginUser(page, 'bob@example.com', 'password123');
      await page.goto('/game');

      const firstSession = page.getByTestId('session-item').first();
      if (await firstSession.isVisible()) {
        const text = await firstSession.textContent();

        // Should have a status badge
        expect(text).toMatch(/WAITING|ACTIVE|FINISHED|CANCELLED/);

        // Should have a type badge
        expect(text).toMatch(/FRIENDS|COUPLE|ADULT/);
      }
    });
  });

  test.describe('11. Realtime Updates', () => {
    test('Player 1 lobby updates when Player 2 joins', async ({ browser }) => {
      const player1Context = await browser.newContext();
      const player2Context = await browser.newContext();
      const player1Page = await player1Context.newPage();
      const player2Page = await player2Context.newPage();

      try {
        await loginUser(player1Page, 'bob@example.com', 'password123');
        await player1Page.goto('/game');
        await player1Page.getByTestId('create-game-button').click();
        const sessionCode = await getSessionCode(player1Page);

        // Player 1 should see waiting
        await expect(player1Page.getByTestId('player2-status')).toContainText('Waiting');

        // Player 2 joins
        await loginUser(player2Page, 'carol@example.com', 'password123');
        await player2Page.goto('/game');
        await player2Page.getByTestId('join-code-input').fill(sessionCode);
        await player2Page.getByTestId('join-game-button').click();

        // Player 1 should see Player 2 joined (realtime update)
        await expect(player1Page.getByTestId('player2-status')).toContainText('Ready', {
          timeout: 10000,
        });
      } finally {
        await player1Context.close();
        await player2Context.close();
      }
    });

    test('Both players see realtime score updates', async ({ browser }) => {
      const player1Context = await browser.newContext();
      const player2Context = await browser.newContext();
      const player1Page = await player1Context.newPage();
      const player2Page = await player2Context.newPage();

      try {
        await startGameWithBothPlayers(player1Page, player2Page);

        // Initial points
        await expect(player1Page.getByTestId('connection-points')).toContainText('0');
        await expect(player2Page.getByTestId('connection-points')).toContainText('0');

        // Complete round
        await player1Page.getByTestId('option-button').first().click();
        await player1Page.getByTestId('confirm-choice-button').click();
        await player2Page.getByTestId('option-button').first().click();
        await player2Page.getByTestId('confirm-guess-button').click();

        // Both should see updated points
        await expect(player1Page.getByTestId('connection-points')).toContainText('10', {
          timeout: 10000,
        });
        await expect(player2Page.getByTestId('connection-points')).toContainText('10', {
          timeout: 10000,
        });
      } finally {
        await player1Context.close();
        await player2Context.close();
      }
    });
  });

  test.describe('12. Error Handling', () => {
    test('Handles network errors gracefully', async ({ page }) => {
      await loginUser(page, 'bob@example.com', 'password123');
      await page.goto('/game');

      // Simulate offline
      await page.context().setOffline(true);

      await page.getByTestId('create-game-button').click();

      // Should show error message
      await expect(page.getByTestId('error-toast')).toBeVisible({ timeout: 5000 });

      await page.context().setOffline(false);
    });

    test('Prevents joining full session', async ({ browser }) => {
      // This test assumes session can only have 2 players
      const player3Page = await browser.newPage();

      await loginUser(player3Page, 'alice@example.com', 'password123');
      await player3Page.goto('/game');

      // Try to join the existing session ABC123 which should be full
      await player3Page.getByTestId('join-code-input').fill('ABC123');
      await player3Page.getByTestId('join-game-button').click();

      await expect(player3Page.getByTestId('error-message')).toContainText('Session is full');

      await player3Page.close();
    });
  });
});
