import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import styles from './PageSearch.module.css'

/**
 * Find-in-page for the current chapter (top-right).
 * Opens with the button, Ctrl/⌘+F or `/`. Enter / Shift+Enter = next / previous, Esc = close.
 * Pressing Ctrl/⌘+F again while the box is focused falls through to the browser's own find.
 *
 * Matches are painted with the CSS Custom Highlight API (no DOM changes, so React stays happy);
 * text inside closed <details> (ดูวิธีทำ) is searched too and the <details> opens when you jump to it.
 */

const HL_ALL = 'page-search'
const HL_CURRENT = 'page-search-current'
const MAX_MATCHES = 2000

type HighlightRegistry = { set(name: string, h: unknown): void; delete(name: string): void }
type HighlightCtor = new (...ranges: Range[]) => unknown

function highlightApi(): { registry: HighlightRegistry; Highlight: HighlightCtor } | null {
  const css = (globalThis as { CSS?: { highlights?: HighlightRegistry } }).CSS
  const Highlight = (globalThis as { Highlight?: HighlightCtor }).Highlight
  return css?.highlights && Highlight ? { registry: css.highlights, Highlight } : null
}

function clearHighlights() {
  const api = highlightApi()
  api?.registry.delete(HL_ALL)
  api?.registry.delete(HL_CURRENT)
}

/** Text nodes whose text is invisible duplicates or not content. */
function skipNode(node: Text): boolean {
  const el = node.parentElement
  if (!el) return true
  return !!el.closest('script, style, noscript, .katex-mathml, [data-search-skip]')
}

/** Visible, or only hidden because a <details> around it is closed. */
function reachable(range: Range): boolean {
  if (range.getClientRects().length > 0) return true
  const el = range.startContainer.parentElement
  return !!el?.closest('details:not([open])')
}

function findMatches(root: HTMLElement, query: string): Range[] {
  const q = query.toLocaleLowerCase()
  if (!q) return []
  const out: Range[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    if (skipNode(n)) continue
    const text = n.data.toLocaleLowerCase()
    let i = text.indexOf(q)
    while (i !== -1) {
      const r = document.createRange()
      r.setStart(n, i)
      r.setEnd(n, i + q.length)
      if (reachable(r)) out.push(r)
      if (out.length >= MAX_MATCHES) return out
      i = text.indexOf(q, i + q.length)
    }
  }
  return out
}

function openEnclosingDetails(range: Range) {
  let el = range.startContainer.parentElement?.closest('details') ?? null
  while (el) {
    if (!el.open) el.open = true
    el = el.parentElement?.closest('details') ?? null
  }
}

function scrollToRange(range: Range) {
  const rect = range.getBoundingClientRect()
  if (rect.top >= 90 && rect.bottom <= window.innerHeight - 90) return
  window.scrollTo({ top: window.scrollY + rect.top - window.innerHeight / 3 })
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m10.5 10.5 3.6 3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function Arrow({ dir }: { dir: 'up' | 'down' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
      <path
        d={dir === 'up' ? 'M3.5 10 8 5.5l4.5 4.5' : 'M3.5 6 8 10.5 12.5 6'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface Props {
  /** Element whose text is searched (the chapter's <main>). */
  root: RefObject<HTMLElement | null>
  /** Changes when the chapter changes, so matches are recomputed. */
  pageKey: string
}

export function PageSearch({ root, pageKey }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState<Range[]>([])
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const pendingJump = useRef(false)

  const openBox = useCallback(() => {
    setOpen(true)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }, [])

  const closeBox = useCallback(() => {
    setOpen(false)
    clearHighlights()
  }, [])

  // keyboard: Ctrl/⌘+F, `/`, Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inBox = e.target === inputRef.current
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'f') {
        if (inBox) return // second press → native browser find
        e.preventDefault()
        openBox()
        return
      }
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const t = e.target as HTMLElement | null
        if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
        e.preventDefault()
        openBox()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openBox])

  // (re)compute matches: on query change, chapter change, and when the page content changes
  useEffect(() => {
    const el = root.current
    if (!open || !el) return
    let timer = 0
    const run = (jump: boolean) => {
      const found = findMatches(el, query.trim())
      setMatches(found)
      if (jump) {
        pendingJump.current = true
        setIndex(0)
      } else {
        setIndex((i) => Math.min(i, Math.max(found.length - 1, 0)))
      }
    }
    timer = window.setTimeout(() => run(true), 120)
    const mo = new MutationObserver(() => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => run(false), 200)
    })
    mo.observe(el, { childList: true, subtree: true, characterData: true })
    return () => {
      window.clearTimeout(timer)
      mo.disconnect()
    }
  }, [open, query, pageKey, root])

  // paint highlights
  useEffect(() => {
    const api = highlightApi()
    if (!open || !api) return
    if (matches.length === 0) {
      clearHighlights()
      return
    }
    const cur = matches[index]
    api.registry.set(HL_ALL, new api.Highlight(...matches.filter((r) => r !== cur)))
    api.registry.set(HL_CURRENT, new api.Highlight(cur))
  }, [open, matches, index])

  // jump to the current match after the user moves (or after a new query)
  useEffect(() => {
    if (!pendingJump.current) return
    pendingJump.current = false
    const r = matches[index]
    if (!r) return
    openEnclosingDetails(r)
    requestAnimationFrame(() => scrollToRange(r))
  }, [matches, index])

  const step = (d: 1 | -1) => {
    if (matches.length === 0) return
    pendingJump.current = true
    setIndex((i) => (i + d + matches.length) % matches.length)
  }

  useEffect(() => clearHighlights, [])

  if (!open) {
    return (
      <button className={styles.fab} onClick={openBox} aria-label="ค้นหาในหน้านี้" title="ค้นหาในหน้านี้ (Ctrl+F หรือ /)">
        <SearchIcon />
      </button>
    )
  }

  const q = query.trim()
  const status = !q ? '' : matches.length === 0 ? 'ไม่พบ' : `${index + 1}/${matches.length}${matches.length >= MAX_MATCHES ? '+' : ''}`

  return (
    <div className={styles.box} role="search" data-search-skip>
      <span className={styles.icon}>
        <SearchIcon />
      </span>
      <input
        ref={inputRef}
        className={styles.input}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            step(e.shiftKey ? -1 : 1)
          } else if (e.key === 'Escape') {
            e.preventDefault()
            closeBox()
          }
        }}
        placeholder="ค้นหาในหน้านี้…"
        aria-label="ค้นหาในหน้านี้"
        spellCheck={false}
      />
      <span className={`${styles.count} ${q && matches.length === 0 ? styles.none : ''}`} aria-live="polite">
        {status}
      </span>
      <button className={styles.btn} onClick={() => step(-1)} disabled={matches.length === 0} aria-label="ก่อนหน้า" title="ก่อนหน้า (Shift+Enter)">
        <Arrow dir="up" />
      </button>
      <button className={styles.btn} onClick={() => step(1)} disabled={matches.length === 0} aria-label="ถัดไป" title="ถัดไป (Enter)">
        <Arrow dir="down" />
      </button>
      <button className={styles.btn} onClick={closeBox} aria-label="ปิด" title="ปิด (Esc)">
        ✕
      </button>
    </div>
  )
}
