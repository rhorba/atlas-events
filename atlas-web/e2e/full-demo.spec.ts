/**
 * Atlas Events v1.0 — Full Demo Recording
 *
 * A single end-to-end walk-through of every critical user flow, designed to
 * produce one continuous Playwright video that covers the complete application.
 *
 * Flows covered:
 *  1.  Navigation bar & language toggle (FR → AR → FR)
 *  2.  Event list: loading / empty / error states
 *  3.  City filter, category filter, date-range filter, reset
 *  4.  Calendar page
 *  5.  Event submit form: render, fill all fields, validation, submit attempt
 *  6.  Admin login: invalid credentials → error message
 *  7.  Admin login: valid credentials → redirect (or graceful error if API is down)
 *  8.  Guard: direct access to /admin/submissions → redirected to /admin/login
 *  9.  Admin submissions page (shown if login succeeds)
 * 10.  Admin events page
 * 11.  Admin scraper health page
 */

import { test, expect } from '@playwright/test';

// Force video: 'on' for this file regardless of playwright.config.ts setting
test.use({ video: 'on' });
// This is a full walkthrough — give it 3 minutes
test.setTimeout(180_000);

const PAUSE = 1500;   // standard pause between steps (ms)
const LONG  = 2500;   // pause after page load or API call

test('Atlas Events v1.0 — full application demo', async ({ page }) => {

  // ─────────────────────────────────────────────────────────
  // 1. HOMEPAGE — Event List
  // ─────────────────────────────────────────────────────────
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveTitle(/atlas/i);
  await page.waitForTimeout(LONG);                   // show the page settling

  // Verify nav bar is visible
  await expect(page.locator('.app-nav')).toBeVisible();
  await expect(page.locator('.nav-brand')).toHaveText('Atlas Events');
  await page.waitForTimeout(PAUSE);

  // ─────────────────────────────────────────────────────────
  // 2. LANGUAGE TOGGLE — FR → AR → FR
  // ─────────────────────────────────────────────────────────
  const arBtn = page.locator('.lang-btn', { hasText: 'AR' });
  const frBtn = page.locator('.lang-btn', { hasText: 'FR' });

  await arBtn.click();
  await page.waitForTimeout(LONG);                   // show Arabic UI (RTL)

  await frBtn.click();
  await page.waitForTimeout(PAUSE);                  // back to French

  // ─────────────────────────────────────────────────────────
  // 3. FILTERS — City, Category, Date range
  // ─────────────────────────────────────────────────────────
  const [citySelect, categorySelect, rangeSelect] = await page
    .locator('.filter-select')
    .all();

  // City filter: select Casablanca
  await citySelect.selectOption('casablanca');
  await page.waitForTimeout(PAUSE);

  // Category filter: select Technology
  await categorySelect.selectOption('technology');
  await page.waitForTimeout(PAUSE);

  // Date range: this week
  await rangeSelect.selectOption('week');
  await page.waitForTimeout(PAUSE);

  // Reset filters button (appears when at least one filter is active)
  const resetBtn = page.locator('.btn-reset').first();
  if (await resetBtn.isVisible()) {
    await resetBtn.click();
    await page.waitForTimeout(PAUSE);
  }

  // Reset via URL / all filters cleared
  await citySelect.selectOption('');
  await categorySelect.selectOption('');
  await rangeSelect.selectOption('');
  await page.waitForTimeout(PAUSE);

  // ─────────────────────────────────────────────────────────
  // 4. CALENDAR PAGE
  // ─────────────────────────────────────────────────────────
  await page.locator('.nav-links a', { hasText: /calendrier|calendar/i }).click();
  await page.waitForURL(/\/calendar/);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(LONG);

  await expect(page.locator('app-calendar, .fc, .calendar-page').first()).toBeVisible({ timeout: 8000 });
  await page.waitForTimeout(LONG);

  // ─────────────────────────────────────────────────────────
  // 5. SUBMIT FORM — full fill & submit attempt
  // ─────────────────────────────────────────────────────────
  await page.locator('.nav-links a', { hasText: /soumettre|submit/i }).click();
  await page.waitForURL(/\/submit/);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(PAUSE);

  await expect(page.locator('app-submit-form, .submit-page').first()).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(PAUSE);

  // Fill every required field
  await page.locator('#titleFr').fill('Conférence Tech Maroc 2026');
  await page.waitForTimeout(400);

  await page.locator('#startDate').fill('2026-09-15');
  await page.waitForTimeout(400);

  await page.locator('#city').selectOption('casablanca');
  await page.waitForTimeout(400);

  await page.locator('#category').selectOption('technology');
  await page.waitForTimeout(400);

  await page.locator('#organizer').fill('Atlas Tech Hub');
  await page.waitForTimeout(400);

  await page.locator('#registrationUrl').fill('https://techmaroc.ma/conference-2026');
  await page.waitForTimeout(400);

  await page.locator('#contactEmail').fill('contact@techmaroc.ma');
  await page.waitForTimeout(400);

  await page.locator('#description').fill(
    'La plus grande conférence technologique du Maroc. Rejoignez des experts internationaux pour explorer l\'IA, la blockchain et l\'innovation digitale.'
  );
  await page.waitForTimeout(PAUSE);                  // show the completed form

  // Submit (API may be down — shows error banner which is intentional)
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(LONG);                   // show result (success or error)

  // ─────────────────────────────────────────────────────────
  // 6. ADMIN — Guard: direct access → redirect to login
  // ─────────────────────────────────────────────────────────
  await page.goto('/admin/submissions');
  await page.waitForTimeout(PAUSE);
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.waitForTimeout(PAUSE);

  // ─────────────────────────────────────────────────────────
  // 7. ADMIN LOGIN — invalid credentials → error
  // ─────────────────────────────────────────────────────────
  await expect(page.locator('.login-card')).toBeVisible({ timeout: 5000 });

  await page.locator('#username').fill('hacker');
  await page.waitForTimeout(300);
  await page.locator('#password').fill('wrongpassword');
  await page.waitForTimeout(300);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(LONG);

  // Show error message (if API is down, network error also triggers .error-msg)
  const errorMsg = page.locator('.error-msg');
  await page.waitForTimeout(PAUSE);

  // ─────────────────────────────────────────────────────────
  // 8. ADMIN LOGIN — valid credentials
  // ─────────────────────────────────────────────────────────
  await page.locator('#username').fill('');
  await page.locator('#username').fill(process.env['E2E_ADMIN_USER'] ?? 'admin');
  await page.waitForTimeout(300);
  await page.locator('#password').fill('');
  await page.locator('#password').fill(process.env['E2E_ADMIN_PASS'] ?? 'admin_local_password');
  await page.waitForTimeout(300);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(LONG);

  const currentUrl = page.url();

  if (currentUrl.includes('/admin/submissions')) {
    // ───────────────────────────────────────────────────────
    // 9. ADMIN SUBMISSIONS DASHBOARD (API running)
    // ───────────────────────────────────────────────────────
    await expect(page.locator('app-admin-submissions, .admin-submissions').first()).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(LONG);

    // ───────────────────────────────────────────────────────
    // 10. ADMIN EVENTS MANAGEMENT
    // ───────────────────────────────────────────────────────
    await page.locator('a', { hasText: /événements|events/i }).first().click();
    await page.waitForURL(/\/admin\/events/);
    await page.waitForTimeout(LONG);

    // ───────────────────────────────────────────────────────
    // 11. ADMIN SCRAPER HEALTH
    // ───────────────────────────────────────────────────────
    await page.locator('a', { hasText: /scraper|collecte/i }).first().click();
    await page.waitForURL(/\/admin\/scrape/);
    await page.waitForTimeout(LONG);

  } else {
    // API is down: stay on login page showing the error state
    // This is still a valid demo — shows auth error handling
    await page.waitForTimeout(PAUSE);
    // Navigate to each admin route to show the guard in action
    for (const route of ['/admin/submissions', '/admin/events', '/admin/scrape']) {
      await page.goto(route);
      await page.waitForTimeout(PAUSE);
      // Guard redirects to /admin/login each time
      await expect(page).toHaveURL(/\/admin\/login/);
      await page.waitForTimeout(800);
    }
  }

  // ─────────────────────────────────────────────────────────
  // FINAL — back to event list homepage
  // ─────────────────────────────────────────────────────────
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(LONG);
  await expect(page.locator('.app-nav')).toBeVisible();
  await page.waitForTimeout(PAUSE);                  // end on homepage
});
