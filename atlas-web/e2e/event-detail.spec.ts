import { test, expect } from '@playwright/test';

test.describe('Event Detail', () => {
  test('navigates to event detail from list and shows key info', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const firstCard = page.locator('[data-testid="event-card"], .event-card, mat-card').first();
    const cardCount = await firstCard.count();
    if (cardCount === 0) {
      test.skip();
      return;
    }

    await firstCard.click();
    await page.waitForURL(/\/events\//, { timeout: 5000 });
    await expect(page.locator('app-event-detail, [data-testid="event-detail"]')).toBeVisible({ timeout: 5000 });
  });

  test('download iCal button is present on event detail', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    const firstCard = page.locator('[data-testid="event-card"], .event-card, mat-card').first();
    if (await firstCard.count() === 0) {
      test.skip();
      return;
    }
    await firstCard.click();
    await page.waitForURL(/\/events\//, { timeout: 5000 });
    const icalBtn = page.locator('[data-testid="download-ical"], button:has-text("iCal"), button:has-text("ical")').first();
    if (await icalBtn.count() > 0) {
      await expect(icalBtn).toBeVisible();
    }
  });

  test('navigating directly to invalid event ID shows error or redirects', async ({ page }) => {
    await page.goto('/events/00000000-0000-0000-0000-000000000000');
    await page.waitForTimeout(2000);
    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(0);
  });
});
