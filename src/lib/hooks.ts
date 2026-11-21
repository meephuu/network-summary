import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react'

/* ---------------- Hash routing (works when index.html is opened straight from disk) ---------------- */

function subscribeHash(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

/** Current route from `#/chapter-id`. */
export function useHashRoute(): string {
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash)
  return hash.replace(/^#\/?/, '')
}

export function navigate(route: string) {
  // scroll position is restored per chapter by <ReadingPosition>
  window.location.hash = `/${route}`
}

/* ---------------- Canvas with DPR scaling, resize and theme redraw ---------------- */

type Draw = (g: CanvasRenderingContext2D, w: number, h: number) => void

/** Returns a ref for a <canvas>. `draw` runs after every render, on resize and on theme change. */
export function useCanvas(draw: Draw) {
  const ref = useRef<HTMLCanvasElement>(null)
  const render = useRef<() => void>(() => {})
  render.current = () => {
    const c = ref.current
    const g = c?.getContext('2d')
    if (!c || !g) return
    const dpr = window.devicePixelRatio || 1
    const w = c.clientWidth
    const h = c.clientHeight
    c.width = Math.round(w * dpr)
    c.height = Math.round(h * dpr)
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    draw(g, w, h)
  }

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const r = () => render.current()
    const ro = new ResizeObserver(r)
    ro.observe(c)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', r)
    return () => {
      ro.disconnect()
      mq.removeEventListener('change', r)
    }
  }, [])

  useEffect(() => render.current())

  return ref
}

/* ---------------- Scroll spy for the table of contents ---------------- */

export interface Heading {
  id: string
  text: string
}

/** Collect the chapter's h2 headings once the MDX has rendered. */
export function useHeadings(container: RefObject<HTMLElement | null>, key: string): Heading[] {
  const [headings, setHeadings] = useState<Heading[]>([])
  useEffect(() => {
    const el = container.current
    if (!el) return
    const read = () =>
      setHeadings(
        Array.from(el.querySelectorAll('h2[id]')).map((h) => ({ id: h.id, text: h.textContent ?? '' })),
      )
    read()
    // lazy-loaded chapters render after this effect, so watch for content
    const mo = new MutationObserver(read)
    mo.observe(el, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [container, key])
  return headings
}

export function useActiveHeading(headings: Heading[]): string | null {
  const [active, setActive] = useState<string | null>(null)
  useEffect(() => {
    const onScroll = () => {
      let cur: string | null = headings[0]?.id ?? null
      for (const h of headings) {
        const el = document.getElementById(h.id)
        if (el && el.getBoundingClientRect().top < 140) cur = h.id
      }
      setActive(cur)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [headings])
  return active
}

export function useScrollProgress(): number {
  const [p, setP] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setP(max > 0 ? window.scrollY / max : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
  return p
}

/* ---------------- Auto-hiding scrollbar ---------------- */

const EDGE_PX = 16
const LINGER_MS = 900

/**
 * Adds `autohide-scroll` to the element (or <html> when `target` is 'document')
 * and toggles `is-scrolling` while it scrolls, or while the pointer sits on the
 * scrollbar edge so the thumb can still be grabbed.
 */
export function useAutoHideScrollbar(target: RefObject<HTMLElement | null> | 'document') {
  useEffect(() => {
    const doc = target === 'document'
    const el = doc ? document.documentElement : target.current
    if (!el) return
    const scroller: HTMLElement | Window = doc ? window : el
    el.classList.add('autohide-scroll')
    let timer = 0
    let nearEdge = false
    const show = () => el.classList.add('is-scrolling')
    const hideLater = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        if (!nearEdge) el.classList.remove('is-scrolling')
      }, LINGER_MS)
    }
    const onScroll = () => {
      show()
      hideLater()
    }
    const onMove = (e: MouseEvent) => {
      const right = doc ? window.innerWidth : el.getBoundingClientRect().right
      const inside = doc || (e.target instanceof Node && el.contains(e.target))
      const near = inside && right - e.clientX <= EDGE_PX && right - e.clientX >= 0
      if (near === nearEdge) return
      nearEdge = near
      if (near) show()
      else hideLater()
    }
    scroller.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.clearTimeout(timer)
      scroller.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMove)
      el.classList.remove('autohide-scroll', 'is-scrolling')
    }
  }, [target])
}
