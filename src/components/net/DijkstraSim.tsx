import { useMemo, useState } from 'react'
import { ButtonRow, Readout, Widget } from '../interactive/Widget'
import { Seg, StepNote, Stepper, net } from './parts'

interface G {
  nodes: { id: string; x: number; y: number }[]
  edges: [string, string, number][]
}

/** Graphs from the slides (Chapter 5): the main u..z example and "another example". */
const GRAPHS: Record<'main' | 'ex2', G> = {
  main: {
    nodes: [
      { id: 'u', x: 60, y: 150 },
      { id: 'v', x: 200, y: 50 },
      { id: 'w', x: 380, y: 50 },
      { id: 'x', x: 200, y: 250 },
      { id: 'y', x: 380, y: 250 },
      { id: 'z', x: 520, y: 150 },
    ],
    edges: [
      ['u', 'v', 2],
      ['u', 'x', 1],
      ['u', 'w', 5],
      ['v', 'x', 2],
      ['v', 'w', 3],
      ['x', 'w', 3],
      ['x', 'y', 1],
      ['w', 'y', 1],
      ['w', 'z', 5],
      ['y', 'z', 2],
    ],
  },
  ex2: {
    nodes: [
      { id: 'u', x: 60, y: 150 },
      { id: 'v', x: 230, y: 40 },
      { id: 'w', x: 230, y: 150 },
      { id: 'x', x: 230, y: 262 },
      { id: 'y', x: 410, y: 110 },
      { id: 'z', x: 530, y: 220 },
    ],
    edges: [
      ['u', 'v', 7],
      ['u', 'w', 3],
      ['u', 'x', 5],
      ['w', 'v', 3],
      ['w', 'x', 4],
      ['w', 'y', 8],
      ['x', 'y', 7],
      ['x', 'z', 9],
      ['v', 'y', 4],
      ['y', 'z', 2],
    ],
  },
}

interface Snap {
  N: string[]
  D: Record<string, number>
  p: Record<string, string | null>
  next: string | null
  /** nodes whose D/p changed when the last node was added */
  changed: string[]
}

function run(g: G, src: string): Snap[] {
  const ids = g.nodes.map((n) => n.id)
  const c = (a: string, b: string) => {
    const e = g.edges.find(([x, y]) => (x === a && y === b) || (x === b && y === a))
    return e ? e[2] : Infinity
  }
  const D: Record<string, number> = {}
  const p: Record<string, string | null> = {}
  for (const v of ids) {
    D[v] = v === src ? 0 : c(src, v)
    p[v] = Number.isFinite(D[v]) && v !== src ? src : null
  }
  const N = [src]
  const snaps: Snap[] = []
  const pickNext = () => {
    let best: string | null = null
    for (const v of ids) if (!N.includes(v) && Number.isFinite(D[v]) && (best === null || D[v] <= D[best])) best = v // ties → later node (matches slide: y before v)
    return best
  }
  snaps.push({ N: [...N], D: { ...D }, p: { ...p }, next: pickNext(), changed: [] })
  while (N.length < ids.length) {
    const w = pickNext()
    if (!w) break
    N.push(w)
    const changed: string[] = []
    for (const v of ids)
      if (!N.includes(v) && D[w] + c(w, v) < D[v]) {
        D[v] = D[w] + c(w, v)
        p[v] = w
        changed.push(v)
      }
    snaps.push({ N: [...N], D: { ...D }, p: { ...p }, next: pickNext(), changed })
  }
  return snaps
}

const fmt = (d: number) => (Number.isFinite(d) ? String(d) : '∞')

export function DijkstraSim() {
  const [which, setWhich] = useState<'main' | 'ex2'>('main')
  const [costs, setCosts] = useState<Record<'main' | 'ex2', number[]>>({
    main: GRAPHS.main.edges.map((e) => e[2]),
    ex2: GRAPHS.ex2.edges.map((e) => e[2]),
  })
  const [src, setSrc] = useState('u')
  const [step, setStep] = useState(0)
  const g: G = useMemo(
    () => ({ nodes: GRAPHS[which].nodes, edges: GRAPHS[which].edges.map(([a, b], i) => [a, b, costs[which][i]] as [string, string, number]) }),
    [which, costs],
  )
  const snaps = useMemo(() => run(g, src), [g, src])
  const max = snaps.length - 1
  const k = Math.min(step, max)
  const s = snaps[k]
  const others = g.nodes.map((n) => n.id).filter((v) => v !== src)
  const pos = Object.fromEntries(g.nodes.map((n) => [n.id, n]))
  const inN = (v: string) => s.N.includes(v)

  const bump = (i: number) =>
    setCosts((c) => ({ ...c, [which]: c[which].map((x, j) => (j === i ? (x % 9) + 1 : x)) }))
  const reset = () => setCosts((c) => ({ ...c, [which]: GRAPHS[which].edges.map((e) => e[2]) }))

  // first hop on the least-cost path, for the forwarding table
  const firstHop = (v: string) => {
    let cur = v
    while (s.p[cur] && s.p[cur] !== src) cur = s.p[cur]!
    return cur
  }
  const pathTo = (v: string) => {
    const out = [v]
    let cur = v
    while (s.p[cur]) {
      cur = s.p[cur]!
      out.unshift(cur)
    }
    return out.join('→')
  }

  return (
    <Widget
      title="Dijkstra (link state)"
      hint="กดถัดไปเพื่อเพิ่ม node ที่ D น้อยสุดเข้า N' ทีละตัว · กดตัวเลขบนลิงก์เพื่อเปลี่ยน cost (1–9) · เปลี่ยน source ได้"
    >
      <ButtonRow>
        <Seg
          value={which}
          onChange={(v) => (setWhich(v), setStep(0), setSrc('u'))}
          options={[
            ['main', 'กราฟหลักในสไลด์'],
            ['ex2', 'another example'],
          ]}
        />
        <span className="small">source:</span>
        <Seg value={src} onChange={(v) => (setSrc(v), setStep(0))} options={g.nodes.map((n) => [n.id, n.id] as [string, string])} />
        <button onClick={() => (reset(), setStep(0))}>คืนค่า cost</button>
      </ButtonRow>
      <Stepper step={k} max={max} onStep={(n) => setStep(Math.max(0, Math.min(max, n)))} nextLabel="เพิ่มเข้า N' ▶" />

      <div className={net.svgScroll}>
        <svg className={net.svg} viewBox="0 0 590 300" role="img" aria-label="กราฟเครือข่าย">
          {g.edges.map(([a, b, cost], i) => {
            const A = pos[a]
            const B = pos[b]
            const tree = (inN(b) && s.p[b] === a && b !== src) || (inN(a) && s.p[a] === b && a !== src)
            const tent = (!inN(b) && s.p[b] === a) || (!inN(a) && s.p[a] === b)
            const mx = (A.x + B.x) / 2
            const my = (A.y + B.y) / 2
            return (
              <g key={i}>
                <line
                  x1={A.x}
                  y1={A.y}
                  x2={B.x}
                  y2={B.y}
                  stroke={tree ? 'var(--accent)' : tent ? 'var(--tip)' : 'var(--border)'}
                  strokeWidth={tree ? 4 : tent ? 2.2 : 2}
                  strokeDasharray={tent ? '6 5' : undefined}
                />
                <g onClick={() => (bump(i), setStep(0))} style={{ cursor: 'pointer' }}>
                  <circle cx={mx} cy={my} r={12} fill="var(--surface)" stroke="var(--border)" />
                  <text x={mx} y={my + 4.5} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--text)">
                    {cost}
                  </text>
                </g>
              </g>
            )
          })}
          {g.nodes.map((n) => {
            const isIn = inN(n.id)
            const isNext = s.next === n.id
            return (
              <g key={n.id}>
                {isNext && <circle cx={n.x} cy={n.y} r={25} fill="none" stroke="var(--accent)" strokeWidth={2} strokeDasharray="4 3" />}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={19}
                  fill={isIn ? 'var(--accent)' : 'var(--surface-2)'}
                  stroke={n.id === src ? 'var(--text)' : isIn ? 'var(--accent)' : 'var(--muted)'}
                  strokeWidth={n.id === src ? 2.5 : 1.5}
                />
                <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize={16} fontWeight={700} fill={isIn ? '#050505' : 'var(--text)'}>
                  {n.id}
                </text>
                {n.id !== src && (
                  <text
                    x={n.x}
                    y={n.y + (n.y > 150 ? 40 : -28)}
                    textAnchor="middle"
                    fontSize={12.5}
                    fill={s.changed.includes(n.id) ? 'var(--tip)' : 'var(--muted)'}
                    fontWeight={s.changed.includes(n.id) ? 700 : 400}
                    fontFamily="var(--font-mono)"
                  >
                    D={fmt(s.D[n.id])}
                    {s.p[n.id] ? `,${s.p[n.id]}` : ''}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
      <p className="small" style={{ margin: 0 }}>
        <span style={{ color: 'var(--accent)' }}>● อยู่ใน N' / เส้นทึบ = least-cost-path tree</span> · <span style={{ color: 'var(--tip)' }}>เส้นประ = ทางที่ดีที่สุดเท่าที่รู้ตอนนี้</span> · วงประ = ตัวที่จะถูกเลือกต่อไป
      </p>

      <div className={net.tblWrap}>
        <table className={net.tbl}>
          <thead>
            <tr>
              <th>Step</th>
              <th>N'</th>
              {others.map((v) => (
                <th key={v}>
                  D({v}),p({v})
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {snaps.slice(0, k + 1).map((r, i) => (
              <tr key={i} className={i === k ? net.rowHit : undefined}>
                <td className={net.num}>{i}</td>
                <td className={net.mono}>{r.N.join('')}</td>
                {others.map((v) => {
                  const done = r.N.includes(v)
                  const bold = r.next === v
                  return (
                    <td key={v} className={net.mono} style={bold ? { color: 'var(--accent)', fontWeight: 700 } : undefined}>
                      {done ? '' : Number.isFinite(r.D[v]) ? `${r.D[v]},${r.p[v]}` : '∞'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <StepNote>
        {k === 0 ? (
          <>
            เริ่ม: N' = {'{'}
            {src}
            {'}'} เพื่อนบ้านของ {src} ได้ D = c({src},·) ที่เหลือ = ∞ · ตัวที่ D น้อยสุดคือ <b>{s.next}</b>
          </>
        ) : (
          <>
            เพิ่ม <b>{s.N[s.N.length - 1]}</b> (D = {s.D[s.N[s.N.length - 1]]}) เข้า N' แล้วอัปเดตเพื่อนบ้าน:{' '}
            {s.changed.length ? s.changed.map((v) => `D(${v}) ลดเหลือ ${s.D[v]} ผ่าน ${s.p[v]}`).join(', ') : 'ไม่มีค่าไหนลดลง'}
            {s.next && (
              <>
                {' '}
                · ต่อไปเลือก <b>{s.next}</b>
              </>
            )}
          </>
        )}
      </StepNote>
      {k === max && (
        <>
          <div className={net.label}>Forwarding table ของ {src}</div>
          <div className={net.tblWrap}>
            <table className={net.tbl}>
              <thead>
                <tr>
                  <th>ปลายทาง</th>
                  <th>เส้นทาง</th>
                  <th>cost</th>
                  <th>ลิงก์ออก</th>
                </tr>
              </thead>
              <tbody>
                {others.map((v) => (
                  <tr key={v}>
                    <td>{v}</td>
                    <td className={net.mono}>{pathTo(v)}</td>
                    <td className={net.num}>{fmt(s.D[v])}</td>
                    <td className={net.mono}>
                      ({src},{firstHop(v)})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <Readout>
        ทุกขั้น: เลือก w ∉ N' ที่ D(w) น้อยสุด → ใส่ N' → อัปเดต <b>D(v) = min( D(v), D(w) + c(w,v) )</b> · ตารางเก็บแค่<b>ลิงก์แรก</b>
      </Readout>
    </Widget>
  )
}
