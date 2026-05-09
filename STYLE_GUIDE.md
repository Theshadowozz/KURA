# STYLE_GUIDE

Tujuan: panduan ringkas untuk konsistensi UI/UX bagi developer dan reviewer.

## Scope
- Audience: frontend developer, designer reviewer
- Fokus: warna, tipografi, spacing, komponen utama, accessibility, dan cara kontribusi

## Brand / Identity
- Logo: `frontend/public/logo/` (gunakan versi PNG/SVG dengan clearspace 16px)
- Voice: informatif, hangat, dan bersahabat — hindari emoji dalam copy

## Palet Warna (contoh)
- Primary: #0B63FF  (buttons, primary links)
- Accent:  #00B894  (highlights, success actions)
- Neutral-900: #0F1724 (text primary)
- Neutral-600: #6B7280 (muted text)
- Background: #FFFFFF
- Surface: #F7FAFC
- Error: #E11D48

Accessibility note: Pastikan contrast ratio minimal 4.5:1 untuk teks kecil.

## Tipografi
- Primary font: Inter, fallback: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial
- Scale (desktop):
  - h1: 32px / 40px line-height
  - h2: 24px / 32px
  - body: 16px / 24px
  - caption: 12px / 18px

## UI Tokens (CSS variables)
Definisikan di `:root` dan gunakan di komponen.

Example tokens:

```
:root {
  --color-primary: #0B63FF;
  --color-accent: #00B894;
  --color-bg: #FFFFFF;
  --color-surface: #F7FAFC;
  --color-text: #0F1724;
  --radius-sm: 6px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
}
```

## Layout & Breakpoints
- Container widths: mobile 100%, tablet 720px, desktop 1120px
- Breakpoints:
  - small: 0-639px
  - medium: 640-899px
  - large: 900px+

## Komponen Utama (ringkas)

- Button
  - Variants: `primary`, `secondary`, `ghost`
  - States: default, hover, active, disabled, focus (outline visible)
  - Example HTML:

```
<button class="btn btn--primary">Kirim</button>
```

- Input / Select
  - Provide helper text, success, and error states.
  - Use `aria-invalid` and `aria-describedby` for accessibility.

- Tabs / Panels
  - Use `role="tablist"` and `role="tabpanel"` with keyboard navigation (Arrow keys)

- Modals
  - Trap focus, close on `Esc`, provide accessible label (`aria-labelledby`)

## Loading / Empty / Error states
- Show skeletons for content-heavy panels (chat, dictionary list)
- Provide retry action and inline error messages for network failures

## Accessibility
- All interactive elements must be keyboard accessible.
- Use semantic HTML and ARIA where needed.
- Provide `alt` for images and `aria-label` for icon-only buttons.
- Respect `prefers-reduced-motion` and reduce animations when enabled.

## Icons & Imagery
- Prefer SVG icons from a single source (store in `frontend/public/icons/`)
- No emojis in UI text or documentation

## Motion & Interaction
- Standard easing: cubic-bezier(.2,.9,.2,1)
- Durations: short 150ms, medium 300ms, long 500ms

## Code & Contribution
- Tokens live in `frontend/src/styles.css` or `:root` CSS file.
- To add a token: update `:root`, add usage example, and create a small PR with screenshots.

## Examples
- Primary button CSS (reference):

```
.btn--primary {
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
}

.btn--primary:focus { outline: 3px solid rgba(11,99,255,0.2); }
```

## Review checklist (for PRs)
- Visual: matches tokens and spacing
- Accessibility: keyboard, aria labels, color contrast
- Responsiveness: layouts at breakpoints
- No emojis in copy or docs

---

