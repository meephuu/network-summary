/**
 * Colour themes. The site's colours are CSS custom properties (--bg, --accent, …) that every
 * component and canvas widget reads, so changing them here recolours the whole site.
 *
 * You normally don't edit this file: pick a preset / base / mode in `src/site.config.ts`.
 * Add a new preset by adding an entry to ACCENTS below. All colours must be hex (#rrggbb),
 * because canvas widgets mix them with alpha via `withAlpha()`.
 */

export type Hex = `#${string}`

/** Every colour variable the site uses. */
export type ColorVar =
  | '--bg' | '--surface' | '--surface-2' | '--text' | '--muted' | '--border'
  | '--accent' | '--accent-soft'
  | '--def' | '--def-soft' | '--ex' | '--ex-soft' | '--warn' | '--warn-soft' | '--tip' | '--tip-soft'
export type Palette = Record<ColorVar, Hex>

/* ---------------- accent presets (light / dark pairs) ---------------- */

export const ACCENTS = {
  indigo: { light: '#3451c7', dark: '#8ea2ff' },
  blue: { light: '#1f6fd1', dark: '#7cb6ff' },
  teal: { light: '#0f7f7a', dark: '#5fd4cb' },
  emerald: { light: '#1f8a4c', dark: '#6fd394' },
  rose: { light: '#c2335b', dark: '#ff8fae' },
  orange: { light: '#c4520e', dark: '#ff9d5c' },
  violet: { light: '#7a3fc4', dark: '#c3a0ff' },
  pink: { light: '#b8327e', dark: '#f59ad0' },
  slate: { light: '#3d4a5c', dark: '#b4c0d0' },
} satisfies Record<string, { light: Hex; dark: Hex }>

export type AccentPreset = keyof typeof ACCENTS

/* ---------------- background bases ---------------- */

type Neutrals = Pick<Palette, '--bg' | '--surface' | '--surface-2' | '--text' | '--muted' | '--border'>

export const BASES = {
  /** cream paper (the original CEM II look) */
  warm: {
    light: { '--bg': '#f8f7f3', '--surface': '#ffffff', '--surface-2': '#f1efe9', '--text': '#1d2026', '--muted': '#5d6470', '--border': '#e4e0d6' },
    dark: { '--bg': '#0a0b0d', '--surface': '#131418', '--surface-2': '#1b1d22', '--text': '#e7e8ea', '--muted': '#a3a9b4', '--border': '#262930' },
  },
  /** blue-grey */
  cool: {
    light: { '--bg': '#f4f6fa', '--surface': '#ffffff', '--surface-2': '#eaeef5', '--text': '#1a1f2b', '--muted': '#5a6478', '--border': '#dde3ee' },
    dark: { '--bg': '#0b0d12', '--surface': '#12151d', '--surface-2': '#1a1e28', '--text': '#e5e8ef', '--muted': '#a0a8b8', '--border': '#252a36' },
  },
  /** plain grey */
  neutral: {
    light: { '--bg': '#f6f6f6', '--surface': '#ffffff', '--surface-2': '#eeeeee', '--text': '#1e1e1e', '--muted': '#5f5f5f', '--border': '#e0e0e0' },
    dark: { '--bg': '#0a0a0a', '--surface': '#141414', '--surface-2': '#1c1c1c', '--text': '#e8e8e8', '--muted': '#a6a6a6', '--border': '#2a2a2a' },
  },
} satisfies Record<string, { light: Neutrals; dark: Neutrals }>

export type BasePreset = keyof typeof BASES

/* ---------------- callout boxes (Def / Example / Warn / Tip) ---------------- */

const CALLOUTS = {
  light: { '--ex': '#23864a', '--ex-soft': '#eaf6ee', '--warn': '#c4520e', '--warn-soft': '#fdf0e6', '--tip': '#8a35a8', '--tip-soft': '#f6ecfa' },
  dark: { '--ex': '#6fd394', '--ex-soft': '#10201a', '--warn': '#ff9d5c', '--warn-soft': '#26180f', '--tip': '#d79bf0', '--tip-soft': '#211627' },
} satisfies Record<'light' | 'dark', Partial<Palette>>

/* ---------------- config type ---------------- */

export interface ThemeConfig {
  /** a preset name from ACCENTS, or your own pair of colours */
  accent: AccentPreset | { light: Hex; dark: Hex }
  /** background / text greys. Default 'warm' */
  base?: BasePreset
  /** 'auto' follows the reader's OS setting. Default 'auto' */
  mode?: 'auto' | 'light' | 'dark'
  /** override any single colour, e.g. { light: { '--warn': '#d00000' } } */
  overrides?: { light?: Partial<Palette>; dark?: Partial<Palette> }
}

/* ---------------- building the palette ---------------- */

/** a·(1−t) + b·t, per RGB channel */
export function mixHex(a: string, b: string, t: number): Hex {
  const p = (h: string) => {
    let s = h.replace('#', '')
    if (s.length === 3) s = s.split('').map((c) => c + c).join('')
    const n = parseInt(s, 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const [x, y] = [p(a), p(b)]
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')}`
}

function palette(cfg: ThemeConfig, scheme: 'light' | 'dark'): Palette {
  const base = BASES[cfg.base ?? 'warm'][scheme]
  const acc = typeof cfg.accent === 'string' ? ACCENTS[cfg.accent][scheme] : cfg.accent[scheme]
  // soft tint = a little accent mixed into the page surface
  const soft = mixHex(base['--surface'], acc, scheme === 'light' ? 0.11 : 0.16)
  const defSoft = mixHex(base['--surface'], acc, scheme === 'light' ? 0.07 : 0.1)
  return {
    ...base,
    '--accent': acc,
    '--accent-soft': soft,
    '--def': acc,
    '--def-soft': defSoft,
    ...CALLOUTS[scheme],
    ...cfg.overrides?.[scheme],
  }
}

const block = (sel: string, p: Palette, scheme: 'light' | 'dark') => {
  const isLight = scheme === 'light'
  const thumb = isLight ? '29, 32, 38' : '231, 232, 234'
  return `${sel}{color-scheme:${scheme};${Object.entries(p)
    .map(([k, v]) => `${k}:${v};`)
    .join('')}--scroll-thumb:rgba(${thumb},${isLight ? 0.22 : 0.16});--scroll-thumb-hover:rgba(${thumb},${isLight ? 0.4 : 0.32});}`
}

/** CSS text for the chosen theme (light block, dark block and/or media query). */
export function themeCss(cfg: ThemeConfig): string {
  const mode = cfg.mode ?? 'auto'
  if (mode === 'light') return block(':root', palette(cfg, 'light'), 'light')
  if (mode === 'dark') return block(':root', palette(cfg, 'dark'), 'dark')
  return (
    block(':root', palette(cfg, 'light'), 'light') +
    `@media (prefers-color-scheme: dark){${block(':root', palette(cfg, 'dark'), 'dark')}}`
  )
}

/** Inject the theme into <head> (runs once, before React renders, so there's no colour flash). */
export function applyTheme(cfg: ThemeConfig) {
  const el = document.createElement('style')
  el.id = 'site-theme'
  el.textContent = themeCss(cfg)
  document.head.appendChild(el)

  // favicon in the accent colour: an open notebook
  const acc = palette(cfg, 'light')['--accent']
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect x='5' y='3' width='22' height='26' rx='4' fill='${acc}'/><rect x='9' y='9' width='14' height='2.6' rx='1.3' fill='white'/><rect x='9' y='14.7' width='14' height='2.6' rx='1.3' fill='white' opacity='.8'/><rect x='9' y='20.4' width='9' height='2.6' rx='1.3' fill='white' opacity='.6'/></svg>`
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]') ?? document.head.appendChild(document.createElement('link'))
  link.rel = 'icon'
  link.type = 'image/svg+xml'
  link.href = 'data:image/svg+xml,' + encodeURIComponent(svg)
}

/** Per-chapter accent: overrides --accent / --accent-soft on <html>. Undefined → back to the theme accent. */
let currentAccent: string | undefined
export function applyChapterAccent(hex?: string) {
  if (hex === currentAccent) return
  currentAccent = hex
  const st = document.documentElement.style
  if (!hex) {
    st.removeProperty('--accent')
    st.removeProperty('--accent-soft')
    return
  }
  const surface = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#0f0f0f'
  st.setProperty('--accent', hex)
  st.setProperty('--accent-soft', mixHex(surface, hex, 0.14))
}
