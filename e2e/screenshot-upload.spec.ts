import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Screenshot Upload Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have screenshot upload buttons for each player', async ({ page }) => {
    const screenshotButtons = page.locator('button.player-screenshot-btn');
    // Should have 4 buttons (one per player column)
    await expect(screenshotButtons).toHaveCount(4);
  });

  test('should open modal when screenshot button is clicked', async ({ page }) => {
    const firstScreenshotButton = page.locator('button.player-screenshot-btn').first();
    await firstScreenshotButton.click();

    // Modal should be visible (using screenshot-overlay class)
    const modal = page.locator('.screenshot-overlay');
    await expect(modal).toBeVisible();
  });

  test('should close modal when close button is clicked', async ({ page }) => {
    const firstScreenshotButton = page.locator('button.player-screenshot-btn').first();
    await firstScreenshotButton.click();

    const modal = page.locator('.screenshot-overlay');
    await expect(modal).toBeVisible();

    // Click close button (X button with screenshot-close class)
    const closeButton = page.locator('.screenshot-close');
    await closeButton.click();

    await expect(modal).toBeHidden();
  });

  test('should close modal when clicking overlay', async ({ page }) => {
    const firstScreenshotButton = page.locator('button.player-screenshot-btn').first();
    await firstScreenshotButton.click();

    const modal = page.locator('.screenshot-overlay');
    await expect(modal).toBeVisible();

    // Click the overlay area (not the dialog)
    await modal.click({ position: { x: 10, y: 10 } });

    await expect(modal).toBeHidden();
  });

  test('should have file input for image upload', async ({ page }) => {
    const firstScreenshotButton = page.locator('button.player-screenshot-btn').first();
    await firstScreenshotButton.click();

    const fileInput = page.locator('.screenshot-dialog input[type="file"]');
    await expect(fileInput).toBeAttached();

    // Should accept images
    const acceptAttr = await fileInput.getAttribute('accept');
    expect(acceptAttr).toContain('image');
  });

  test('should show drop zone hint text', async ({ page }) => {
    const firstScreenshotButton = page.locator('button.player-screenshot-btn').first();
    await firstScreenshotButton.click();

    // Check for drop zone or upload hint text
    const modal = page.locator('.screenshot-dialog');
    const dropText = modal.getByText(/drop|upload|drag|click/i);
    await expect(dropText.first()).toBeVisible();
  });

  test('should handle paste from clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const firstScreenshotButton = page.locator('button.player-screenshot-btn').first();
    await firstScreenshotButton.click();

    // The modal should be listening for paste events
    const modal = page.locator('.screenshot-overlay');
    await expect(modal).toBeVisible();

    // Verify paste hint is shown (inside the dialog)
    const dialog = page.locator('.screenshot-dialog');
    const pasteHint = dialog.getByText(/paste|ctrl.*v|cmd.*v/i);
    await expect(pasteHint.first()).toBeVisible();
  });
});

test.describe('Screenshot Upload - File Upload Flow', () => {
  // Create a simple test image for upload tests
  const testImagePath = path.join(__dirname, 'test-image.png');

  test.beforeAll(async () => {
    // Create a simple 1x1 pixel PNG for testing
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xd7, 0x63, 0xf8, 0xff, 0xff, 0x3f,
      0x00, 0x05, 0xfe, 0x02, 0xfe, 0xdc, 0xcc, 0x59,
      0xe7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
      0x44, 0xae, 0x42, 0x60, 0x82
    ]);
    fs.writeFileSync(testImagePath, pngBuffer);
  });

  test.afterAll(async () => {
    // Cleanup test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  });

  test('should accept image file upload', async ({ page }) => {
    await page.goto('/');

    const firstScreenshotButton = page.locator('button.player-screenshot-btn').first();
    await firstScreenshotButton.click();

    const modal = page.locator('.screenshot-overlay');
    await expect(modal).toBeVisible();

    // Upload the test image
    const fileInput = page.locator('.screenshot-dialog input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Should show some processing state or preview
    // Wait a moment for processing to start
    await page.waitForTimeout(500);

    // At least the modal should still be visible
    await expect(modal).toBeVisible();
  });
});
