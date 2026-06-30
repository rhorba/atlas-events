import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES_TO_SCAN = [
  { name: 'Home / Event List', url: '/' },
  { name: 'Submit Event', url: '/submit' },
  { name: 'Admin Login', url: '/admin/login' },
];

for (const { name, url } of PAGES_TO_SCAN) {
  test(`Accessibility: ${name} has no critical violations`, async ({ page }) => {
    await page.goto(url);
    await page.waitForTimeout(2000);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude(['[aria-hidden="true"]'])
      .analyze();

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    if (criticalViolations.length > 0) {
      const report = criticalViolations.map((v) =>
        `[${v.impact}] ${v.id}: ${v.description} — ${v.nodes.length} node(s)`
      ).join('\n');
      expect.soft(criticalViolations.length, `Accessibility violations on ${name}:\n${report}`).toBe(0);
    }

    expect(results.violations.length).toBeGreaterThanOrEqual(0);
  });
}
