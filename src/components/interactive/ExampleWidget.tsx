import { useState } from 'react'
import { useCanvas } from '../../lib/hooks'
import { fmt } from '../../lib/math'
import { cssVar, drawFrame, drawMarker, withAlpha } from '../../lib/plot'
import { Slider } from './Slider'
import { ButtonRow, Controls, PlotCanvas, Readout, Widget } from './Widget'

/**
 * STARTER WIDGET – copy this file to make a new one.
 *
 * The pattern every widget follows:
 *   1. state with useState (one per slider / toggle)
 *   2. derived numbers computed straight from the state
 *   3. useCanvas(draw) → drawFrame() gives axes + X()/Y() mappers, then draw with the 2D canvas API
 *      (colours always from cssVar('--accent') etc., so themes and dark mode just work)
 *   4. <Widget> card with <Controls> (sliders), <ButtonRow> (presets), <PlotCanvas>, <Readout>
 * Then register it in components/content/mdxComponents.ts and use it in MDX: <ExampleWidget />
 */
export function ExampleWidget() {
  const [a, setA] = useState(1)
  const [b, setB] = useState(-2)
  const [c, setC] = useState(-1)

  // y = a x² + b x + c
  const f = (x: number) => a * x * x + b * x + c
  const vertex = a !== 0 ? -b / (2 * a) : NaN
  const disc = b * b - 4 * a * c
  const roots =
    a === 0 ? [] : disc < 0 ? [] : disc === 0 ? [vertex] : [(-b - Math.sqrt(disc)) / (2 * a), (-b + Math.sqrt(disc)) / (2 * a)]

  const ref = useCanvas((g, w, h) => {
    const acc = cssVar('--accent')
    // drawFrame's y axis starts at 0, so shift the curve up by 10 to show y ∈ [−10, 10]
    const SHIFT = 10
    const fr = drawFrame(g, w, h, { xlo: -5, xhi: 5, ymax: 20 })
    // y = 0 line
    g.strokeStyle = cssVar('--muted')
    g.setLineDash([3, 3])
    g.beginPath()
    g.moveTo(fr.left, fr.Y(SHIFT))
    g.lineTo(fr.right, fr.Y(SHIFT))
    g.stroke()
    g.setLineDash([])
    // curve
    g.save()
    g.beginPath()
    g.rect(fr.left, fr.top, fr.right - fr.left, fr.bottom - fr.top)
    g.clip()
    g.beginPath()
    for (let i = 0; i <= 400; i++) {
      const x = -5 + (10 * i) / 400
      const y = fr.Y(f(x) + SHIFT)
      if (i) g.lineTo(fr.X(x), y)
      else g.moveTo(fr.X(x), y)
    }
    g.strokeStyle = acc
    g.lineWidth = 2.4
    g.stroke()
    // roots
    for (const r of roots) {
      g.fillStyle = withAlpha(acc, 0.9)
      g.beginPath()
      g.arc(fr.X(r), fr.Y(SHIFT), 5, 0, 2 * Math.PI)
      g.fill()
    }
    g.restore()
    if (Number.isFinite(vertex)) drawMarker(g, fr, vertex, 'จุดยอด')
  })

  return (
    <Widget title="กราฟพาราโบลา y = ax² + bx + c" hint="ตัวอย่าง widget แบบง่ายที่สุด เลื่อน a, b, c แล้วดูว่ารากและจุดยอดเปลี่ยนอย่างไร (แกน y ถูกเลื่อนขึ้น 10 เส้นประ = y = 0)">
      <Controls>
        <Slider label="a" value={a} min={-3} max={3} step={0.1} onChange={setA} />
        <Slider label="b" value={b} min={-6} max={6} step={0.1} onChange={setB} />
        <Slider label="c" value={c} min={-8} max={8} step={0.1} onChange={setC} />
      </Controls>
      <ButtonRow>
        <button onClick={() => (setA(1), setB(0), setC(-4))}>รากสองค่า</button>
        <button onClick={() => (setA(1), setB(-4), setC(4))}>รากซ้ำ</button>
        <button onClick={() => (setA(1), setB(0), setC(3))}>ไม่มีรากจริง</button>
      </ButtonRow>
      <PlotCanvas canvasRef={ref} label="กราฟพาราโบลา" />
      <Readout>
        b² − 4ac = <b>{fmt(disc)}</b> &nbsp;·&nbsp; จุดยอดที่ x = <b>{Number.isFinite(vertex) ? fmt(vertex) : '–'}</b> &nbsp;·&nbsp; ราก ={' '}
        <b>{roots.length ? roots.map(fmt).join(', ') : 'ไม่มีรากจริง'}</b>
      </Readout>
    </Widget>
  )
}
