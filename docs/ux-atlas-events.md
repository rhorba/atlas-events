# UX Foundation: Atlas Events
**PRD Reference**: docs/prd-atlas-events.md
**Version**: 1.0 | **Date**: 2026-06-29 | **Author**: UX Designer

---

## 1. User Personas

### Primary — Karim (The Professional Attendee)
| | |
|---|---|
| **Who** | Tech professional, 28–40, based in Casablanca or Rabat |
| **Goal** | Discover upcoming startup summits and conferences in his city without hunting across 10 websites |
| **Frustration** | Events posted on obscure Facebook groups or organisers' own sites — he misses them until it's too late |
| **Context** | Desktop at work, mobile on commute. Moderate tech literacy. Uses Google Calendar. |
| **Quote** | "I always find out about the good events a week after they happened." |

### Secondary — Nadia (The Event Organiser)
| | |
|---|---|
| **Who** | Programme manager at a policy think-tank in Rabat, organises 2–3 public forums per year |
| **Goal** | Get her event listed on a credible Moroccan platform quickly, with minimal back-and-forth |
| **Frustration** | Filling out long forms only to hear nothing back |
| **Context** | Desktop. Submits once, rarely returns. Wants a confirmation she can show her director. |
| **Quote** | "I just need to know it was received and will go live." |

### Tertiary — Admin (The Site Owner)
| | |
|---|---|
| **Who** | Developer / site owner — the only person with admin access |
| **Goal** | Review pending submissions quickly, confirm scrapers are running, fix issues when alerted |
| **Context** | Desktop. Checks dashboard 1–2×/day. Values speed over polish in admin UI. |
| **Quote** | "I need to see what needs attention and act on it in under 2 minutes." |

---

## 2. Information Architecture / Sitemap

```
Atlas Events (atlasevents.ma)
│
├── / ................ Event List (default: all cities, upcoming)
│   └── ?city=&category=&range=   (filter params — shareable URL)
│
├── /calendar ........ Calendar View (month/week)
│   └── ?city=&category=
│
├── /events/[id] ..... Event Detail
│
├── /submit .......... Submit an Event (public form)
│
├── /ical ............ iCal subscription (content-type: text/calendar)
│   └── ?city=&category=
│
└── /admin ........... Admin Area (JWT-protected)
    ├── /admin/login         Admin Login
    ├── /admin/submissions   Moderation Queue
    ├── /admin/events        All Events (edit / soft-delete)
    └── /admin/scraper       Scraper Health Dashboard
```

**Navigation rules:**
- Primary nav (public): Events · Calendar · Submit an Event · `[FR / AR]` toggle
- Admin nav (protected): Submissions · Events · Scraper · Logout
- Max 2 levels deep — no nested menus
- Active route highlighted; breadcrumb on Event Detail only (`← Back to events`)

---

## 3. Core User Flows

### Flow 1 — Attendee: Discover and subscribe to events

```
Entry: Direct URL / search engine result
        ↓
[Event List page]
  City filter: Casablanca
  Category: Startup
  Range: This month
        ↓
[Event cards appear]
        ↓
<Interesting event?> ──No──→ [Adjust filters] ──→ loop
        ↓ Yes
[Event Detail page]
        ↓
<Want to attend?> ──No──→ [← Back to list]
        ↓ Yes
[Click "S'inscrire →"] ──→ [External registration page] ──→ (Done)
        ↓ (also)
[Click "Ajouter au calendrier"]
        ↓
[iCal download / subscribe URL copied]
        ↓
[Calendar app (Google / Apple) shows event] ──→ (Done ✓)
```

**Error paths:**
- No events match filters → Empty state with "Essayez d'élargir vos filtres" + reset link
- External registration URL is dead → UX cannot prevent; show URL as plain text fallback

---

### Flow 2 — Organiser: Submit an event

```
Entry: Nav link "Soumettre un événement" or /submit
        ↓
[Submit Form page]
  Fill: title (FR), start date, city, category, organiser, registration URL
  Optional: end date, description, contact email
        ↓
<Form valid?> ──No──→ [Inline validation errors per field] ──→ retry
        ↓ Yes
[Click "Soumettre l'événement"]
        ↓
<API success?> ──No──→ [Error banner: "Erreur serveur — réessayez"] ──→ retry
        ↓ Yes
[Success state]
  "Votre événement a été soumis. Il sera examiné dans les 24 heures."
  [Soumettre un autre événement] [Revenir aux événements]
        ↓
(Done ✓)
```

**Edge cases:**
- User hits back after success → form resets, no double-submit risk (disabled button on submit)
- Rate-limited (10 submissions/IP/hr) → 429 response → "Trop de soumissions — réessayez dans une heure"

---

### Flow 3 — Admin: Review and moderate a submission

```
Entry: /admin/submissions (after JWT login)
        ↓
[Submissions queue]
  Pending count badge in nav
        ↓
<Queue empty?> ──Yes──→ [Empty state: "Aucune soumission en attente 🎉"]
        ↓ No
[Submission card: title, city, category, date, submitted X ago]
        ↓
<Approve?> ──────────────────────────────────────────────────────────→
  [Click "Approuver"]                                                 ↓
  → Event created in events table (status = upcoming)         [Event appears on site]
  → Card removed from queue                                   (Done ✓)
        ↓ No (Reject)
[Click "Rejeter"]
  → Optional: rejection note input appears inline
  → [Confirmer le rejet]
  → Submission status = rejected
  → Card removed from queue
        ↓
(Done ✓)
```

**Edge cases:**
- Admin clicks approve twice (double-tap) → second request returns 409 / idempotent no-op
- Network drops mid-action → error banner "Action échouée — réessayez"; queue state unchanged

---

## 4. Key Screen Wireframes

### Screen 1 — Event List (Home)

```
┌─────────────────────────────────────────────────────┐
│  🗺 Atlas Events                          [FR] [AR]  │
│  Événements · Calendrier · Soumettre                 │
├─────────────────────────────────────────────────────┤
│  Tous les événements professionnels au Maroc         │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Ville  ▾ │  │ Catég. ▾ │  │ Période          │  │
│  │ Toutes   │  │ Toutes   │  │ ● À venir  ○ Sem.│  │
│  └──────────┘  └──────────┘  │ ○ Mois  ○ 3 mois │  │
│                               └──────────────────┘  │
│  ──────────────────────────────────────────────────  │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  [STARTUP]                    15 Juil 2026   │   │
│  │  Summit FinTech Casablanca                   │   │
│  │  📍 Casablanca Convention Centre             │   │
│  │  Organisé par FinTech Morocco          [→]  │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  [CONFÉRENCE]                 22 Juil 2026   │   │
│  │  Forum Politique Rabat                       │   │
│  │  📍 Salle des Conférences, Rabat             │   │
│  │  Organisé par Institut X               [→]  │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  [NETWORKING]                  1 Août 2026   │   │
│  │  ...                                         │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  [Voir le calendrier]    [↗ Abonnement iCal]         │
│                                                      │
│                    [← 1  2  3  →]                    │
├─────────────────────────────────────────────────────┤
│  Soumettre un événement  ·  À propos                 │
└─────────────────────────────────────────────────────┘
```

### Screen 2 — Event Detail

```
┌─────────────────────────────────────────────────────┐
│  🗺 Atlas Events                          [FR] [AR]  │
├─────────────────────────────────────────────────────┤
│  ← Retour aux événements                             │
│                                                      │
│  [STARTUP]  [GRATUIT]                                │
│                                                      │
│  Summit FinTech Casablanca 2026                      │
│  ─────────────────────────────────────────────────  │
│  📅  15–16 Juillet 2026, 09h00 – 18h00              │
│  📍  Casablanca Convention Centre, Casa              │
│  🏢  Organisé par FinTech Morocco                    │
│                                                      │
│  Description                                         │
│  ─────────────                                       │
│  Le premier summit dédié à la finance …              │
│  [voir plus ▾]                                       │
│                                                      │
│  ┌─────────────────────────────────────┐             │
│  │  [S'inscrire →]  (lien externe)     │             │
│  └─────────────────────────────────────┘             │
│  [📅 Ajouter à mon calendrier (.ics)]                │
│                                                      │
│  Source : 10times.com · Mis à jour il y a 3h         │
├─────────────────────────────────────────────────────┤
│  Soumettre un événement  ·  À propos                 │
└─────────────────────────────────────────────────────┘
```

### Screen 3 — Submit Event Form

```
┌─────────────────────────────────────────────────────┐
│  🗺 Atlas Events                          [FR] [AR]  │
├─────────────────────────────────────────────────────┤
│  Soumettre un événement                              │
│  Votre événement sera examiné sous 24h.              │
│                                                      │
│  Titre de l'événement (FR) *                         │
│  [________________________________________]          │
│                                                      │
│  Date de début *           Date de fin               │
│  [JJ/MM/AAAA  🗓]          [JJ/MM/AAAA  🗓]         │
│                                                      │
│  Ville *                   Catégorie *               │
│  [Casablanca          ▾]   [Startup            ▾]   │
│                                                      │
│  Organisateur *                                      │
│  [________________________________________]          │
│                                                      │
│  Lien d'inscription *                                │
│  [https://___________________________________]       │
│                                                      │
│  Description (optionnel)                             │
│  [________________________________________]          │
│  [________________________________________]          │
│                                                      │
│  Email de contact (optionnel)                        │
│  [________________________________________]          │
│  ℹ Non publié — confirmation uniquement              │
│                                                      │
│  * Champs obligatoires                               │
│                                                      │
│  [      Soumettre l'événement      ]                 │
├─────────────────────────────────────────────────────┤
│  Soumettre un événement  ·  À propos                 │
└─────────────────────────────────────────────────────┘
```

### Screen 4 — Admin Submissions Queue

```
┌─────────────────────────────────────────────────────┐
│  Admin Atlas    [Soumissions 3] [Événements] [Scraper] [Déconnexion] │
├─────────────────────────────────────────────────────┤
│  Soumissions en attente  (3)                         │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Summit Tech Marrakech                       │   │
│  │  Marrakech · Conférence · 20 Août 2026       │   │
│  │  Organisé par TechHub Marrakech              │   │
│  │  Soumis il y a 2 heures                      │   │
│  │  https://techhub.ma/summit          [↗]     │   │
│  │  ─────────────────────────────────────────  │   │
│  │  [  ✓ Approuver  ]   [  ✗ Rejeter  ]        │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  Forum Économique Agadir                     │   │
│  │  Agadir · Policy · 5 Sept 2026               │   │
│  │  …                                           │   │
│  │  [  ✓ Approuver  ]   [  ✗ Rejeter  ]        │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Screen 5 — Arabic RTL Layout (Event List)

```
┌─────────────────────────────────────────────────────┐
│  [AR] [FR]                          أطلس إيفنتس 🗺  │
│                          إرسال حدث · التقويم · أحداث │
├─────────────────────────────────────────────────────┤
│        أحداث مهنية في جميع أنحاء المغرب             │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ ▾ الفئة  │  │ ▾ المدينة│  │      الفترة       │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  2026 يوليو 15              [ناشئة]           │   │
│  │         قمة فينتيك الدار البيضاء              │   │
│  │    📍 مركز مؤتمرات الدار البيضاء              │   │
│  │  [→]              فينتيك المغرب :المنظم       │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
  Note: Full RTL — layout mirrors, text right-aligned,
  nav items order reversed, back arrows point right.
```

---

## 5. Screen States

| Screen | Empty State | Loading | Error | Success |
|---|---|---|---|---|
| Event List | "Aucun événement trouvé pour ces filtres. [Réinitialiser les filtres]" | Skeleton cards (3 placeholders) | "Erreur de chargement. [Réessayer]" | Cards rendered |
| Calendar | "Aucun événement ce mois-ci pour ces filtres." | Skeleton calendar grid | "Erreur de chargement. [Réessayer]" | Calendar with event dots |
| Event Detail | — (404 page if ID not found) | Skeleton layout | 404: "Événement introuvable. [Retour aux événements]" | Full event detail |
| Submit Form | — (form always has fields) | Button disabled + spinner on submit | Inline field errors / server error banner | "Soumission reçue — examen sous 24h ✓" + reset option |
| Admin Queue | "Aucune soumission en attente 🎉" | Skeleton cards | "Erreur de chargement. [Réessayer]" | Cards with approve/reject actions |
| Admin Scraper | "Aucun historique de scraping." | Skeleton rows | "Erreur de chargement. [Réessayer]" | Log table per source |

---

## 6. Accessibility Notes (WCAG 2.1 AA)

- **RTL support**: Angular `dir="rtl"` on `<html>` when AR selected. All layout uses CSS logical properties (`margin-inline-start` not `margin-left`).
- **Language toggle**: `<button lang="ar">` and `<button lang="fr">` — screen reader announces language switch.
- **Focus order**: Tab order follows reading direction (LTR for FR, RTL for AR).
- **Touch targets**: All buttons and interactive elements ≥ 44×44px.
- **Color contrast**: Category badges and status chips must meet 4.5:1 ratio against backgrounds — enforced in UI Foundation doc.
- **Form labels**: `<label for>` above every input — no placeholder-only labelling.
- **Error messages**: ARIA `role="alert"` on inline validation errors — announced immediately by screen readers.
- **iCal button**: Descriptive `aria-label="Abonnement iCal pour les événements startup à Casablanca"` (dynamic based on current filters).
