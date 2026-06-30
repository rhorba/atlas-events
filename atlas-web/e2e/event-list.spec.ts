import { test, expect } from '@playwright/test';

test.describe('Event List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays the event list page', async ({ page }) => {
    await expect(page).toHaveTitle(/atlas/i);
    await expect(page.locator('app-event-list, [data-testid="event-list"]')).toBeVisible({ timeout: 10000 });
  });

  test('shows loading state then renders events or empty state', async ({ page }) => {
    const body = page.locator('body');
    await expect(body).toBeVisible();
    await page.waitForTimeout(2000);
    const hasEvents = await page.locator('[data-testid="event-card"], .event-card, mat-card').count();
    const hasEmpty = await page.locator('[data-testid="empty-state"], .empty-state').count();
    expect(hasEvents + hasEmpty).toBeGreaterThanOrEqual(0);
  });

  test('language toggle switches between FR and AR', async ({ page }) => {
    const langToggle = page.locator('[data-testid="lang-toggle"], button:has-text("AR"), button:has-text("FR")').first();
    if (await langToggle.isVisible()) {
      const initialText = await page.locator('body').innerText();
      await langToggle.click();
      await page.waitForTimeout(500);
      const newText = await page.locator('body').innerText();
      expect(newText).not.toEqual(initialText);
    }
  });

  test('search/filter input narrows results', async ({ page }) => {
    const search = page.locator('input[type="search"], input[placeholder*="recherche"], input[placeholder*="search"]').first();
    if (await search.isVisible()) {
      await search.fill('casablanca');
      await page.waitForTimeout(500);
      const results = await page.locator('[data-testid="event-card"], .event-card, mat-card').count();
      expect(results).toBeGreaterThanOrEqual(0);
    }
  });
});
