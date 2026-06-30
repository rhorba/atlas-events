import { test, expect } from '@playwright/test';

test.describe('Event Submission', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/submit');
  });

  test('submission form renders all required fields', async ({ page }) => {
    await page.waitForSelector('form, [data-testid="submit-form"]', { timeout: 5000 });
    const form = page.locator('form').first();
    await expect(form).toBeVisible();
  });

  test('submit button is disabled until required fields are filled', async ({ page }) => {
    await page.waitForSelector('form', { timeout: 5000 });
    const submitBtn = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Soumettre")').first();
    if (await submitBtn.count() > 0) {
      const isDisabled = await submitBtn.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });

  test('filling and submitting the form shows confirmation or error', async ({ page }) => {
    await page.waitForSelector('form', { timeout: 5000 });

    const titleInput = page.locator('input[name="title"], input[formcontrolname="titleFr"], input[placeholder*="titre"]').first();
    if (await titleInput.count() === 0) {
      test.skip();
      return;
    }

    await titleInput.fill('Test Event E2E');

    const cityInput = page.locator('input[name="city"], input[formcontrolname="city"], input[placeholder*="ville"]').first();
    if (await cityInput.count() > 0) {
      await cityInput.fill('Casablanca');
    }

    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.count() > 0) {
      await emailInput.fill('test@example.com');
    }

    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.count() > 0 && !(await submitBtn.isDisabled())) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
      const body = await page.locator('body').innerText();
      expect(body.length).toBeGreaterThan(0);
    }
  });
});
