import { useMemo, useState } from 'react'
import { ButtonRow, Readout, Widget } from '../interactive/Widget'
import { Seg, net } from './parts'

type End = { host: string } | { sw: string; port: number }
interface Sw {
  id: string
  x: number
  y: number
  ports: Record<number, End>
}
interface Topo {
  sws: Sw[]
  hosts: Record<string, { x: number; y: number }>
}

const TOPOS: Record<'one' | 'multi', Topo> = {
  one: {
    sws: [{ id: 'S', x: 300, y: 135, ports: { 1: { host: 'A' }, 2: { host: 'B' }, 3: { host: 'C' }, 4: { host: "A'" }, 5: { host: "B'" }, 6: { host: "C'" } } }],
    hosts: {
      A: { x: 300, y: 25 },
      B: { x: 480, y: 70 },
      C: { x: 480, y: 205 },
      "A'": { x: 300, y: 250 },
      "B'": { x: 120, y: 205 },
      "C'": { x: 120, y: 70 },
    },
  },
  multi: {
    sws: [
      { id: 'S4', x: 300, y: 35, ports: { 1: { sw: 'S1', port: 4 }, 2: { sw: 'S2', port: 4 }, 3: { sw: 'S3', port: 4 } } },
      { id: 'S1', x: 120, y: 130, ports: { 1: { host: 'A' }, 2: { host: 'B' }, 3: { host: 'C' }, 4: { sw: 'S4', port: 1 } } },
      { id: 'S2', x: 300, y: 130, ports: { 1: { host: 'D' }, 2: { host: 'E' }, 3: { host: 'F' }, 4: { sw: 'S4', port: 2 } } },
      { id: 'S3', x: 480, y: 130, ports: { 1: { host: 'G' }, 2: { host: 'H' }, 3: { host: 'I' }, 4: { sw: 'S4', port: 3 } } },
    ],
    hosts: Object.fromEntries(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map((h, i) => [h, { x: 60 + i * 60, y: 245 }])),
  },
}

type Tables = Record<string, Record<string, number>>
interface Hop {
  sw: string
  inPort: number
  action: 'forward' | 'flood' | 'filter'
  out: number[]
  learned: boolean
}

function sendFrame(t: Topo, tables: Tables, src: string, dst: string) {
  const next: Tables = JSON.parse(JSON.stringify(tables))
  const swOf = (h: string) => {
    for (const s of t.sws) for (const [p, e] of Object.entries(s.ports)) if ('host' in e && e.host === h) return [s.id, +p] as const
    throw new Error('no host')
  }
  const used = new Set<string>() // "sw:port" links that carried the frame
  const hops: Hop[] = []
  const reached = new Set<string>()
  const [s0, p0] = swOf(src)
  used.add(`${s0}:${p0}`)
  const queue: [string, number][] = [[s0, p0]]
  while (queue.length) {
    const [sid, inPort] = queue.shift()!
    const sw = t.sws.find((s) => s.id === sid)!
    const learned = next[sid][src] !== inPort
    next[sid][src] = inPort
    const known = next[sid][dst]
    let action: Hop['action']
    let out: number[]
    if (known !== undefined) {
      if (known === inPort) {
        action = 'filter'
        out = []
      } else {
        action = 'forward'
        out = [known]
      }
    } else {
      action = 'flood'
      out = Object.keys(sw.ports).map(Number).filter((p) => p !== inPort)
    }
    hops.push({ sw: sid, inPort, action, out, learned })
    for (const p of out) {
      used.add(`${sid}:${p}`)
      const e = sw.ports[p]
      if ('host' in e) reached.add(e.host)
      else queue.push([e.sw, e.port])
    }
  }
  return { tables: next, used, hops, reached }
}

const empty = (t: Topo): Tables => Object.fromEntries(t.sws.map((s) => [s.id, {}]))

/** Switch self-learning: tables fill from source MACs; unknown destination → flood, known → forward on one link. */
export function SwitchLearning() {
  const [which, setWhich] = useState<'one' | 'multi'>('one')
  const t = TOPOS[which]
  const hostNames = Object.keys(t.hosts)
  const [src, setSrc] = useState('A')
  const [dst, setDst] = useState("A'")
  const [tables, setTables] = useState<Tables>(() => empty(TOPOS.one))
  const [last, setLast] = useState<ReturnType<typeof sendFrame> | null>(null)
  const [lastPair, setLastPair] = useState<[string, string] | null>(null)

  const choose = (w: 'one' | 'multi') => {
    setWhich(w)
    setTables(empty(TOPOS[w]))
    setLast(null)
    setLastPair(null)
    if (w === 'one') (setSrc('A'), setDst("A'"))
    else (setSrc('C'), setDst('I'))
  }
  const send = (s = src, d = dst) => {
    if (s === d) return
    const r = sendFrame(t, tables, s, d)
    setTables(r.tables)
    setLast(r)
    setLastPair([s, d])
  }

  const links = useMemo(() => {
    const out: { key: string; x1: number; y1: number; x2: number; y2: number; label: number; lx: number; ly: number }[] = []
    for (const s of t.sws)
      for (const [p, e] of Object.entries(s.ports)) {
        const to = 'host' in e ? t.hosts[e.host] : t.sws.find((q) => q.id === e.sw)!
        out.push({ key: `${s.id}:${p}`, x1: s.x, y1: s.y, x2: to.x, y2: to.y, label: +p, lx: s.x + (to.x - s.x) * 0.28, ly: s.y + (to.y - s.y) * 0.28 })
      }
    return out
  }, [t, which])
  const isUsed = (key: string) => {
    if (!last) return false
    if (last.used.has(key)) return true
    // switch–switch links are stored from either side
    const [sid, p] = key.split(':')
    const e = t.sws.find((s) => s.id === sid)!.ports[+p]
    return 'sw' in e && last.used.has(`${e.sw}:${e.port}`)
  }

  return (
    <Widget title="Switch self-learning" hint="เลือกผู้ส่งและผู้รับ แล้วกดส่ง frame · ตารางของ switch เรียนรู้จาก source MAC · ไม่รู้จักปลายทาง = flood (เส้นประ) · รู้จักแล้ว = ส่งลิงก์เดียว">
      <ButtonRow>
        <Seg
          value={which}
          onChange={choose}
          options={[
            ['one', 'switch ตัวเดียว'],
            ['multi', 'หลาย switch (S1–S4)'],
          ]}
        />
        <button onClick={() => (setTables(empty(t)), setLast(null), setLastPair(null))}>ล้างตาราง</button>
      </ButtonRow>
      <div className={net.inputs}>
        <label>
          ผู้ส่ง
          <select value={src} onChange={(e) => setSrc(e.target.value)}>
            {hostNames.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
        </label>
        <label>
          ผู้รับ
          <select value={dst} onChange={(e) => setDst(e.target.value)}>
            {hostNames.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
        </label>
        <button className={`${net.stepBtn} ${net.primary}`} onClick={() => send()} disabled={src === dst}>
          ส่ง frame ▶
        </button>
        <button className={net.stepBtn} onClick={() => (setSrc(dst), setDst(src), send(dst, src))} disabled={src === dst}>
          ให้ผู้รับตอบกลับ ↩
        </button>
      </div>
      <div className={net.svgScroll}>
        <svg className={net.svg} viewBox="0 0 600 275" role="img" aria-label="topology ของ switch">
          {links.map((l) => {
            const used = isUsed(l.key)
            const flood = used && last?.hops.some((h) => h.action === 'flood' && l.key.startsWith(h.sw + ':') && h.out.includes(l.label))
            return (
              <g key={l.key}>
                <line
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  stroke={used ? (flood ? 'var(--ex)' : 'var(--def)') : 'var(--border)'}
                  strokeWidth={used ? 3 : 2}
                  strokeDasharray={flood ? '7 5' : undefined}
                />
                <circle cx={l.lx} cy={l.ly} r={8} fill="var(--bg)" stroke="var(--border)" />
                <text x={l.lx} y={l.ly + 4} textAnchor="middle" fontSize={10.5} fill="var(--muted)">
                  {l.label}
                </text>
              </g>
            )
          })}
          {t.sws.map((s) => (
            <g key={s.id}>
              <rect x={s.x - 26} y={s.y - 16} width={52} height={32} rx={8} fill="var(--surface-2)" stroke="var(--accent)" />
              <text x={s.x} y={s.y + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--accent)">
                {s.id}
              </text>
            </g>
          ))}
          {hostNames.map((h) => {
            const p = t.hosts[h]
            const isSrc = lastPair?.[0] === h
            const isDst = lastPair?.[1] === h
            const got = last?.reached.has(h)
            return (
              <g key={h}>
                <rect
                  x={p.x - 20}
                  y={p.y - 14}
                  width={40}
                  height={28}
                  rx={7}
                  fill={isSrc ? 'var(--def)' : isDst && got ? 'var(--ex)' : 'var(--surface)'}
                  stroke={got ? 'var(--ex)' : 'var(--muted)'}
                />
                <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill={isSrc || (isDst && got) ? '#050505' : 'var(--text)'}>
                  {h}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
        {t.sws.map((s) => (
          <div key={s.id}>
            <div className={net.label}>ตาราง {s.id}</div>
            <table className={net.tbl}>
              <thead>
                <tr>
                  <th>MAC</th>
                  <th>interface</th>
                  <th>TTL</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(tables[s.id] ?? {}).length === 0 && (
                  <tr>
                    <td colSpan={3} className="small">
                      ว่าง
                    </td>
                  </tr>
                )}
                {Object.entries(tables[s.id] ?? {}).map(([mac, p]) => (
                  <tr key={mac} className={last?.hops.some((h) => h.sw === s.id && h.learned) && lastPair?.[0] === mac ? net.rowNew : undefined}>
                    <td>{mac}</td>
                    <td className={net.num}>{p}</td>
                    <td className={net.num}>60</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      <Readout>
        {!last && <>ตารางเริ่มต้นว่าง ลองส่ง frame แรกดู</>}
        {last &&
          last.hops.map((h, i) => (
            <div key={i}>
              {h.sw}: จำ {lastPair![0]} → interface {h.inPort} ·{' '}
              {h.action === 'flood' ? (
                <>
                  ไม่รู้จัก {lastPair![1]} → <b>flood</b> ออก {h.out.join(', ')}
                </>
              ) : h.action === 'forward' ? (
                <>
                  รู้ว่า {lastPair![1]} อยู่ interface {h.out[0]} → <b>forward</b> ลิงก์เดียว
                </>
              ) : (
                <>
                  ปลายทางอยู่ฝั่งเดียวกับที่เข้ามา → <b>drop</b>
                </>
              )}
            </div>
          ))}
      </Readout>
    </Widget>
  )
}
