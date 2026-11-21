import { fmt } from './math'

/** Read a CSS custom property (theme colour) at draw time, so dark mode just works. */
export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export function withAlpha(hex: string, a: number): string {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

export function niceTicks(lo: number, hi: number, count: number): number[] {
  const span = hi - lo
  if (span <= 0) return [lo]
  const raw = span / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const r = raw / mag
  const step = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag
  const out: number[] = []
  for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10))
  return out
}

export interface Frame {
  /** data x → pixel x */
  X: (x: number) => number
  /** data y → pixel y */
  Y: (y: number) => number
  left: number
  right: number
  top: number
  bottom: number
  /** map 0..1 to the full plot height (used for a secondary CDF axis) */
  Yunit: (v: number) => number
}

export interface FrameOptions {
  xlo: number
  xhi: number
  ymax: number
  xTicks?: number[]
  /** custom text for x tick labels (e.g. for a log axis) */
  xLabel?: (v: number) => string
  /** reserve space for a right-hand 0–1 axis */
  rightAxis?: boolean
}

/** Clear the canvas and draw grid, axes and tick labels. Returns coordinate mappers. */
export function drawFrame(g: CanvasRenderingContext2D, w: number, h: number, o: FrameOptions): Frame {
  const L = 46
  const R = o.rightAxis ? 40 : 14
  const T = 14
  const B = 30
  const X = (x: number) => L + ((x - o.xlo) / (o.xhi - o.xlo)) * (w - L - R)
  const Y = (y: number) => h - B - (y / o.ymax) * (h - T - B)
  const Yunit = (v: number) => h - B - v * (h - T - B)

  g.clearRect(0, 0, w, h)
  g.font = '11px system-ui, sans-serif'
  g.lineWidth = 1

  for (const v of niceTicks(0, o.ymax, 4)) {
    g.strokeStyle = cssVar('--border')
    g.beginPath()
    g.moveTo(L, Y(v))
    g.lineTo(w - R, Y(v))
    g.stroke()
    g.fillStyle = cssVar('--muted')
    g.textAlign = 'right'
    g.textBaseline = 'middle'
    g.fillText(fmt(v), L - 6, Y(v))
  }

  g.fillStyle = cssVar('--muted')
  g.textAlign = 'center'
  g.textBaseline = 'top'
  for (const v of o.xTicks ?? niceTicks(o.xlo, o.xhi, 8)) g.fillText((o.xLabel ?? fmt)(v), X(v), h - B + 6)

  g.strokeStyle = cssVar('--muted')
  g.beginPath()
  g.moveTo(L, h - B)
  g.lineTo(w - R, h - B)
  g.stroke()

  if (o.rightAxis) {
    g.fillStyle = cssVar('--warn')
    g.textAlign = 'left'
    g.textBaseline = 'middle'
    for (const v of [0, 0.5, 1]) g.fillText(String(v), w - R + 6, Yunit(v))
  }

  return { X, Y, Yunit, left: L, right: w - R, top: T, bottom: h - B }
}

/** Dashed vertical marker with a small label (e.g. the mean). */
export function drawMarker(g: CanvasRenderingContext2D, f: Frame, x: number, label: string) {
  const px = f.X(x)
  if (px < f.left || px > f.right) return
  g.setLineDash([5, 4])
  g.strokeStyle = cssVar('--text')
  g.lineWidth = 1.3
  g.beginPath()
  g.moveTo(px, f.top)
  g.lineTo(px, f.bottom)
  g.stroke()
  g.setLineDash([])
  g.fillStyle = cssVar('--text')
  g.textAlign = 'left'
  g.textBaseline = 'top'
  g.fillText(label, px + 4, f.top)
}
