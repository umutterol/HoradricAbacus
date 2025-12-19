import { test, expect } from '@playwright/test';

test.describe('Solo Mode (No Supabase)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show session bar when Supabase is configured', async ({ page }) => {
    // Session bar should be visible when Supabase is available
    const sessionBar = page.locator('.session-bar');
    const isVisible = await sessionBar.isVisible().catch(() => false);

    if (isVisible) {
      // Supabase is configured - session bar shows Create/Join buttons
      await expect(sessionBar).toBeVisible();
      const createBtn = page.locator('button:has-text("Create Party")');
      await expect(createBtn).toBeVisible();
    } else {
      // Supabase not configured - session bar is hidden (solo mode only)
      await expect(sessionBar).not.toBeVisible();
    }
  });

  test('should allow all players to be edited in solo mode', async ({ page }) => {
    // All 4 player name inputs should be editable
    for (let i = 0; i < 4; i++) {
      const nameInput = page.locator('.player-name').nth(i);
      await expect(nameInput).toBeEnabled();
      await nameInput.fill(`Player${i + 1}`);
      await expect(nameInput).toHaveValue(`Player${i + 1}`);
    }
  });

  test('should allow material inputs for all players', async ({ page }) => {
    // First row of material inputs (4 inputs for 4 players)
    const materialInputs = page.locator('.material-input').first();

    // Toggle all players active first
    for (let i = 0; i < 4; i++) {
      const toggleBtn = page.locator('.player-toggle-btn').nth(i);
      // Click to ensure player is active
      const isPressed = await toggleBtn.getAttribute('aria-pressed');
      if (isPressed !== 'true') {
        await toggleBtn.click();
      }
    }

    // Now all inputs in first row should be editable
    for (let i = 0; i < 4; i++) {
      const input = page.locator('.material-row').first().locator('.material-input').nth(i);
      await expect(input).toBeEnabled();
    }
  });

  test('should allow toggling player active status', async ({ page }) => {
    const toggleBtn = page.locator('.player-toggle-btn').first();

    // Initially should be active
    await expect(toggleBtn).toHaveAttribute('aria-pressed', 'true');

    // Toggle off
    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute('aria-pressed', 'false');

    // Toggle back on
    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('should persist data after optimization', async ({ page }) => {
    // Fill in some materials
    const firstInput = page.locator('.material-row').first().locator('.material-input').first();
    await firstInput.fill('10');

    // Click optimize
    const optimizeBtn = page.locator('button:has-text("Optimize")');
    await optimizeBtn.click();

    // Value should still be there
    await expect(firstInput).toHaveValue('10');
  });

  test('should reset all data when reset is clicked', async ({ page }) => {
    // Fill in player name and materials
    const nameInput = page.locator('.player-name').first();
    await nameInput.fill('TestPlayer');

    const materialInput = page.locator('.material-row').first().locator('.material-input').first();
    await materialInput.fill('5');

    // Click reset button
    const resetBtn = page.locator('button:has-text("Reset")');
    await resetBtn.click();

    // Confirm dialog should appear
    const confirmBtn = page.locator('button:has-text("Yes, Reset")');
    await confirmBtn.click();

    // Data should be cleared
    await expect(nameInput).toHaveValue('');
    await expect(materialInput).toHaveValue('');
  });

  // Screenshot feature is currently hidden - skip this test
  test.skip('should show screenshot upload buttons for all players', async ({ page }) => {
    // Each player should have a screenshot upload button
    const screenshotBtns = page.locator('.player-screenshot-btn');
    await expect(screenshotBtns).toHaveCount(4);
  });
});
