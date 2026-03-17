# Design Brief — Predivo API Dashboard

> Version: 1.0 | Date: 2026-03-15
> Product: API Management Dashboard for Predivo (internal tool)
> URL: apis.predivo.ch

---

## 1. Product Context

An internal dashboard for managing all APIs used across Predivo projects. Users are technical (developers/founders) who need to track API keys, credentials, subscriptions, costs, health status, and audit trails. This is a **data-dense developer tool**, not a consumer app.

**Key screens:** Dashboard (metrics + charts), API Inventory (table + filters), API Detail (tabbed view), API Form (create/edit), Projects, Project Detail, Audit Log, Settings (Account + Notifications), Login, 404.

---

## 2. Design Direction

### Visual Identity: "Precise Developer Console"

Inspired by:
- **Stripe Dashboard** — clean data density, subtle borders, white/light surfaces with purposeful color
- **Linear** — minimal chrome, fast-feeling transitions, monochrome palette with single accent
- **Vercel Dashboard** — developer-first aesthetic, strong typography hierarchy, dark sidebar
- **Postman** — API-specific UI patterns: credential reveal/copy, key tables, status indicators
- **Kong Gateway UI** — health monitoring dashboards, traffic visualizations

### Core Aesthetic Principles

1. **Data density over decoration** — every pixel serves information or navigation
2. **Monochrome base + single accent** — teal/cyan as the primary brand accent against neutral grays
3. **Border-first surfaces** — cards use subtle 1px borders, not shadows (shadows reserved for elevation: dropdowns, modals, toasts)
4. **Type-driven hierarchy** — weight and size create hierarchy, not color variation
5. **Purposeful color** — color appears only for: brand accent, semantic status (success/warning/error/info), and interactive states
6. **Dense but breathable** — compact spacing for tables and data, generous spacing for section breaks

---

## 3. Brand Personality

| Trait | Expression |
|-------|-----------|
| **Precise** | Pixel-perfect alignment, consistent spacing, exact color tokens |
| **Technical** | Monospace accents for data, code-like credential display, developer-friendly language |
| **Trustworthy** | AES-256 encryption prominently noted, audit trail visibility, status indicators always visible |
| **Efficient** | Fast load times, keyboard shortcuts, minimal clicks to any action |
| **Quietly Confident** | No marketing fluff, no decorative illustrations, UI speaks through craft |

---

## 4. Color Strategy

### Primary Accent: Teal/Cyan

The existing app already hints at teal (`bg-teal-500` on sidebar logo). We formalize this as the brand accent.

**Why teal:**
- Distinct from the blue used by most dashboards (avoids "generic SaaS" look)
- High contrast against both light and dark backgrounds
- Associates with precision, technology, and clarity
- Works naturally with the gray/neutral base palette

### Light Mode Palette Direction

| Role | Direction |
|------|-----------|
| **Page background** | Very light warm gray (not pure white — reduces eye strain) |
| **Card surface** | White with 1px border |
| **Sidebar** | Dark (near-black) for clear navigation hierarchy |
| **Primary text** | Near-black on light, near-white on dark |
| **Secondary text** | Medium gray with 4.5:1+ contrast ratio |
| **Accent** | Teal for primary actions, links, active states |
| **Semantic** | Green (healthy/success), amber (warning/expiring), red (error/down), blue (info) |

### Dark Mode Palette Direction

| Role | Direction |
|------|-----------|
| **Page background** | Dark gray (#121212-range, NOT pure black) |
| **Card surface** | Slightly elevated dark gray with subtle border |
| **Sidebar** | Darkest surface, blends with page |
| **Accent** | Lighter teal shade for sufficient contrast on dark |

---

## 5. Typography

| Element | Font | Usage |
|---------|------|-------|
| **UI / Body** | Inter | All interface text, labels, navigation, body copy |
| **Code / Data** | JetBrains Mono | API keys, credentials, endpoint URLs, JSON, audit entries |

**Type ramp priority:** Clear distinction between page title → section heading → table header → body → caption. Use weight progression (700 → 600 → 500 → 400) more than size escalation.

---

## 6. Layout Patterns

| Pattern | Specification |
|---------|--------------|
| **App shell** | Fixed dark sidebar (240px) + scrollable main content |
| **Sidebar** | Logo + nav items + footer (theme toggle, sign out) |
| **Page structure** | Page title + description → action bar → content area |
| **Data tables** | Dense rows (40px height), sortable headers, inline actions |
| **Metric cards** | 4-column grid on desktop, stack on mobile |
| **Detail pages** | Tabbed interface for multi-section content |
| **Forms** | Single-column, grouped in cards by section |
| **Mobile** | Sidebar collapses to hamburger, tables become card lists |

---

## 7. Component-Level Notes

| Component | Notes |
|-----------|-------|
| **Credential display** | Monospace font, masked by default (•••••), copy button, reveal toggle |
| **Status badges** | Dot + text: green "Active", amber "Expiring", red "Down", gray "Inactive" |
| **Health indicators** | Color-coded dot or bar (green/amber/red), latency number in mono |
| **Charts** | Recharts library, teal as primary series color, gray for secondary |
| **Sidebar nav** | Icon + label, active state with accent background, hover with subtle highlight |
| **Empty states** | Icon + message + CTA button, centered in content area |
| **Loading** | Skeleton screens for tables and cards, spinner for actions |

---

## 8. Anti-Slop Rules

These rules prevent generic AI-generated aesthetics. **Every frontend change must comply.**

### NEVER do:
- ❌ Use gradients on buttons or cards (flat, border-first design)
- ❌ Use rounded-full on cards or containers (max radius: xl/12px)
- ❌ Add decorative illustrations or undraw-style SVGs
- ❌ Use emoji in UI labels or headings
- ❌ Use marketing language in the app UI ("supercharge", "unleash", "revolutionize")
- ❌ Add shadows to cards (use 1px borders; shadows only for overlays)
- ❌ Use more than ONE accent color (teal only — no purple, orange, etc.)
- ❌ Use hardcoded hex/rgb values — always reference design tokens
- ❌ Use Inter for displaying API keys, URLs, or code — use JetBrains Mono
- ❌ Use color alone to convey status — always pair with text label or icon
- ❌ Round avatar/icon corners to full circle in data tables (use rounded-md)

### ALWAYS do:
- ✅ Use design token variables for all colors, spacing, typography, radius
- ✅ Use border-first card styling (1px border, no shadow)
- ✅ Maintain 4.5:1 contrast ratio minimum for all text (WCAG AA)
- ✅ Use JetBrains Mono for any technical/code content
- ✅ Show loading skeletons for async content
- ✅ Support keyboard navigation on all interactive elements
- ✅ Include both light and dark mode variants
- ✅ Use the teal accent sparingly — only for primary CTAs, active states, and links
- ✅ Keep table rows compact (40px) with clear hover state
- ✅ Use consistent icon sizing (16px in nav, 20px standalone, 14px inline)

---

## 9. Inspiration Summary

| Source | What to take |
|--------|-------------|
| Stripe Dashboard | Data-dense layouts, subtle borders, clean metric cards, table design |
| Linear | Minimal chrome, keyboard-first UX, monochrome + single accent |
| Vercel | Dark sidebar, developer typography, clean page structure |
| Postman | API credential UX, key management tables, environment badges |
| Kong UI | Health monitoring visuals, traffic charts, status overview patterns |

---

## 10. Scope for Design Pipeline

- **Theme modes:** Light + Dark
- **Brand collateral:** No (internal tool)
- **Component scope:** Product-relevant subset only
- **Screens to mock:** All 12 pages (Dashboard, API Inventory, API Detail, API Form, Projects, Project Detail, Audit Log, Settings, Account Settings, Notification Settings, Login/Auth, 404)
- **Mobile views:** Yes, for every screen
