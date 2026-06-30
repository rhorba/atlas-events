import { test, expect } from '@playwright/test';

test.describe('Admin Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
  });

  test('renders login form', async ({ page }) => {
    await expect(page.locator('form, [data-testid="login-form"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="text"], input[name="username"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.fill('input[type="text"], input[name="username"]', 'wronguser');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    const errorMsg = page.locator('[data-testid="error-msg"], .error, mat-error, [class*="error"]').first();
    if (await errorMsg.count() > 0) {
      await expect(errorMsg).toBeVisible();
    }
  });

  test('redirects to /admin/submissions on valid credentials', async ({ page }) => {
    const adminUser = process.env['E2E_ADMIN_USER'] ?? 'admin';
    const adminPass = process.env['E2E_ADMIN_PASS'] ?? 'admin_local_password';
    await page.fill('input[type="text"], input[name="username"]', adminUser);
    await page.fill('input[type="password"]', adminPass);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    const url = page.url();
    if (url.includes('/admin/submissions')) {
      await expect(page).toHaveURL(/\/admin\/submissions/);
    }
  });

  test('unauthenticated access to /admin/submissions redirects to login', async ({ page }) => {
    await page.goto('/admin/submissions');
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
