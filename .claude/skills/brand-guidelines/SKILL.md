# Brand Guidelines — Predivo API Dashboard

> This skill is auto-enforced during all frontend work. Every component, page, and style change MUST comply.

## Identity

- **Product:** Predivo API Dashboard (internal API management tool)
- **Aesthetic:** Precise Developer Console — data-dense, border-first, monochrome + teal accent
- **Fonts:** Inter (UI), JetBrains Mono (code/data/credentials)
- **Accent:** Teal (#0D9488 light / #2DD4BF dark) — the ONLY accent color

## Mandatory Rules

### Colors
- ALL colors must use design token CSS variables — never hardcode hex/rgb values
- Accent color (teal) is used ONLY for: primary buttons, active nav items, links, focus rings
- Status colors: green=success, amber=warning, red=error, blue=info — never use these decoratively
- Cards use 1px borders, NOT shadows — shadows are reserved for overlays (dropdowns, modals, toasts)
- Sidebar is dark (#0F172A light mode / #0A0D11 dark mode) in both themes

### Typography
- Inter for all UI text (labels, headings, body, navigation)
- JetBrains Mono for: API keys, credentials, endpoint URLs, JSON content, code snippets, audit log entries
- Use weight progression for hierarchy (700 → 600 → 500 → 400), not excessive size changes
- Default body text: 14px/20px — this is a dense data tool, not a marketing site
- Overlines/labels: 11px uppercase with letter-spacing 0.06em

### Layout
- Sidebar: fixed 240px wide, dark background
- Content max-width: 1280px with 32px padding (desktop), 24px (tablet), 16px (mobile)
- Table rows: 40px height, compact
- Metric cards: 4-column grid on desktop, stack vertically on mobile
- Page structure: Title + description → action bar → content area

### Components
- Buttons: flat (no gradients), border-radius 6px (md)
- Cards: white surface + 1px border, border-radius 8px (lg), no shadow
- Badges/status: dot + text label, never color alone
- Inputs: 40px height (md), 1px border, 2px teal focus ring
- Icons: Lucide React, 16px in nav, 20px standalone, stroke-width 1.75

### Spacing
- 4px base unit grid
- Component internal padding: 12-16px
- Card padding: 20-24px
- Section gaps: 24-32px
- Page section spacing: 32-48px

## Anti-Slop Checklist (verify before every commit)

- [ ] No hardcoded color values (all from design tokens)
- [ ] No gradients on buttons or cards
- [ ] No shadows on cards (only borders)
- [ ] No rounded-full on containers (max: xl/12px)
- [ ] No decorative illustrations or emoji in UI
- [ ] API keys/URLs/code use JetBrains Mono, not Inter
- [ ] All text meets WCAG AA contrast (4.5:1 minimum)
- [ ] Both light and dark mode work correctly
- [ ] Only teal used as accent — no secondary accent colors
- [ ] Status always has text label, not just color
- [ ] Loading states use skeletons, not spinners (except action buttons)
