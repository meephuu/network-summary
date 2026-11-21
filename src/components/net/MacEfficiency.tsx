import { useState } from 'react'
import { useCanvas } from '../../lib/hooks'
import { cssVar, drawFrame, drawMarker } from '../../lib/plot'
import { Slider } from '../interactive/Slider'
import { Controls, PlotCanvas, Readout, Widget } from '../interactive/Widget'

const slotted = (N: number, p: number) => N * p * (1 - p) ** (N - 1)
const pure = (N: number, p: number) => N * p * (1 - p) ** (2 * (N - 1))
const pct = (x: number) => `${(100 * x).toFixed(1)}%`

/** ALOHA efficiency vs p for N busy nodes, and CSMA/CD efficiency vs t_prop / t_trans. */
export function MacEfficiency() {
  const [N, setN] = useState(10)
  const [p, setP] = useState(0.1)
  const [loga, setLoga] = useState(-1)
  const a = 10 ** loga
  const ymax = N === 1 ? 1 : 0.5

  const ref = useCanvas((g, w, h) => {
    const f = drawFrame(g, w, h, { xlo: 0, xhi: 1, ymax })
    const curve = (fn: (N: number, p: number) => number, color: string) => {
      g.beginPath()
      for (let i = 0; i <= 300; i++) {
        const x = i / 300
        const y = Math.min(ymax, fn(N, x))
        i ? g.lineTo(f.X(x), f.Y(y)) : g.moveTo(f.X(x), f.Y(y))
      }
      g.strokeStyle = color
      g.lineWidth = 2.4
      g.stroke()
    }
    const hline = (y: number, color: string, label: string) => {
      if (y > ymax) return
      g.setLineDash([4, 4])
      g.strokeStyle = color
      g.lineWidth = 1
      g.beginPath()
      g.moveTo(f.left, f.Y(y))
      g.lineTo(f.right, f.Y(y))
      g.stroke()
      g.setLineDash([])
      g.fillStyle = color
      g.textAlign = 'right'
      g.textBaseline = 'bottom'
      g.fillText(label, f.right - 4, f.Y(y) - 2)
    }
    hline(1 / Math.E, cssVar('--def'), '1/e ≈ 0.37')
    hline(1 / (2 * Math.E), cssVar('--ex'), '1/(2e) ≈ 0.18')
    curve(slotted, cssVar('--def'))
    curve(pure, cssVar('--ex'))
    drawMarker(g, f, p, `p = ${p}`)
  })

  const pS = 1 / N
  const pP = 1 / (2 * N - 1)
  return (
    <Widget title="Efficiency ของ ALOHA และ CSMA/CD" hint="N node มีของส่งตลอด แต่ละตัวส่งใน slot ด้วยความน่าจะเป็น p · เลื่อน N ให้ใหญ่ขึ้นแล้วดูว่า max efficiency เข้าใกล้ 1/e และ 1/(2e)">
      <Controls>
        <Slider label="N (จำนวน node)" value={N} min={1} max={60} step={1} onChange={setN} />
        <Slider label="p" value={p} min={0.01} max={1} step={0.01} onChange={setP} />
      </Controls>
      <PlotCanvas canvasRef={ref} label="กราฟ efficiency เทียบกับ p" height={250} />
      <p className="small" style={{ margin: 0 }}>
        <span style={{ color: 'var(--def)' }}>— slotted ALOHA: Np(1−p)^(N−1)</span> · <span style={{ color: 'var(--ex)' }}>— pure ALOHA: Np(1−p)^(2(N−1))</span>
      </p>
      <Readout>
        ที่ p = {p}: slotted {pct(slotted(N, p))} · pure {pct(pure(N, p))}
        <br />
        ดีที่สุด: slotted ที่ p* = 1/N = {pS.toFixed(3)} ได้ <b>{pct(slotted(N, pS))}</b> · pure ได้ <b>{pct(pure(N, pP))}</b> (N → ∞: 37% / 18%)
      </Readout>
      <div style={{ marginTop: 16 }}>
        <Controls>
          <Slider label="log₁₀(t_prop / t_trans)" value={loga} min={-3} max={0.5} step={0.05} onChange={setLoga} />
        </Controls>
        <div style={{ height: 14, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden', margin: '6px 0' }}>
          <div style={{ width: `${100 / (1 + 5 * a)}%`, height: '100%', background: 'var(--accent)', transition: 'width .2s' }} />
        </div>
        <Readout>
          t_prop/t_trans = {a < 0.01 ? a.toExponential(1) : a.toFixed(3)} → CSMA/CD efficiency = 1/(1 + 5·{a.toFixed(3)}) = <b>{pct(1 / (1 + 5 * a))}</b>
          <div className="small">→ 1 เมื่อ t_prop → 0 (สายสั้น) หรือ t_trans → ∞ (frame ยาว)</div>
        </Readout>
      </div>
    </Widget>
  )
}
