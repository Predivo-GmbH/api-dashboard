# Design System — Predivo API Dashboard

> Human-readable design specification. For canonical values, see `design-tokens.json`.
> For automated enforcement, see `.claude/skills/brand-guidelines/SKILL.md`.

---

## 1. Foundations

### Color System

**Accent: Teal** — the single brand color used across the entire product.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `accent-default` | `#0D9488` | `#2DD4BF` | Primary buttons, active states, links |
| `accent-hover` | `#0F766E` | `#5EEAD4` | Hover state on accent elements |
| `accent-subtle` | `#F0FDFA` | `#042F2E` | Tinted backgrounds (selected rows, badges) |
| `accent-muted` | `#CCFBF1` | `#134E4A` | Stronger tinted backgrounds |

**Surfaces:**

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `surface-page` | `#F8FAFB` | `#0C0F14` | Page background |
| `surface-default` | `#FFFFFF` | `#151921` | Cards, panels |
| `surface-elevated` | `#FFFFFF` | `#1C2130` | Dropdowns, modals, popovers |
| `surface-sunken` | `#F1F5F9` | `#0A0D11` | Recessed areas, code blocks |
| `surface-sidebar` | `#0F172A` | `#0A0D11` | Navigation sidebar |

**Text (ink):**

| Token | Light | Dark | Min Contrast |
|-------|-------|------|-------------|
| `ink-default` | `#0F172A` | `#F1F5F9` | 15:1 |
| `ink-secondary` | `#475569` | `#94A3B8` | 4.5:1 |
| `ink-tertiary` | `#94A3B8` | `#64748B` | 3:1 (large text only) |
| `ink-placeholder` | `#CBD5E1` | `#475569` | 2:1 (placeholder only) |

**Borders (edge):**

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `edge-default` | `#E2E8F0` | `rgba(255,255,255,0.1)` | Card borders, dividers |
| `edge-strong` | `#CBD5E1` | `rgba(255,255,255,0.15)` | Table headers, emphasized borders |
| `edge-focus` | `#0D9488` | `#2DD4BF` | Focus rings |

**Status colors:**

| Status | Color (Light) | Color (Dark) | Background (Light) | Border (Light) |
|--------|--------------|-------------|-------------------|----------------|
| Success | `#16A34A` | `#22C55E` | `#F0FDF4` | `#BBF7D0` |
| Warning | `#D97706` | `#F59E0B` | `#FFFBEB` | `#FDE68A` |
| Error | `#DC2626` | `#EF4444` | `#FEF2F2` | `#FECACA` |
| Info | `#2563EB` | `#3B82F6` | `#EFF6FF` | `#BFDBFE` |

---

### Typography

**Font Families:**
- **Inter** — all UI text (headings, body, labels, navigation, buttons)
- **JetBrains Mono** — code, API keys, credentials, endpoint URLs, JSON, audit entries

**Type Scale:**

| Name | Size | Line Height | Weight | Spacing | Usage |
|------|------|-------------|--------|---------|-------|
| Display | 30px | 36px | 700 | -0.02em | Page titles (Dashboard, Settings) |
| H1 | 24px | 32px | 700 | -0.01em | Section titles |
| H2 | 20px | 28px | 600 | -0.01em | Card titles, sub-sections |
| H3 | 16px | 24px | 600 | 0 | Table section headers |
| H4 | 14px | 20px | 600 | 0 | Form group labels |
| Body | 14px | 20px | 400 | 0 | Default text |
| Body Small | 13px | 18px | 400 | 0 | Dense text, table cells |
| Caption | 12px | 16px | 500 | 0.01em | Badges, timestamps, helpers |
| Overline | 11px | 16px | 600 | 0.06em | Section labels (uppercase) |
| Mono Body | 13px | 20px | 400 | 0 | API keys, code, URLs |
| Mono Small | 12px | 16px | 400 | 0 | Inline code, credential fragments |

---

### Spacing

**Base unit: 4px** — all spacing values are multiples of 4.

| Scale | Value | Usage |
|-------|-------|-------|
| 1 | 4px | Tight inline gaps |
| 2 | 8px | Icon-to-label gaps, compact padding |
| 3 | 12px | Input padding, small card padding |
| 4 | 16px | Standard component gap, mobile page padding |
| 5 | 20px | Card padding |
| 6 | 24px | Section padding, tablet page padding |
| 8 | 32px | Section gaps, desktop page padding |
| 10 | 40px | Large section gaps |
| 12 | 48px | Page section spacing |

---

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 4px | Badges, tags, inline code |
| `md` | 6px | Buttons, inputs, selects |
| `lg` | 8px | Cards, panels, tables |
| `xl` | 12px | Modals, popovers, large containers |
| `full` | 9999px | Status dots, avatars only |

**Rule:** Cards max at `lg` (8px). No `rounded-full` on containers.

---

### Shadows

**Border-first design:** Cards and panels use 1px borders, not shadows.

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle depth hint (rarely used) |
| `md` | `0 4px 6px rgba(0,0,0,0.07)` | Dropdowns, popovers |
| `lg` | `0 10px 15px rgba(0,0,0,0.08)` | Modals, dialogs |
| `xl` | `0 20px 25px rgba(0,0,0,0.1)` | Toasts, command palette |

---

## 2. Components (Product-Relevant Subset)

### Actions
| Component | Variants | States |
|-----------|----------|--------|
| Button | primary (teal), secondary, outline, ghost, destructive | default, hover, active, disabled, loading |
| Icon Button | primary, ghost | default, hover, active, disabled |

### Forms
| Component | States |
|-----------|--------|
| Input | default, hover, focus, filled, error, disabled |
| Textarea | default, focus, error, disabled |
| Select | default, open, focus, error, disabled |
| Checkbox | unchecked, checked, indeterminate, disabled |
| Switch | off, on, disabled |
| Label | default |
| Form Field | label + input + helper + error composition |

### Display
| Component | Variants |
|-----------|----------|
| Card | default (bordered), interactive (hover border) |
| Badge | default, teal/accent, success, warning, error, info |
| Status Badge | dot + text (active, expiring, down, inactive) |
| Avatar | initials, fallback icon |
| Metric Card | value + label + trend indicator |
| Skeleton | line, card, table-row |
| Separator | horizontal, vertical |
| Tooltip | top, bottom, left, right |
| Credential Display | masked + reveal toggle + copy button (mono font) |

### Navigation
| Component | States |
|-----------|--------|
| Sidebar | expanded (240px) |
| Nav Item | default, hover, active |
| Breadcrumb | default |
| Tabs | default, active |
| Pagination | previous, next, page numbers |

### Tables
| Component | States |
|-----------|--------|
| Table Header | sortable, sorted-asc, sorted-desc |
| Table Row | default, hover, selected |
| Table Cell | text, badge, action, mono |
| Data Table | composed: header + rows + pagination + filters |

### Feedback
| Component | Variants |
|-----------|----------|
| Alert | info, success, warning, error |
| Toast (Sonner) | info, success, warning, error |
| Dialog | confirm, destructive |

### Overlays
| Component | Notes |
|-----------|-------|
| Modal | shadow-lg, centered, backdrop blur |
| Dropdown Menu | shadow-md, 4px border-radius |
| Popover | shadow-md, arrow optional |

### Layout
| Component | Notes |
|-----------|-------|
| Page Shell | sidebar + main content area |
| Content Area | max-width 1280px, responsive padding |
| Section | overline label + content + optional divider |

---

## 3. Composed Blocks

| Block | Components Used |
|-------|----------------|
| **Login form** | Card + Input + Button + Logo |
| **Dashboard shell** | Sidebar + Header + Metric Cards (4-col) + Chart + Recent table |
| **API inventory table** | Search input + Filter badges + Data Table + Pagination |
| **API detail tabs** | Tabs + Card sections (Overview, Credentials, Subscriptions, Health, Usage) |
| **Credential card** | Card + Credential Display (masked) + Copy + Reveal + Status Badge |
| **Settings form** | Card groups + Form Fields + Save/Cancel buttons |
| **Audit log table** | Date filter + Data Table (timestamp, user, action, details in mono) |
| **Empty state** | Centered icon + heading + description + CTA button |
| **Password gate** | Centered card + Input + Button (no sidebar) |

---

## 4. Responsive Breakpoints

| Breakpoint | Width | Behavior |
|-----------|-------|----------|
| Mobile | < 768px | Sidebar hidden (hamburger), single column, tables → card lists |
| Tablet | 768–1023px | Sidebar overlay, 2-column metric grid |
| Desktop | 1024–1279px | Sidebar visible, full layout |
| Wide | ≥ 1280px | Max-width content, centered |

### Mobile Adaptations

| Desktop Element | Mobile Behavior |
|----------------|----------------|
| Sidebar | Hamburger menu + overlay |
| Metric card row (4-col) | Stack vertically, full-width |
| Data tables | Card list view or horizontal scroll |
| Tab bar | Horizontal scroll strip |
| Modals | Full-screen sheets |
| Pagination | Previous/Next only |
| Action buttons in table rows | Overflow menu (⋯) |
