# Cortex Design System: Color Palette & Type Scale

## Goals

- Professional, modern, and calm visual language suitable for a productivity app
- Consistent and accessible across light and dark themes (target WCAG AA)
- Easy to implement with Tailwind + Shadcn using CSS variables (HSL numeric tokens)


## Color System

- Neutral base: Slate (professional neutrals)
- Primary: Indigo (trustworthy/tech/professional)
- Accent: Teal (fresh highlight), used sparingly
- Semantic: Success (Emerald), Warning (Amber), Destructive (Rose)

### Palette (Hex)

- Neutral (Slate):  
  50 `#f8fafc` · 100 `#f1f5f9` · 200 `#e2e8f0` · 300 `#cbd5e1` · 400 `#94a3b8` · 500 `#64748b` · 600 `#475569` · 700 `#334155` · 800 `#1e293b` · 900 `#0f172a`

- Primary (Indigo):  
  50 `#eef2ff` · 100 `#e0e7ff` · 200 `#c7d2fe` · 300 `#a5b4fc` · 400 `#818cf8` · 500 `#6366f1` · 600 `#4f46e5` · 700 `#4338ca` · 800 `#3730a3` · 900 `#312e81`

- Accent (Teal):  
  50 `#f0fdfa` · 100 `#ccfbf1` · 200 `#99f6e4` · 300 `#5eead4` · 400 `#2dd4bf` · 500 `#14b8a6` · 600 `#0d9488` · 700 `#0f766e` · 800 `#115e59` · 900 `#134e4a`

- Semantic (recommended bases):  
  Success: `#059669` (emerald-600)  
  Warning: `#d97706` (amber-600)  
  Destructive: `#e11d48` (rose-600)


### Shadcn Token Mapping (light/dark)

Copy‑paste these CSS variables (HSL numeric form). They work with Tailwind/Shadcn via `hsl(var(--token) / <alpha-value>)`.

```css
:root {
  /* Surfaces */
  --background: 0 0% 100%;
  --foreground: 222.2 47.4% 11.2%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 47.4% 11.2%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 47.4% 11.2%;

  /* Brand */
  --primary: 245 75% 58%;     /* indigo-600 */
  --primary-foreground: 0 0% 100%;
  --secondary: 215 20% 24%;   /* slate-700 (buttons/surfaces) */
  --secondary-foreground: 0 0% 100%;
  --accent: 174 72% 37%;      /* teal-500 */
  --accent-foreground: 0 0% 100%;

  /* Semantic */
  --muted: 215 16% 47%;
  --muted-foreground: 215 16% 24%;
  --destructive: 351 74% 51%; /* rose-600 */
  --destructive-foreground: 0 0% 100%;

  /* Lines & focus */
  --border: 214 32% 91%;      /* slate-200 */
  --input: 214 32% 91%;
  --ring: 245 75% 58%;        /* primary */

  /* Radius */
  --radius: 0.6rem;
}

.dark {
  --background: 222.2 84% 4.9%;   /* ~slate-950 */
  --foreground: 210 40% 98%;
  --card: 222.2 84% 5.5%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 5.5%;
  --popover-foreground: 210 40% 98%;

  --primary: 245 75% 65%;        /* slightly brighter for dark */
  --primary-foreground: 0 0% 100%;
  --secondary: 215 23% 18%;      /* slate-800 */
  --secondary-foreground: 210 40% 98%;
  --accent: 174 72% 45%;
  --accent-foreground: 0 0% 100%;

  --muted: 217 19% 27%;
  --muted-foreground: 215 20% 81%;
  --destructive: 351 75% 60%;
  --destructive-foreground: 0 0% 100%;

  --border: 217 19% 27%;
  --input: 217 19% 27%;
  --ring: 245 75% 65%;
}
```


### Usage Guidance

- Primary is for CTAs, active states, focus rings, and selection.
- Accent is for subtle highlights/badges/progress—not a second brand color.
- Surfaces: use `--card` for elevated blocks; `--popover` for overlays.
- Borders: slate‑200 (light), slate‑700 (dark). Reduce density—prefer separators.
- Disabled: reduce opacity to ~60% and use `--muted-foreground` for text.
- Success/Warning/Destructive are best as background pills with their foreground set to white; for body text on white, see Accessibility notes below.


## Type Scale

- Base: Geist Sans (already in project)
- Ratio: Major Third (≈1.25) for readable hierarchy

| Token        | Size | Line height | Weight | Example          |
|--------------|------|-------------|--------|------------------|
| Display lg   | 60px | 1.10        | 700    | Hero tagline     |
| Display md   | 48px | 1.10        | 700    | Section hero     |
| H1           | 36px | 1.15        | 700    | Page title       |
| H2           | 30px | 1.20        | 600    | Section title    |
| H3           | 24px | 1.25        | 600    | Subsection       |
| H4           | 20px | 1.30        | 600    | Heading small    |
| Body lg      | 18px | 1.60        | 400/500| Long‑form text   |
| Body         | 16px | 1.60        | 400/500| Default text     |
| Body sm      | 14px | 1.50        | 400/500| Secondary text   |
| Caption/xs   | 12px | 1.40        | 500    | Meta, labels     |

- Letter‑spacing: headings `-0.005em`; body `0` to `0.01em`  
- Numeric UIs (timers, counters): prefer tabular numbers

Suggested Tailwind aliases:

```css
.h1 { @apply text-4xl leading-tight font-bold tracking-[-0.005em]; }
.h2 { @apply text-3xl leading-snug font-semibold; }
.h3 { @apply text-2xl leading-snug font-semibold; }
.h4 { @apply text-xl leading-relaxed font-semibold; }
.body { @apply text-base leading-7; }
.body-sm { @apply text-sm leading-6; }
.caption { @apply text-xs leading-5 font-medium; }
```


## Accessibility & Contrast (WCAG)

Target: AA (4.5:1 for body text; 3:1 for large text ≥ 24px/700 or ≥ 18.66px/700).

Recommended text-on-surface combinations:
- Primary on white: prefer `indigo-700` (`#4338ca`) for small text (AA). `indigo-600` is best used as background with white text.
- Destructive on white: prefer `rose-700` for text. Use `rose-600` as background with `--destructive-foreground` (white).
- Success on white: prefer `emerald-700` for text. Use `emerald-600` as background with white.
- Warning on white: prefer `amber-700` for text. Use `amber-600` as background with white.
- Neutrals: `--foreground` on `--background` and the inverse in dark mode pass comfortably.

Notes:
- Always validate key pairs in real UI contexts (hover/active/disabled states).
- For icon-only buttons, ensure a visible focus ring (`--ring`) and minimum 44×44px tap target.


## Implementation Guide

Add the tokens to your global CSS and map them in Tailwind so Shadcn components inherit them.

1) Add tokens in `src/app/globals.css` (inside `:root` and `.dark`).  
2) Map Tailwind colors to CSS variables in `tailwind.config.ts`:

```ts
// tailwind.config.ts (snippet)
import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
} satisfies Config
```

3) Shadcn UI inherits these tokens automatically. Ensure your theme class toggles `.dark` on `<html>` or `<body>`.

4) Focus ring: use Tailwind utilities `ring-2 ring-primary` for custom focus states when needed.

5) Gradual brand tuning: if you later prefer a cooler/warmer brand, only the `--primary` variables need adjustments.


## Visual Examples (suggested)

- Buttons: primary/secondary/destructive (default/hover/disabled) in light & dark
- Cards: elevated vs. default surface with borders/separators
- Inputs: neutral vs. focus states


## Summary

This document defines a professional, modern color palette and type scale for Cortex, with accessible tokenized themes for light/dark, practical usage notes, and copy‑paste code to implement in Tailwind + Shadcn.


