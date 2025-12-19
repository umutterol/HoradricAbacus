import { test, expect } from '@playwright/test';

test.describe('Collaborative Session Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show Create Party and Join Party buttons when Supabase is configured', async ({ page }) => {
    // Wait for the session bar to appear
    const createPartyBtn = page.locator('button:has-text("Create Party")');
    const joinPartyBtn = page.locator('button:has-text("Join Party")');

    // If Supabase is configured, these buttons should be visible
    const isCreateVisible = await createPartyBtn.isVisible().catch(() => false);

    if (isCreateVisible) {
      await expect(createPartyBtn).toBeVisible();
      await expect(joinPartyBtn).toBeVisible();
    } else {
      // Supabase not configured - session bar is hidden
      console.log('Supabase not configured - skipping collaborative tests');
    }
  });

  test('should open Create Party dialog when clicking Create Party button', async ({ page }) => {
    const createPartyBtn = page.locator('button:has-text("Create Party")');

    const isVisible = await createPartyBtn.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    await createPartyBtn.click();

    // Dialog should appear
    const dialog = page.locator('.dialog');
    await expect(dialog).toBeVisible();

    // Should have the correct title
    const title = page.locator('.dialog-title');
    await expect(title).toContainText('Create');

    // Should have info text
    const infoText = page.locator('.info-text');
    await expect(infoText).toBeVisible();

    // Should have Create Party button inside dialog
    const createBtn = dialog.locator('button:has-text("Create Party")');
    await expect(createBtn).toBeVisible();
  });

  test('should create a session and show the code', async ({ page }) => {
    const createPartyBtn = page.locator('button:has-text("Create Party")');

    const isVisible = await createPartyBtn.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    await createPartyBtn.click();

    // Click create button in dialog
    const dialog = page.locator('.dialog');
    const createBtn = dialog.locator('button:has-text("Create Party")');
    await createBtn.click();

    // Wait for session to be created - should show code
    const codeDisplay = page.locator('.code-value');
    await expect(codeDisplay).toBeVisible({ timeout: 10000 });

    // Code should be 6 characters
    const code = await codeDisplay.textContent();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);

    // Should show success message
    const successText = page.locator('.success-text');
    await expect(successText).toBeVisible();

    // Should have copy buttons (code and link)
    const copyCodeBtn = page.locator('.copy-code-btn').first();
    const copyLinkBtn = page.locator('.copy-code-btn').nth(1);
    await expect(copyCodeBtn).toBeVisible();
    await expect(copyLinkBtn).toBeVisible();
  });

  test('should show session bar after creating a session', async ({ page }) => {
    const createPartyBtn = page.locator('button:has-text("Create Party")');

    const isVisible = await createPartyBtn.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    await createPartyBtn.click();

    const dialog = page.locator('.dialog');
    const createBtn = dialog.locator('button:has-text("Create Party")');
    await createBtn.click();

    // Wait for code to appear
    await expect(page.locator('.code-value')).toBeVisible({ timeout: 10000 });

    // Click Start Session to close dialog
    const startBtn = page.locator('button:has-text("Start Session")');
    await startBtn.click();

    // Session bar should now show active state
    const sessionBar = page.locator('.session-bar--active');
    await expect(sessionBar).toBeVisible();

    // Should show the session code in the bar
    const sessionCode = page.locator('.session-code-value');
    await expect(sessionCode).toBeVisible();

    // Should show player indicators
    const playerIndicators = page.locator('.player-indicator');
    await expect(playerIndicators).toHaveCount(4);

    // Should have Ready and Leave buttons
    const readyBtn = page.locator('button:has-text("Ready")');
    const leaveBtn = page.locator('button:has-text("Leave")');
    await expect(readyBtn).toBeVisible();
    await expect(leaveBtn).toBeVisible();
  });

  test('should toggle ready status', async ({ page }) => {
    const createPartyBtn = page.locator('button:has-text("Create Party")');

    const isVisible = await createPartyBtn.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    // Create session
    await createPartyBtn.click();
    const dialog = page.locator('.dialog');
    await dialog.locator('button:has-text("Create Party")').click();
    await expect(page.locator('.code-value')).toBeVisible({ timeout: 10000 });
    await page.locator('button:has-text("Start Session")').click();

    // Click Ready button
    const readyBtn = page.locator('button:has-text("Ready")');
    await readyBtn.click();

    // Button should now say "Not Ready"
    const notReadyBtn = page.locator('button:has-text("Not Ready")');
    await expect(notReadyBtn).toBeVisible();

    // Click again to toggle back
    await notReadyBtn.click();
    await expect(readyBtn).toBeVisible();
  });

  test('should leave session when clicking Leave button', async ({ page }) => {
    const createPartyBtn = page.locator('button:has-text("Create Party")');

    const isVisible = await createPartyBtn.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    // Create session
    await createPartyBtn.click();
    const dialog = page.locator('.dialog');
    await dialog.locator('button:has-text("Create Party")').click();
    await expect(page.locator('.code-value')).toBeVisible({ timeout: 10000 });
    await page.locator('button:has-text("Start Session")').click();

    // Click Leave button
    const leaveBtn = page.locator('button:has-text("Leave")');
    await leaveBtn.click();

    // Should go back to inactive session bar with Create/Join buttons
    const newCreateBtn = page.locator('button:has-text("Create Party")');
    await expect(newCreateBtn).toBeVisible();
  });

  test('should open Join Party dialog', async ({ page }) => {
    const joinPartyBtn = page.locator('button:has-text("Join Party")');

    const isVisible = await joinPartyBtn.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    await joinPartyBtn.click();

    // Dialog should appear
    const dialog = page.locator('.dialog');
    await expect(dialog).toBeVisible();

    // Should have code input
    const codeInput = page.locator('.code-input');
    await expect(codeInput).toBeVisible();

    // Should have Join button (disabled initially)
    const joinBtn = dialog.locator('button:has-text("Join")');
    await expect(joinBtn).toBeVisible();
    await expect(joinBtn).toBeDisabled();
  });

  test('should enable Join button when code is entered', async ({ page }) => {
    const joinPartyBtn = page.locator('button:has-text("Join Party")');

    const isVisible = await joinPartyBtn.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    await joinPartyBtn.click();

    const codeInput = page.locator('.code-input');
    const joinBtn = page.locator('.dialog button:has-text("Join")');

    // Type a 6-character code
    await codeInput.fill('ABC123');

    // Join button should now be enabled
    await expect(joinBtn).toBeEnabled();
  });

  test('should show error for invalid session code', async ({ page }) => {
    const joinPartyBtn = page.locator('button:has-text("Join Party")');

    const isVisible = await joinPartyBtn.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    await joinPartyBtn.click();

    const codeInput = page.locator('.code-input');
    const joinBtn = page.locator('.dialog button:has-text("Join")');

    // Enter invalid code
    await codeInput.fill('XXXXXX');
    await joinBtn.click();

    // Should show error
    const errorText = page.locator('.error-text');
    await expect(errorText).toBeVisible({ timeout: 5000 });
  });

  test('should show "You" label for own slot in collaborative mode', async ({ page }) => {
    const createPartyBtn = page.locator('button:has-text("Create Party")');

    const isVisible = await createPartyBtn.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    // Create session
    await createPartyBtn.click();
    const dialog = page.locator('.dialog');
    await dialog.locator('button:has-text("Create Party")').click();
    await expect(page.locator('.code-value')).toBeVisible({ timeout: 10000 });
    await page.locator('button:has-text("Start Session")').click();

    // Should show "You" label for first player
    const youLabel = page.locator('.you-label');
    await expect(youLabel).toBeVisible();
    await expect(youLabel).toHaveText('You');
  });

  test('should allow host to edit disconnected slots for manual entry', async ({ page }) => {
    const createPartyBtn = page.locator('button:has-text("Create Party")');

    const isVisible = await createPartyBtn.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    // Create session
    await createPartyBtn.click();
    const dialog = page.locator('.dialog');
    await dialog.locator('button:has-text("Create Party")').click();
    await expect(page.locator('.code-value')).toBeVisible({ timeout: 10000 });
    await page.locator('button:has-text("Start Session")').click();

    // First player name should be editable (my slot)
    const firstPlayerName = page.locator('.player-name').first();
    await expect(firstPlayerName).toBeEnabled();

    // Host can edit disconnected slots for manual entry (player name)
    const secondPlayerName = page.locator('.player-name').nth(1);
    await expect(secondPlayerName).toBeEnabled();

    // Verify we can actually type in the disconnected slot name
    await secondPlayerName.fill('Friend1');
    await expect(secondPlayerName).toHaveValue('Friend1');

    // First player's material input should be editable (active slot)
    const firstMaterialInput = page.locator('.material-row').first().locator('.material-input').first();
    await expect(firstMaterialInput).toBeEnabled();

    // Host can toggle disconnected slots
    const secondToggle = page.locator('.player-toggle-btn').nth(1);
    await expect(secondToggle).toBeEnabled();
  });
});

test.describe('Multi-Browser Collaborative Session', () => {
  test('should allow two browsers to join the same session', async ({ browser }) => {
    // Create two browser contexts (simulating two users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await page1.goto('/');
    await page2.goto('/');

    // Check if Supabase is configured
    const createPartyBtn = page1.locator('button:has-text("Create Party")');
    const isVisible = await createPartyBtn.isVisible().catch(() => false);

    if (!isVisible) {
      await context1.close();
      await context2.close();
      test.skip();
      return;
    }

    // User 1: Create session
    await createPartyBtn.click();
    const dialog = page1.locator('.dialog');
    await dialog.locator('button:has-text("Create Party")').click();

    // Wait for code
    const codeDisplay = page1.locator('.code-value');
    await expect(codeDisplay).toBeVisible({ timeout: 10000 });
    const sessionCode = await codeDisplay.textContent();

    // Start session
    await page1.locator('button:has-text("Start Session")').click();

    // User 2: Join session with the code
    const joinPartyBtn = page2.locator('button:has-text("Join Party")');
    await joinPartyBtn.click();

    const codeInput = page2.locator('.code-input');
    await codeInput.fill(sessionCode!);

    const joinBtn = page2.locator('.dialog button:has-text("Join")');
    await joinBtn.click();

    // Both should now be in the session
    await expect(page1.locator('.session-bar--active')).toBeVisible();
    await expect(page2.locator('.session-bar--active')).toBeVisible();

    // User 1 should see 2 connected players
    await page1.waitForTimeout(1000); // Wait for realtime update

    // User 2 should have their own "You" label on slot 2
    const youLabel2 = page2.locator('.you-label');
    await expect(youLabel2).toBeVisible();

    // Clean up
    await context1.close();
    await context2.close();
  });
});
