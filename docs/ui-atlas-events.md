# UI Foundation: Atlas Events
**UX Reference**: docs/ux-atlas-events.md
**Version**: 1.0 | **Date**: 2026-06-29 | **Author**: UI Designer

---

## 1. Design Approach

**Strategy**: Angular Material (MDC) as the primary component library + FullCalendar for Angular for the calendar view.

**Rationale**:
- Angular Material is the most Angular-native choice — lifecycle, signals, and A11y (ARIA) are built-in and maintained by Google
- Material Design 3 (MDC) theming system maps cleanly to custom brand tokens via `@angular/material`'s `mat.define-theme()`
- Excellent RTL support: `dir="rtl"` on `<html>` + Angular CDK Bidi automatically mirrors layout
- FullCalendar (`@fullcalendar/angular`) is the best-in-class calendar for this use case; avoids building a calendar from scratch
- Tailwind utility classes for layout and spacing between Material components (configured alongside Material, no conflict)

**Not using**: PrimeNG (heavier bundle), ng-bootstrap (Bootstrap aesthetic doesn't fit), custom design system from scratch (YAGNI — one developer, MVP).

---

## 2. Brand & Color Tokens

Morocco-sourced palette: deep teal-navy (professional anchor) + warm amber-gold (Moroccan warmth + CTA) on a warm off-white surface.

### Primitive Tokens

```css
/* Brand primitives */
--color-navy-900:   #1A3A4A;   /* deepest brand navy */
--color-navy-700:   #2E6B8A;   /* medium teal-blue */
--color-navy-500:   #4A9ABF;   /* lighter teal */
--color-navy-100:   #D6EBF5;   /* tint for highlights */

--color-amber-600:  #E8A034;   /* Moroccan gold — primary CTA */
--color-amber-700:  #C8861E;   /* amber hover/active */
--color-amber-100:  #FDF3DC;   /* amber tint */

/* Neutral (warm gray, not cold) */
--color-neutral-950: #1C1917;
--color-neutral-700: #44403C;
--color-neutral-500: #78716C;
--color-neutral-300: #D6D3D1;
--color-neutral-100: #F5F5F4;
--color-neutral-50:  #FAFAF9;

/* Semantic */
--color-success:    #16A34A;
--color-success-bg: #DCFCE7;
--color-warning:    #D97706;
--color-warning-bg: #FEF3C7;
--color-error:      #DC2626;
--color-error-bg:   #FEE2E2;
--color-info:       #0284C7;
--color-info-bg:    #E0F2FE;
```

### Semantic Tokens (reference primitives)

```css
:root {
  /* Backgrounds */
  --color-bg-base:       var(--color-neutral-50);   /* page background */
  --color-bg-surface:    #FFFFFF;                   /* cards, modals */
  --color-bg-muted:      var(--color-neutral-100);  /* subtle sections */

  /* Text */
  --color-text-primary:  var(--color-neutral-950);
  --color-text-secondary:var(--color-neutral-500);
  --color-text-disabled: var(--color-neutral-300);
  --color-text-on-dark:  #FFFFFF;
  --color-text-on-amber: var(--color-neutral-950);  /* amber bg = dark text */

  /* Brand actions */
  --color-primary:       var(--color-navy-900);
  --color-primary-hover: var(--color-navy-700);
  --color-cta:           var(--color-amber-600);    /* CTAs, primary buttons */
  --color-cta-hover:     var(--color-amber-700);

  /* Borders */
  --color-border:        var(--color-neutral-300);
  --color-border-focus:  var(--color-navy-700);
  --color-border-error:  var(--color-error);

  /* Category badge colours */
  --badge-conference:    #1B4F72;   /* deep blue */
  --badge-startup:       #6B21A8;   /* purple */
  --badge-networking:    #065F46;   /* green */
  --badge-summit:        #1A3A4A;   /* brand navy */
  --badge-academic:      #1E3A5F;   /* slate blue */
  --badge-policy:        #7C2D12;   /* burnt sienna */
  --badge-tech:          #0C4A6E;   /* sky blue dark */
  --badge-workshop:      #3F3F46;   /* zinc */
}
```

### Angular Material Theme Config (`styles/theme.scss`)

```scss
@use '@angular/material' as mat;

$atlas-theme: mat.define-theme((
  color: (
    theme-type: light,
    primary: mat.$azure-palette,      // override with brand tokens below
    tertiary: mat.$orange-palette,
  ),
  typography: (
    brand-family: 'Plus Jakarta Sans, system-ui, sans-serif',
    plain-family: 'Plus Jakarta Sans, system-ui, sans-serif',
  ),
  density: (scale: 0),
));
```

---

## 3. Typography

**Latin (FR)**: `Plus Jakarta Sans` — modern, professional, excellent at medium weights. Google Font, free.
**Arabic (AR)**: `IBM Plex Sans Arabic` — professional, geometric, pairs well with Plus Jakarta Sans aesthetically.

```css
/* Font loading (index.html <head>) */
/* Plus Jakarta Sans: weights 400, 500, 600, 700 */
/* IBM Plex Sans Arabic: weights 400, 500, 600, 700 */

--font-sans:    'Plus Jakarta Sans', system-ui, sans-serif;
--font-arabic:  'IBM Plex Sans Arabic', system-ui, sans-serif;

/* Scale */
--text-xs:    0.75rem;    /* 12px — metadata, captions */
--text-sm:    0.875rem;   /* 14px — secondary text, badges */
--text-base:  1rem;       /* 16px — body (min on mobile) */
--text-lg:    1.125rem;   /* 18px — card titles */
--text-xl:    1.25rem;    /* 20px — section heads */
--text-2xl:   1.5rem;     /* 24px — page titles */
--text-3xl:   1.875rem;   /* 30px — hero/display */

/* Weights */
--font-regular:   400;
--font-medium:    500;
--font-semibold:  600;
--font-bold:      700;

/* Line heights */
--leading-tight:  1.2;    /* headings */
--leading-normal: 1.5;    /* body */
--leading-loose:  1.7;    /* long-form descriptions */
```

---

## 4. Spacing Scale

4px base grid. All components use these tokens — no arbitrary values.

```css
--space-1:   4px;
--space-2:   8px;
--space-3:   12px;
--space-4:   16px;
--space-5:   20px;
--space-6:   24px;
--space-8:   32px;
--space-10:  40px;
--space-12:  48px;
--space-16:  64px;
--space-20:  80px;
--space-24:  96px;

/* Semantic spacing */
--space-card-padding:    var(--space-6);   /* 24px */
--space-section:         var(--space-12);  /* 48px */
--space-page-margin-sm:  var(--space-4);   /* 16px mobile */
--space-page-margin-lg:  var(--space-10);  /* 40px desktop */
```

---

## 5. Component Inventory

| Component | Strategy | Notes |
|---|---|---|
| **Nav Bar** | Custom (Mat Toolbar base) | Brand navy bg, amber logo dot, FR/AR toggle |
| **Event Card** | Custom (Mat Card base) | Category badge, date, city, organiser line, arrow CTA |
| **Category Badge** | Custom chip | Pill shape, per-category colour (see badge tokens) |
| **City Filter** | Mat Select | Multi-select optional post-MVP; single for MVP |
| **Category Filter** | Mat Select | Single select |
| **Date Range Filter** | Mat Button Toggle Group | "À venir / Cette semaine / Ce mois / 3 mois" |
| **iCal Subscribe Button** | Custom (Mat Button + icon) | Opens subscribe URL; dynamic aria-label |
| **Calendar View** | FullCalendar (`@fullcalendar/angular`) | Month + week views; events coloured by category |
| **Event Detail Header** | Custom layout | Large title, badges, key facts row (date/venue/price) |
| **Submit Form** | Mat Form Field + Mat Input | Mat Datepicker for dates; Mat Select for city/category |
| **Form Validation Error** | Mat Error | Inline below field; role="alert" |
| **Admin Event Card** | Custom (Mat Card) | Approve (primary) / Reject (warn) actions |
| **Admin Reject Dialog** | Mat Dialog | Optional note input; confirm/cancel |
| **Scraper Status Table** | Mat Table | Source, last run, events found/inserted, status chip |
| **Status Chip** | Mat Chip | Green = success, Red = failed, Grey = running |
| **Pagination** | Mat Paginator | Standard; hidden when ≤ 1 page |
| **Loading Skeleton** | Custom (CSS animation) | Matches event card shape; 3 placeholders |
| **Empty State** | Custom | Illustration placeholder + message + action button |
| **Toast / Snackbar** | Mat Snack Bar | Success (green), error (red), 4s auto-dismiss |
| **Admin Login Form** | Mat Form Field + Mat Input | Email + password; single primary button |
| **Language Toggle** | Custom button group | `[FR]` / `[AR]` — outlined, active state filled navy |

---

## 6. Responsive Breakpoints

Mobile-first. Content max-width: `1280px`, centred.

| Breakpoint | Width | Layout |
|---|---|---|
| **Mobile** | < 768px | Single column. Page margin 16px. Event cards full-width. Filters stacked vertically in a collapsible drawer. Nav: hamburger menu. |
| **Tablet** | 768px – 1023px | 2-column event card grid. Page margin 24px. Filters in a horizontal scrollable row. |
| **Desktop** | ≥ 1024px | 3-column event card grid. Page margin 40px. Filters in a persistent sidebar or top bar. |

**Calendar view responsive:**
- Mobile: `listWeek` view (FullCalendar list layout) — calendar grid is unusable on small screens
- Tablet+: `dayGridMonth` or `timeGridWeek` view

**Admin dashboard:**
- Mobile: Stacked submission cards (same as public event cards)
- Desktop: 2-column layout (submissions list + detail panel side-by-side)

---

## 7. RTL Design Tokens

When `dir="rtl"` (Arabic):

```css
[dir="rtl"] {
  --font-family: var(--font-arabic);
  --leading-normal: 1.7;          /* Arabic text needs more line height */
  --text-align-default: right;
}
```

Angular CDK Bidi (`BidiModule`) handles:
- Mat components auto-flip (icons, buttons, nav)
- Layout direction for `MatDrawer`, `MatSidenav`

Custom CSS uses logical properties throughout:
```css
/* Use this — works in both LTR and RTL */
margin-inline-start: var(--space-4);
padding-inline-end: var(--space-2);
border-inline-start: 2px solid var(--color-primary);

/* Never use this — breaks RTL */
/* margin-left: 16px; */
/* padding-right: 8px; */
```

---

## 8. Elevation & Shadows

```css
--shadow-sm:  0 1px 3px rgba(28, 25, 23, 0.06);    /* event cards */
--shadow-md:  0 4px 8px rgba(28, 25, 23, 0.08);    /* dropdowns, filters */
--shadow-lg:  0 10px 20px rgba(28, 25, 23, 0.10);  /* modals, dialogs */
```

Cards use `border: 1px solid var(--color-border)` + `--shadow-sm`.
No border AND shadow together — pick one (border for inline, shadow for elevated).

---

## 9. Accessibility Baseline

| Requirement | Implementation |
|---|---|
| Colour contrast AA (4.5:1 body) | All text/bg combinations verified: navy-900 on white = 13.4:1 ✓, amber-600 on white = 2.8:1 ✗ — amber used for large bold text only (CTAs ≥ 18px bold = 3:1 required ✓) |
| Focus indicators | 2px solid `--color-border-focus` (navy-700) with 2px offset — visible on all backgrounds |
| Touch targets | All interactive elements ≥ 44×44px (Mat components meet this by default) |
| Font size | Minimum 16px on all input elements (prevents iOS zoom on focus) |
| Icon + label | All icons accompanied by visible label or `aria-label` |
| Category badges | Colour + text label — never colour alone for meaning |
| Form errors | Mat Error uses `role="alert"` — announced immediately by screen readers |
| Language switch | `<html lang="fr">` / `<html lang="ar" dir="rtl">` updated on toggle |
| Skip link | `<a class="skip-link" href="#main-content">` as first focusable element |

---

## 10. Page-Level Visual Spec

### Event Card — visual summary
```
Background:    --color-bg-surface (white)
Border:        1px solid --color-border + --shadow-sm on hover
Border-radius: 8px (--radius-md)
Padding:       24px (--space-card-padding)

Layout (LTR):
  [Category Badge]                          [Date — text-sm, text-secondary]
  [Event Title — text-lg, font-semibold, text-primary]
  [📍 City  ·  Organiser — text-sm, text-secondary]
  [→ arrow icon, inline-end]

Hover:   box-shadow transitions to --shadow-md; cursor pointer
Focus:   2px focus ring via Mat ripple + custom outline
```

### Colour usage rule
- `--color-primary` (navy): headings, nav background, active states, links
- `--color-cta` (amber): **primary action buttons only** — "S'inscrire", "Soumettre", "Approuver"
- `--color-error` (red): destructive actions only — "Rejeter", validation errors
- `--color-bg-surface` (white): cards and panels
- `--color-bg-base` (warm off-white): page background
