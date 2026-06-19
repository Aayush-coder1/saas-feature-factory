---
version: 1.0
name: SaaS Feature Factory Design System
description: "Premium dark-themed UI system inspired by Linear's design language. Deep charcoal surface (#080710), tight Bento Grid layouts, lavender-blue accent, and hairline borders. No generic AI gradients, no sloppy components."
---

## Visual Theme

Premium dark product canvas built around `#080710` (deep charcoal, not pure black), near-white text (`#f7f8f8`), and signature lavender-blue (`#5e6ad2`) as the single chromatic accent. The system reads as software-craft: dense, technical, quietly luxurious.

Cards sit on a four-step surface ladder with hairline borders. The accent appears on CTAs, focus rings, and brand marks — never decoratively. Page rhythm leads with functional content panels rather than atmospheric color.

## Color Palette

### Brand & Accent
| Token | Hex | Role |
|-------|-----|------|
| `primary` | `#5e6ad2` | Primary CTA, brand mark, link emphasis |
| `primary-hover` | `#828fff` | Hovered primary CTA |
| `primary-focus` | `#5e69d1` | Focus ring on inputs/buttons |
| `primary-muted` | `#3d4590` | Subtle accent backgrounds (10% opacity) |

### Surface
| Token | Hex | Role |
|-------|-----|------|
| `canvas` | `#080710` | Page background — deep charcoal |
| `surface-1` | `#0f1119` | Cards, panels, tiles |
| `surface-2` | `#151720` | Featured card, hovered cards |
| `surface-3` | `#1a1c26` | Dropdown menus, sub-nav |
| `surface-4` | `#1e202b` | Deepest lifted surface |
| `hairline` | `#23262e` | Default 1px borders |
| `hairline-strong` | `#2e313a` | Stronger borders, input focus |
| `hairline-tertiary` | `#383b44` | Nested surface borders |

### Text
| Token | Hex | Role |
|-------|-----|------|
| `ink` | `#f7f8f8` | Headlines, emphasized body |
| `ink-muted` | `#d0d6e0` | Secondary text, meta info |
| `ink-subtle` | `#8a8f98` | Tertiary text, footer, disabled |
| `ink-tertiary` | `#62666d` | Placeholder, footnotes |

### Semantic
| Token | Hex | Role |
|-------|-----|------|
| `success` | `#27a644` | Status pills, success indicators |
| `warning` | `#f0a000` | Warning states, alerts |
| `error` | `#e5484d` | Error states, destructive actions |
| `info` | `#5e6ad2` | Info badges, notification dots |
| `overlay` | `#000000` | Modal/backdrop scrim |

## Typography

### Font Stack
- **Display**: `Inter, SF Pro Display, -apple-system, system-ui, Segoe UI, Roboto` — weights 500–700
- **Body**: `Inter, SF Pro Text, -apple-system, system-ui, Segoe UI, Roboto` — weights 400–500
- **Mono**: `JetBrains Mono, SF Mono, ui-monospace, Menlo` — weight 400

### Hierarchy

| Token | Size | Weight | Line Ht | Letter Sp | Use |
|-------|------|--------|---------|-----------|-----|
| `display-xl` | 80px | 600 | 1.05 | -3.0px | Hero headline |
| `display-lg` | 56px | 600 | 1.10 | -1.8px | Section opener |
| `display-md` | 40px | 600 | 1.15 | -1.0px | Sub-section title |
| `headline` | 28px | 600 | 1.20 | -0.6px | Card/pricing title |
| `card-title` | 22px | 500 | 1.25 | -0.4px | Feature card title |
| `subhead` | 20px | 400 | 1.40 | -0.2px | Lead paragraph |
| `body-lg` | 18px | 400 | 1.50 | -0.1px | Hero subtext |
| `body` | 16px | 400 | 1.50 | -0.05px | Default body |
| `body-sm` | 14px | 400 | 1.50 | 0 | Card body, footer |
| `caption` | 12px | 400 | 1.40 | 0 | Meta, status, badges |
| `button` | 14px | 500 | 1.20 | 0 | All button labels |
| `eyebrow` | 13px | 500 | 1.30 | 0.4px | Section labels |
| `mono` | 13px | 400 | 1.50 | 0 | Code, IDs |

### Principles
- Aggressive negative tracking on display sizes (-3.0px at 80px, ~4% of size)
- Display weight 600 → body weight 400 — one continuous voice
- Eyebrow uses positive tracking (+0.4px) as contrast
- Mono only in code/captions — never in body text

## Layout System

### Bento Grid

Layouts follow a **Bento Grid** modular structure:
- **3-column grid** at desktop, 2 at tablet, 1 at mobile
- **Panels span variable widths**: single (1 col), double (2 col), or full (3 col)
- **Height varies by content**: panels snap to a 4px base unit row height
- **Gap**: `16px` between cells, no outer margin on the grid container

### Spacing Tokens

| Token | Value | Use |
|-------|-------|-----|
| `space-xxs` | 4px | Base unit, mini gaps |
| `space-xs` | 8px | Inline element spacing |
| `space-sm` | 12px | Tight element pairs |
| `space-md` | 16px | Card interior, grid gap |
| `space-lg` | 24px | Section internal padding |
| `space-xl` | 32px | Card groups, testimonial padding |
| `space-xxl` | 48px | CTA banners, page sections |
| `space-section` | 96px | Page section separators |

### Whitespace Philosophy
The dark canvas IS whitespace. Sections separate by surface lift onto panels, not by gaps in white. Content density is high — no unnecessary breathing room. Within panels use `space-md` (`16px`) as the default content gap.

## Components

### Cards
| Token | BG | Rounded | Border | Padding |
|-------|----|---------|--------|---------|
| `card-default` | `surface-1` | `12px` | 1px `hairline` | `24px` |
| `card-featured` | `surface-2` | `12px` | 1px `hairline-strong` | `24px` |
| `card-bento` | `surface-1` | `16px` | 1px `hairline` | `24px` |
| `card-testimonial` | `surface-1` | `12px` | 1px `hairline` | `32px` |
| `card-screenshot` | `surface-1` | `16px` | 1px `hairline` | `24px` |

### Buttons
| Token | BG | Text | Hover | Padding | Radius |
|-------|----|------|-------|---------|-------|
| `btn-primary` | `#5e6ad2` | `#fff` | `#828fff` | `8px 16px` | `8px` |
| `btn-secondary` | `surface-1` | `ink` | `surface-2` | `8px 16px` | `8px` |
| `btn-tertiary` | transparent | `ink-muted` | `ink` | `8px 16px` | `8px` |
| `btn-ghost` | transparent | `ink-subtle` | `surface-1` | `8px 12px` | `8px` |
| `btn-icon` | transparent | `ink-muted` | `surface-1` | `8px` | `8px` |

### Inputs
| Token | BG | Text | Border | Radius | Padding |
|-------|----|------|--------|--------|---------|
| `input-text` | `surface-1` | `ink` | 1px `hairline` | `8px` | `10px 12px` |
| `input-focus` | `surface-1` | `ink` | 2px `primary` | `8px` | `10px 12px` |
| `input-error` | `surface-1` | `ink` | 1px `error` | `8px` | `10px 12px` |

### Badges & Pills
| Token | BG | Text | Radius | Padding |
|-------|----|------|--------|---------|
| `badge-default` | `surface-2` | `ink-muted` | `9999px` | `2px 8px` |
| `badge-success` | `#27a644` (15% opacity) | `success` | `9999px` | `2px 8px` |
| `badge-warning` | `#f0a000` (15% opacity) | `warning` | `9999px` | `2px 8px` |
| `badge-error` | `#e5484d` (15% opacity) | `error` | `9999px` | `2px 8px` |
| `badge-info` | `#5e6ad2` (15% opacity) | `primary` | `9999px` | `2px 8px` |

### Navigation
- **Top nav**: `canvas` background, `ink` text, `body-sm`, height `56px`, hairline bottom border
- **Sidebar** (when applicable): `surface-1` background, `256px` width, hairline right border
- **Active link**: `primary` text color, left accent bar (2px `primary`)

## Elevation & Depth

| Level | Treatment | Use |
|-------|-----------|-----|
| 0 | No shadow, no border | Default text, canvas content |
| 1 | `surface-1` + 1px `hairline` | Cards, panels |
| 2 | `surface-2` + 1px `hairline-strong` | Featured/hovered cards |
| 3 | `surface-3` | Dropdowns, popovers |
| Focus | 2px `primary` outline at 50% opacity | Focused inputs, buttons |

**No box-shadows on dark surfaces.** Depth is carried entirely by the surface ladder + hairline borders. Box-shadows on dark backgrounds look muddy and are explicitly forbidden.

## Shapes

### Border Radius
| Token | Value | Use |
|-------|-------|-----|
| `radius-xs` | 4px | Chips, status badges |
| `radius-sm` | 6px | Inline tags |
| `radius-md` | 8px | Buttons, inputs |
| `radius-lg` | 12px | Cards, testimonials |
| `radius-xl` | 16px | Bento panels, screenshots |
| `radius-pill` | 9999px | Badges, toggle pills |

## Do's and Don'ts

### Do
- Use `#080710` canvas as the anchor — the charcoal tint is intentional
- Use `#5e6ad2` ONLY for: CTAs, brand mark, focus rings, link emphasis, info badges
- Use the 4-step surface ladder for hierarchy — never skip levels
- Keep hairline borders at 1px, never thicker
- Apply negative letter-spacing aggressively on display text
- Use Bento Grid for feature layouts (variable width/height panels)
- Keep CTAs at `8px` radius (rounded-md) — never pill
- Lead sections with functional content (screenshots, code, data) not decorative imagery
- Maintain high content density — the dark surface IS the spacing

### Don't
- ❌ **No generic AI gradients** — no purple-to-pink, no blue-to-teal atmospheric backgrounds
- ❌ **No box-shadows** on dark surfaces — use surface ladder instead
- ❌ **No pill-rounded CTAs** — keep at 8px radius
- ❌ **No true black** `#000000` as canvas — always `#080710`
- ❌ **No second chromatic accent** — no orange, green, or pink for decorative use
- ❌ **No `#5e6ad2` as card fill or section background** — accent is for CTAs/focus only
- ❌ **No sloppy components** — every interactive element must define default/hover/focus/disabled states
- ❌ **No light mode** — the surface system is dark-only
- ❌ **No atmospheric or blur backgrounds** — keep surfaces flat and crisp
- ❌ **No stale or orphaned CSS** — every style token must map to this design system

## Agent Prompt Guide

### Color Quick Reference
```
Brand:    #5e6ad2 (primary) | #828fff (hover) | #5e69d1 (focus)
Canvas:   #080710
Surfaces: #0f1119 → #151720 → #1a1c26 → #1e202b
Text:     #f7f8f8 (ink) | #d0d6e0 (muted) | #8a8f98 (subtle)
Borders:  #23262e (default) | #2e313a (strong)
Success:  #27a644  Warning: #f0a000  Error: #e5484d
```

### Copy-Paste Prompt
> "Use the DESIGN.md in the project root as the absolute source of truth for all UI styling. Every component must reference color tokens by semantic name, not raw hex. Cards lift via the surface ladder, never shadows. The accent is `#5e6ad2` on CTAs and focus rings only. No gradients, no light mode, no pill buttons. Bento Grid layouts with 16px gap. All interactive elements must define hover, focus, and disabled states."

### State Requirements
Every interactive component must define these states in the agent's output:
- **default** — resting appearance
- **hover** — `primary-hover` for primary buttons, `surface-2` for secondary/ghost
- **focus** — 2px `primary-focus` outline at 50% opacity on the container
- **disabled** — `ink-tertiary` text, `surface-1` background, no hover effects, `cursor: not-allowed`
- **active/pressed** — `primary-focus` background for primary buttons, `surface-3` for secondary

### Iteration Rules
1. Reference every component by its DESIGN.md token name — never invent ad-hoc styles
2. For new sections, decide the surface lift level first
3. Default body to `Inter 400 16px` with `1.50` line height
4. Never introduce a color outside the defined palette
5. If a component variant is needed, add it as a new token entry — don't inline custom styles
