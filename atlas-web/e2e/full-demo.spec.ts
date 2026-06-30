/**
 * Atlas Events v1.0 — Full Demo Recording (real data, no mocks)
 *
 * Runs against the live Docker Compose stack:
 *   web  → http://localhost:4200
 *   api  → http://localhost:8080
 *
 * Flows covered:
 *  1.  Event list: 15 real events from DB
 *  2.  Language toggle: FR → AR (RTL layout) → back to FR
 *  3.  Filters: city (Casablanca) → reset
 *  4.  Event detail: click card → detail page
 *  5.  Calendar page
 *  6.  Submit form: fill all fields → submit → real 201 response
 *  7.  Admin guard: /admin/submissions without login → redirect to /admin/login
 *  8.  Admin login: wrong credentials → error message
 *  9.  Admin login: correct credentials → redirect to submissions dashboard
 * 10.  Admin events: list 15 events → open edit form → save
 * 11.  Admin scraper: view logs table → trigger scrape
 * 12.  Return to homepage
 */

import { test, expect } from '@playwright/test';

test.use({ video: 'on' });
test.setTimeout(300_000);

const pause = (ms: number) => new Promise(r => setTimeout(r, ms));
const STEP = 1500;
const PAGE = 2500;

test('Atlas Events v1.0 — full application demo (real data)', async ({ page }) => {

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. EVENT LIST — homepage with real events from DB
  // ═══════════════════════════════════════════════════════════════════════════
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await pause(PAGE);

  await expect(page.locator('.app-nav')).toBeVisible();
  await expect(page.locator('app-event-card').first()).toBeVisible({ timeout: 10_000 });
  await pause(PAGE);   // show the full event list


  // ═══════════════════════════════════════════════════════════════════════════
  // 2. LANGUAGE TOGGLE  FR → AR → FR
  // ═══════════════════════════════════════════════════════════════════════════
  const arBtn = page.locator('.lang-btn', { hasText: 'AR' });
  const frBtn = page.locator('.lang-btn', { hasText: 'FR' });

  await arBtn.click();
  await pause(PAGE);        // show Arabic layout (RTL)

  await frBtn.click();
  await pause(STEP);        // back to French


  // ═══════════════════════════════════════════════════════════════════════════
  // 3. FILTERS — city filter (Casablanca → results → reset)
  // ═══════════════════════════════════════════════════════════════════════════
  const filterSelects = page.locator('.filter-select');
  const citySelect     = filterSelects.nth(0);
  const rangeSelect    = filterSelects.nth(2);

  // City: Casablanca (multiple events)
  await citySelect.selectOption('casablanca');
  await page.waitForLoadState('networkidle');
  await pause(PAGE);

  // Date range: month
  await rangeSelect.selectOption('month');
  await page.waitForLoadState('networkidle');
  await pause(STEP);

  // Reset
  const resetBtn = page.locator('.btn-reset').first();
  if (await resetBtn.isVisible()) {
    await resetBtn.click();
  } else {
    await rangeSelect.selectOption('');
    await citySelect.selectOption('');
  }
  await page.waitForLoadState('networkidle');
  await pause(STEP);


  // ═══════════════════════════════════════════════════════════════════════════
  // 4. EVENT DETAIL — click first card
  // ═══════════════════════════════════════════════════════════════════════════
  const firstCard = page.locator('app-event-card').first();
  await firstCard.locator('.title-link').click();
  await page.waitForURL(/\/events\//);
  await page.waitForLoadState('networkidle');
  await pause(PAGE);

  await expect(page.locator('app-event-detail, .event-detail').first()).toBeVisible({ timeout: 8000 });
  await pause(PAGE);

  await page.goBack();
  await page.waitForLoadState('networkidle');
  await pause(STEP);


  // ═══════════════════════════════════════════════════════════════════════════
  // 5. CALENDAR PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  await page.locator('.nav-links a', { hasText: /calendrier|calendar/i }).click();
  await page.waitForURL(/\/calendar/);
  await page.waitForLoadState('networkidle');
  await pause(PAGE);

  await expect(page.locator('app-calendar').first()).toBeVisible({ timeout: 8000 });
  await pause(PAGE);


  // ═══════════════════════════════════════════════════════════════════════════
  // 6. SUBMIT FORM — fill all fields, submit → real 201
  // ═══════════════════════════════════════════════════════════════════════════
  await page.locator('.nav-links a', { hasText: /soumettre|submit/i }).click();
  await page.waitForURL(/\/submit/);
  await page.waitForLoadState('networkidle');
  await pause(STEP);

  await expect(page.locator('.submit-page').first()).toBeVisible({ timeout: 5000 });

  await page.locator('#titleFr').fill('Conférence Tech Maroc 2026');
  await pause(300);

  await page.locator('#startDate').fill('2026-09-15');
  await pause(300);

  await page.locator('#city').selectOption('casablanca');
  await pause(300);

  await page.locator('#category').selectOption('technology');
  await pause(300);

  await page.locator('#organizer').fill('Atlas Tech Hub');
  await pause(300);

  await page.locator('#registrationUrl').fill('https://techmaroc.ma/conference-2026');
  await pause(300);

  await page.locator('#contactEmail').fill('contact@techmaroc.ma');
  await pause(300);

  await page.locator('#description').fill(
    'La plus grande conférence technologique du Maroc. Rejoignez des experts pour explorer l\'IA, la blockchain et l\'innovation digitale.'
  );
  await pause(PAGE);    // show completed form

  await page.locator('button[type="submit"]').click();
  await pause(PAGE * 2);    // wait for real API call + show result

  await expect(page.locator('.success-state, .success-message').first()).toBeVisible({ timeout: 10_000 });
  await pause(PAGE);


  // ═══════════════════════════════════════════════════════════════════════════
  // 7. ADMIN GUARD — direct access → redirect to login
  // ═══════════════════════════════════════════════════════════════════════════
  await page.goto('/admin/submissions');
  await pause(STEP);
  await expect(page).toHaveURL(/\/admin\/login/);
  await pause(STEP);


  // ═══════════════════════════════════════════════════════════════════════════
  // 8. ADMIN LOGIN — wrong credentials → error
  // ═══════════════════════════════════════════════════════════════════════════
  await expect(page.locator('.login-card')).toBeVisible({ timeout: 5000 });

  await page.locator('#username').fill('hacker');
  await pause(400);
  await page.locator('#password').fill('wrongpassword');
  await pause(400);
  await page.locator('button[type="submit"]').click();
  await pause(PAGE);

  await expect(page.locator('.error-msg')).toBeVisible({ timeout: 8000 });
  await pause(STEP);


  // ═══════════════════════════════════════════════════════════════════════════
  // 9. ADMIN LOGIN — valid credentials → submissions dashboard
  // ═══════════════════════════════════════════════════════════════════════════
  await page.locator('#username').fill('admin');
  await pause(300);
  await page.locator('#password').fill('admin_local_password');
  await pause(300);
  await page.locator('button[type="submit"]').click();

  await page.waitForURL(/\/admin\/submissions/, { timeout: 15_000 });
  await page.waitForLoadState('networkidle');
  await pause(PAGE);

  await expect(page.locator('app-admin-submissions').first()).toBeVisible({ timeout: 8000 });
  await pause(PAGE);


  // ═══════════════════════════════════════════════════════════════════════════
  // 10. ADMIN EVENTS — list, open edit form, save
  // ═══════════════════════════════════════════════════════════════════════════
  await page.locator('.admin-nav a', { hasText: /événements|events/i }).click();
  await page.waitForURL(/\/admin\/events/);
  await page.waitForLoadState('networkidle');
  await pause(PAGE);

  await expect(page.locator('.event-row').first()).toBeVisible({ timeout: 10_000 });
  await pause(STEP);

  // Open edit form on first event
  await page.locator('.btn-edit').first().click();
  await pause(STEP);

  // Modify city field
  const cityField = page.locator('.edit-form input[placeholder="Ville"]');
  await cityField.fill('Casablanca — CFC');
  await pause(STEP);

  // Save
  await page.locator('.edit-form .btn-approve').click();
  await pause(PAGE);


  // ═══════════════════════════════════════════════════════════════════════════
  // 11. ADMIN SCRAPER — logs table + trigger
  // ═══════════════════════════════════════════════════════════════════════════
  await page.locator('.admin-nav a', { hasText: /scraper|collecte/i }).click();
  await page.waitForURL(/\/admin\/scrape/);
  await page.waitForLoadState('networkidle');
  await pause(PAGE);

  await expect(page.locator('.log-table')).toBeVisible({ timeout: 8000 });
  await pause(PAGE);

  // Trigger a new scrape run
  await page.locator('.btn-trigger').click();
  await pause(PAGE);


  // ═══════════════════════════════════════════════════════════════════════════
  // 12. RETURN TO HOMEPAGE
  // ═══════════════════════════════════════════════════════════════════════════
  await page.locator('.nav-brand').click();
  await page.waitForURL(/\/events/);
  await page.waitForLoadState('networkidle');
  await pause(PAGE);

  await expect(page.locator('app-event-card').first()).toBeVisible({ timeout: 8000 });
  await pause(PAGE);
});
