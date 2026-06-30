/**
 * Atlas Events v1.0 — Full Demo Recording
 *
 * All API calls are intercepted with page.route() so the demo works without
 * a running backend. Every flow shows real data and realistic interactions.
 *
 * Flows covered:
 *  1.  Event list: 6 events rendered across cities & categories
 *  2.  Language toggle: FR → AR (RTL layout) → back to FR
 *  3.  Filters: city (Casablanca), category (Technology), date range, reset
 *  4.  Event detail: click card → detail page → iCal button visible
 *  5.  Calendar page
 *  6.  Submit form: fill all fields → submit → success state
 *  7.  Admin guard: /admin/submissions without login → redirect to /admin/login
 *  8.  Admin login: wrong credentials → error message
 *  9.  Admin login: correct credentials → redirect to submissions dashboard
 * 10.  Admin submissions: list 3 pending → approve one → reject one with note
 * 11.  Admin events: list 6 events → open edit form → save
 * 12.  Admin scraper: view logs table → trigger scrape → success toast
 * 13.  Return to homepage
 */

import { test, expect } from '@playwright/test';

test.use({ video: 'on' });
test.setTimeout(240_000);

// ─── Mock data ────────────────────────────────────────────────────────────────

const EVENT_ID_1 = 'aaaaaaaa-0000-0000-0000-000000000001';
const EVENT_ID_2 = 'aaaaaaaa-0000-0000-0000-000000000002';
const EVENT_ID_3 = 'aaaaaaaa-0000-0000-0000-000000000003';
const EVENT_ID_4 = 'aaaaaaaa-0000-0000-0000-000000000004';
const EVENT_ID_5 = 'aaaaaaaa-0000-0000-0000-000000000005';
const EVENT_ID_6 = 'aaaaaaaa-0000-0000-0000-000000000006';

const MOCK_EVENTS = [
  {
    id: EVENT_ID_1,
    title: { fr: 'Conférence IA & Innovation Maroc', ar: 'مؤتمر الذكاء الاصطناعي والابتكار بالمغرب' },
    startDate: '2026-09-15', endDate: '2026-09-16',
    city: 'casablanca', venue: 'Casablanca Tech Hub',
    category: 'technology', organizer: 'Atlas Tech Hub',
    registrationUrl: 'https://ia-maroc.ma/conference-2026',
    isFree: false, tags: ['ia', 'innovation'], status: 'PUBLISHED',
  },
  {
    id: EVENT_ID_2,
    title: { fr: 'Startup Weekend Rabat', ar: 'ويكند الشركات الناشئة بالرباط' },
    startDate: '2026-09-20', endDate: '2026-09-22',
    city: 'rabat', venue: 'Rabat Innovation Center',
    category: 'startup', organizer: 'Startup Maroc',
    registrationUrl: 'https://startupweekend.ma/rabat',
    isFree: true, tags: ['startup', 'entrepreneuriat'], status: 'PUBLISHED',
  },
  {
    id: EVENT_ID_3,
    title: { fr: 'Festival des Arts Numériques', ar: 'مهرجان الفنون الرقمية' },
    startDate: '2026-10-03', endDate: '2026-10-05',
    city: 'marrakech', venue: 'Médina Espace Culturel',
    category: 'arts', organizer: 'Marrakech Digital Arts',
    registrationUrl: 'https://digital-arts.ma',
    isFree: false, tags: ['art', 'numerique'], status: 'PUBLISHED',
  },
  {
    id: EVENT_ID_4,
    title: { fr: 'Forum International Santé & Bien-être', ar: 'المنتدى الدولي للصحة والعافية' },
    startDate: '2026-10-10',
    city: 'casablanca', venue: 'Hôtel Hyatt Regency',
    category: 'health', organizer: 'Maroc Santé',
    registrationUrl: 'https://forumfr-sante.ma',
    isFree: false, status: 'PUBLISHED',
  },
  {
    id: EVENT_ID_5,
    title: { fr: 'Journée Science Ouverte — Fès', ar: 'يوم العلم المفتوح بفاس' },
    startDate: '2026-09-28',
    city: 'fes', venue: 'Université Sidi Mohamed Ben Abdellah',
    category: 'science', organizer: 'USMBA',
    registrationUrl: 'https://science-ouverte.usmba.ac.ma',
    isFree: true, status: 'PUBLISHED',
  },
  {
    id: EVENT_ID_6,
    title: { fr: 'Business Africa Summit 2026', ar: 'قمة أعمال أفريقيا 2026' },
    startDate: '2026-11-05', endDate: '2026-11-07',
    city: 'tanger', venue: 'Tanger Free Zone Convention',
    category: 'business', organizer: 'Africa Business Council',
    registrationUrl: 'https://businessafrica.ma',
    isFree: false, status: 'PUBLISHED',
  },
];

const MOCK_SUBMISSIONS = [
  {
    id: 'sub-001', title: 'DevFest Casablanca 2026',
    city: 'casablanca', organizerName: 'GDG Casablanca',
    startDate: '2026-10-20', eventUrl: 'https://devfest.gdgcasablanca.com',
    contactEmail: 'gdg@casablanca.ma', isFree: true,
    status: 'PENDING', createdAt: '2026-06-28T09:00:00Z',
  },
  {
    id: 'sub-002', title: 'Summit Green Tech Maroc',
    city: 'rabat', organizerName: 'GreenTech Initiative',
    startDate: '2026-11-15', eventUrl: 'https://greentech.ma',
    contactEmail: 'contact@greentech.ma', isFree: false,
    status: 'PENDING', createdAt: '2026-06-29T11:30:00Z',
  },
  {
    id: 'sub-003', title: 'Workshop Data Science Agadir',
    city: 'agadir', organizerName: 'Data Maroc',
    startDate: '2026-10-08', eventUrl: 'https://datamaroc.ma/workshop',
    contactEmail: null, isFree: true,
    status: 'PENDING', createdAt: '2026-06-30T08:15:00Z',
  },
];

const MOCK_SCRAPE_LOGS = [
  { id: 'log-1', source: 'tentimes', url: 'https://10times.com/morocco', eventsFound: 28, eventsInserted: 12, success: true, startedAt: '2026-06-30T06:00:01Z', finishedAt: '2026-06-30T06:00:08Z' },
  { id: 'log-2', source: 'allconferencealert', url: 'https://www.allconferencealert.com/morocco.html', eventsFound: 15, eventsInserted: 8, success: true, startedAt: '2026-06-30T06:00:02Z', finishedAt: '2026-06-30T06:00:06Z' },
  { id: 'log-3', source: 'pcns', url: 'https://www.pcns.ma/evenements.aspx', eventsFound: 7, eventsInserted: 3, success: true, startedAt: '2026-06-30T06:00:03Z', finishedAt: '2026-06-30T06:00:05Z' },
  { id: 'log-4', source: 'tentimes', url: 'https://10times.com/morocco', eventsFound: 0, eventsInserted: 0, success: false, errorMessage: 'Connection timeout after 10 000 ms', startedAt: '2026-06-30T00:00:01Z', finishedAt: '2026-06-30T00:00:11Z' },
  { id: 'log-5', source: 'allconferencealert', url: 'https://www.allconferencealert.com/morocco.html', eventsFound: 22, eventsInserted: 11, success: true, startedAt: '2026-06-30T00:00:02Z', finishedAt: '2026-06-30T00:00:07Z' },
];

const MOCK_ADMIN_EVENTS = MOCK_EVENTS.map(e => ({
  ...e,
  registrationUrl: e.registrationUrl ?? null,
  isFree: e.isFree,
}));

// ─── Helper ───────────────────────────────────────────────────────────────────

const pause = (ms: number) => new Promise(r => setTimeout(r, ms));
const STEP  = 1200;   // standard pause between actions (ms)
const PAGE  = 2000;   // pause after page load

// ─── Test ─────────────────────────────────────────────────────────────────────

test('Atlas Events v1.0 — full application demo', async ({ page }) => {

  // ── Install API mocks (before first navigation) ──────────────────────────
  const API = 'http://localhost:8080/api/v1';

  // Events list (with or without filter params)
  await page.route(`${API}/events**`, async route => {
    const url = new URL(route.request().url());
    const city     = url.searchParams.get('city');
    const category = url.searchParams.get('category');
    let data = MOCK_EVENTS;
    if (city)     data = data.filter(e => e.city === city);
    if (category) data = data.filter(e => e.category === category);
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ data, total: data.length, page: 0, size: 20 }) });
  });

  // Single event detail — matches /api/v1/events/<uuid>
  await page.route(/\/api\/v1\/events\/[a-z0-9-]+$/, async route => {
    const id = route.request().url().split('/').pop()!;
    const ev  = MOCK_EVENTS.find(e => e.id === id) ?? MOCK_EVENTS[0];
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ data: ev }) });
  });

  // Submission POST → 201
  await page.route(`${API}/submissions`, async route => {
    await route.fulfill({ status: 201, contentType: 'application/json',
      body: JSON.stringify({ id: 'new-sub-001' }) });
  });

  // Auth login
  await page.route(`${API}/auth/login`, async route => {
    const body = JSON.parse(route.request().postData() ?? '{}');
    if (body.username === 'admin' && body.password === 'admin_local_password') {
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ token: 'mock-jwt-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' }) });
    } else {
      await route.fulfill({ status: 401, contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid credentials' }) });
    }
  });

  // Admin submissions
  await page.route(`${API}/admin/submissions**`, async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(MOCK_SUBMISSIONS) });
    } else {
      // PATCH approve/reject
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    }
  });

  // Admin events
  await page.route(`${API}/admin/events**`, async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_ADMIN_EVENTS }) });
    } else {
      // PUT update
      const body = JSON.parse(route.request().postData() ?? '{}');
      const id   = route.request().url().split('/').pop()!;
      const ev   = MOCK_ADMIN_EVENTS.find(e => e.id === id) ?? MOCK_ADMIN_EVENTS[0];
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ data: { ...ev, ...body } }) });
    }
  });

  // Admin delete event
  await page.route(/\/api\/v1\/admin\/events\/[a-z0-9-]+$/, async route => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 204 });
    } else {
      await route.continue();
    }
  });

  // Scrape logs
  await page.route(`${API}/admin/scrape/logs**`, async route => {
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify(MOCK_SCRAPE_LOGS) });
  });

  // Scrape trigger
  await page.route(`${API}/admin/scrape/trigger`, async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  // iCal feed
  await page.route(`http://localhost:8080/ical**`, async route => {
    await route.fulfill({ status: 200, contentType: 'text/calendar',
      body: 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR' });
  });


  // ═══════════════════════════════════════════════════════════════════════════
  // 1. EVENT LIST — homepage with 6 events
  // ═══════════════════════════════════════════════════════════════════════════
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveTitle(/atlas/i);
  await page.waitForTimeout(PAGE);

  // Verify nav and 6 event cards are visible
  await expect(page.locator('.app-nav')).toBeVisible();
  await expect(page.locator('app-event-card').first()).toBeVisible({ timeout: 8000 });
  const cardCount = await page.locator('app-event-card').count();
  await page.waitForTimeout(PAGE);   // pause to show the full event list


  // ═══════════════════════════════════════════════════════════════════════════
  // 2. LANGUAGE TOGGLE  FR → AR → FR
  // ═══════════════════════════════════════════════════════════════════════════
  const arBtn = page.locator('.lang-btn', { hasText: 'AR' });
  const frBtn = page.locator('.lang-btn', { hasText: 'FR' });

  await arBtn.click();
  await page.waitForTimeout(PAGE);        // show Arabic layout (RTL)

  await frBtn.click();
  await page.waitForTimeout(STEP);        // back to French


  // ═══════════════════════════════════════════════════════════════════════════
  // 3. FILTERS — city, category, date-range, reset
  // ═══════════════════════════════════════════════════════════════════════════
  const filterSelects = page.locator('.filter-select');
  const citySelect     = filterSelects.nth(0);
  const categorySelect = filterSelects.nth(1);
  const rangeSelect    = filterSelects.nth(2);

  // City: Casablanca → 2 events
  await citySelect.selectOption('casablanca');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(STEP);

  // Category: Technology → 1 event (IA Maroc)
  await categorySelect.selectOption('technology');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(STEP);

  // Reset category
  await categorySelect.selectOption('');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(STEP);

  // Date range: this week
  await rangeSelect.selectOption('week');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(STEP);

  // Reset all filters
  const resetBtn = page.locator('.btn-reset').first();
  if (await resetBtn.isVisible()) {
    await resetBtn.click();
  } else {
    // fallback: reset each select manually
    await rangeSelect.selectOption('');
    await citySelect.selectOption('');
  }
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(STEP);   // show all 6 events again


  // ═══════════════════════════════════════════════════════════════════════════
  // 4. EVENT DETAIL — click first card
  // ═══════════════════════════════════════════════════════════════════════════
  const firstCard = page.locator('app-event-card').first();
  await firstCard.locator('.title-link').click();
  await page.waitForURL(/\/events\//);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(PAGE);

  await expect(page.locator('app-event-detail, .event-detail').first()).toBeVisible({ timeout: 8000 });
  await page.waitForTimeout(PAGE);    // show event detail

  // Go back to list
  await page.goBack();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(STEP);


  // ═══════════════════════════════════════════════════════════════════════════
  // 5. CALENDAR PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  await page.locator('.nav-links a', { hasText: /calendrier|calendar/i }).click();
  await page.waitForURL(/\/calendar/);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(PAGE);

  await expect(page.locator('app-calendar').first()).toBeVisible({ timeout: 8000 });
  await page.waitForTimeout(PAGE);    // show the FullCalendar grid


  // ═══════════════════════════════════════════════════════════════════════════
  // 6. SUBMIT FORM — fill all fields, submit → success
  // ═══════════════════════════════════════════════════════════════════════════
  await page.locator('.nav-links a', { hasText: /soumettre|submit/i }).click();
  await page.waitForURL(/\/submit/);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(STEP);

  await expect(page.locator('.submit-page').first()).toBeVisible({ timeout: 5000 });

  await page.locator('#titleFr').fill('Conférence Tech Maroc 2026');
  await page.waitForTimeout(300);

  await page.locator('#startDate').fill('2026-09-15');
  await page.waitForTimeout(300);

  await page.locator('#city').selectOption('casablanca');
  await page.waitForTimeout(300);

  await page.locator('#category').selectOption('technology');
  await page.waitForTimeout(300);

  await page.locator('#organizer').fill('Atlas Tech Hub');
  await page.waitForTimeout(300);

  await page.locator('#registrationUrl').fill('https://techmaroc.ma/conference-2026');
  await page.waitForTimeout(300);

  await page.locator('#contactEmail').fill('contact@techmaroc.ma');
  await page.waitForTimeout(300);

  await page.locator('#description').fill(
    'La plus grande conférence technologique du Maroc. Rejoignez des experts pour explorer l\'IA, la blockchain et l\'innovation digitale.'
  );
  await page.waitForTimeout(PAGE);    // show completed form

  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(PAGE);    // show success state

  // Verify success banner appeared
  await expect(page.locator('.success-state, .success-message').first()).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(PAGE);


  // ═══════════════════════════════════════════════════════════════════════════
  // 7. ADMIN GUARD — direct access → redirect to login
  // ═══════════════════════════════════════════════════════════════════════════
  await page.goto('/admin/submissions');
  await page.waitForTimeout(STEP);
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.waitForTimeout(STEP);


  // ═══════════════════════════════════════════════════════════════════════════
  // 8. ADMIN LOGIN — invalid credentials → error
  // ═══════════════════════════════════════════════════════════════════════════
  await expect(page.locator('.login-card')).toBeVisible({ timeout: 5000 });

  await page.locator('#username').fill('hacker');
  await page.waitForTimeout(400);
  await page.locator('#password').fill('wrongpassword');
  await page.waitForTimeout(400);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(PAGE);

  await expect(page.locator('.error-msg')).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(STEP);


  // ═══════════════════════════════════════════════════════════════════════════
  // 9. ADMIN LOGIN — valid credentials → submissions dashboard
  // ═══════════════════════════════════════════════════════════════════════════
  await page.locator('#username').fill('admin');
  await page.waitForTimeout(300);
  await page.locator('#password').fill('admin_local_password');
  await page.waitForTimeout(300);
  await page.locator('button[type="submit"]').click();

  await page.waitForURL(/\/admin\/submissions/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(PAGE);


  // ═══════════════════════════════════════════════════════════════════════════
  // 10. ADMIN SUBMISSIONS — list, approve, reject with note
  // ═══════════════════════════════════════════════════════════════════════════
  await expect(page.locator('app-admin-submissions').first()).toBeVisible({ timeout: 8000 });
  await expect(page.locator('.card').first()).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(PAGE);    // show the submissions list

  // Approve first submission
  await page.locator('.btn-approve').first().click();
  await page.waitForTimeout(PAGE);    // show success toast + item removed

  // Reject second submission with a note
  await page.locator('.btn-reject').first().click();
  await page.waitForTimeout(STEP);    // show reject input
  await page.locator('.reject-form input').first().fill('Événement hors périmètre géographique.');
  await page.waitForTimeout(STEP);
  await page.locator('.reject-form .btn-reject').click();
  await page.waitForTimeout(PAGE);    // show success toast + item removed


  // ═══════════════════════════════════════════════════════════════════════════
  // 11. ADMIN EVENTS — list, open edit form, save
  // ═══════════════════════════════════════════════════════════════════════════
  await page.locator('.admin-nav a', { hasText: /événements|events/i }).click();
  await page.waitForURL(/\/admin\/events/);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(PAGE);

  await expect(page.locator('.event-row').first()).toBeVisible({ timeout: 8000 });
  await page.waitForTimeout(STEP);    // show event list

  // Open edit form on first event
  await page.locator('.btn-edit').first().click();
  await page.waitForTimeout(STEP);

  // Modify city
  const cityField = page.locator('.edit-form input[placeholder="Ville"]');
  await cityField.fill('Casablanca — CFC');
  await page.waitForTimeout(STEP);    // show edit form with changes

  // Save
  await page.locator('.edit-form .btn-approve').click();
  await page.waitForTimeout(PAGE);    // show success toast


  // ═══════════════════════════════════════════════════════════════════════════
  // 12. ADMIN SCRAPER — logs table + trigger
  // ═══════════════════════════════════════════════════════════════════════════
  await page.locator('.admin-nav a', { hasText: /scraper|collecte/i }).click();
  await page.waitForURL(/\/admin\/scrape/);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(PAGE);

  await expect(page.locator('.log-table')).toBeVisible({ timeout: 8000 });
  await page.waitForTimeout(PAGE);    // show the logs table

  // Trigger a new scrape run
  await page.locator('.btn-trigger').click();
  await page.waitForTimeout(PAGE);    // show success toast


  // ═══════════════════════════════════════════════════════════════════════════
  // 13. RETURN TO HOMEPAGE
  // ═══════════════════════════════════════════════════════════════════════════
  await page.locator('.nav-brand').click();
  await page.waitForURL(/\/events/);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(PAGE);

  await expect(page.locator('app-event-card').first()).toBeVisible({ timeout: 8000 });
  await page.waitForTimeout(PAGE);    // end on the event list
});
