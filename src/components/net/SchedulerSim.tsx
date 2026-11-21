import { useMemo, useState } from 'react'
import { mulberry32, newSeed } from '../../lib/random'
import { Slider } from '../interactive/Slider'
import { ButtonRow, Controls, Readout, Widget } from '../interactive/Widget'
import { Seg, net } from './parts'

type Cls = 'hi' | 'lo'
interface Pkt {
  id: number
  cls: Cls
  t: number
}
type Policy = 'fifo' | 'prio' | 'rr' | 'wfq'

/** Slide example (priority scheduling): output should be 1, 3, 2, 4, 5. */
const SLIDE: Pkt[] = [
  { id: 1, cls: 'hi', t: 0 },
  { id: 2, cls: 'lo', t: 0.4 },
  { id: 3, cls: 'hi', t: 0.7 },
  { id: 4, cls: 'hi', t: 2.3 },
  { id: 5, cls: 'lo', t: 3.4 },
]

function randomPkts(seed: number, n: number): Pkt[] {
  const r = mulberry32(seed)
  let t = 0
  return Array.from({ length: n }, (_, i) => {
    t += i === 0 ? 0 : r() * 1.1
    return { id: i + 1, cls: r() < 0.5 ? 'hi' : 'lo', t: Math.round(t * 10) / 10 }
  })
}

/** Non-preemptive, each packet takes 1 time unit on the link. */
function simulate(pkts: Pkt[], policy: Policy, w: Record<Cls, number>) {
  const waiting: Pkt[] = []
  const pending = [...pkts].sort((a, b) => a.t - b.t)
  const out: { p: Pkt; start: number }[] = []
  let now = 0
  let last: Cls = 'lo' // RR / WFQ: class served last
  let served = 0 // WFQ: packets served from `last` in this turn
  while (pending.length || waiting.length) {
    while (pending.length && pending[0].t <= now + 1e-9) waiting.push(pending.shift()!)
    if (!waiting.length) {
      now = pending[0].t
      continue
    }
    const of = (c: Cls) => waiting.filter((p) => p.cls === c)
    let pick: Pkt
    if (policy === 'fifo') pick = waiting[0]
    else if (policy === 'prio') pick = of('hi')[0] ?? waiting[0]
    else if (policy === 'rr') {
      const next: Cls = last === 'hi' ? 'lo' : 'hi'
      pick = of(next)[0] ?? of(last)[0]
    } else {
      const other: Cls = last === 'hi' ? 'lo' : 'hi'
      if (of(last).length && served < w[last]) pick = of(last)[0]
      else pick = of(other)[0] ?? of(last)[0]
    }
    if (pick.cls === last) served++
    else served = 1
    last = pick.cls
    waiting.splice(waiting.indexOf(pick), 1)
    out.push({ p: pick, start: now })
    now += 1
  }
  return out
}

const POLICY_NOTE: Record<Policy, string> = {
  fifo: 'FCFS / FIFO: ส่งตามลำดับที่มาถึง ไม่สนคลาส',
  prio: 'Priority: ทุกครั้งที่ลิงก์ว่าง ดูคิว high ก่อน ถ้ามีส่ง high ถ้าไม่มีค่อยส่ง low (ตัวที่กำลังส่งไม่ถูกขัด)',
  rr: 'Round Robin: วนสลับคลาส high → low → high … คลาสละ 1 แพ็กเก็ต (คลาสไหนว่างก็ข้าม)',
  wfq: 'WFQ (แบบ weighted round robin): แต่ละรอบ คลาส i ได้ส่ง wᵢ แพ็กเก็ต → ได้ bandwidth ≈ R·wᵢ/Σw',
}

export function SchedulerSim() {
  const [pkts, setPkts] = useState<Pkt[]>(SLIDE)
  const [policy, setPolicy] = useState<Policy>('prio')
  const [wh, setWh] = useState(2)
  const [wl, setWl] = useState(1)
  const out = useMemo(() => simulate(pkts, policy, { hi: wh, lo: wl }), [pkts, policy, wh, wl])
  const T = Math.max(...out.map((o) => o.start + 1), ...pkts.map((p) => p.t + 1)) + 0.3
  const W = 640
  const L = 78
  const X = (t: number) => L + (t / T) * (W - L - 10)
  const box = (W - L - 10) / T

  const toggle = (id: number) => setPkts((ps) => ps.map((p) => (p.id === id ? { ...p, cls: p.cls === 'hi' ? 'lo' : 'hi' } : p)))
  const color = (c: Cls) => (c === 'hi' ? 'var(--def)' : 'var(--ex)')

  return (
    <Widget title="Packet scheduling" hint="เลือกนโยบาย แล้วดูว่าแพ็กเก็ตออกจากลิงก์ลำดับไหน กดที่แพ็กเก็ตด้านล่างเพื่อสลับ high/low ได้">
      <ButtonRow>
        <Seg
          value={policy}
          onChange={setPolicy}
          options={[
            ['fifo', 'FIFO'],
            ['prio', 'Priority'],
            ['rr', 'Round Robin'],
            ['wfq', 'WFQ'],
          ]}
        />
      </ButtonRow>
      <ButtonRow>
        <button onClick={() => setPkts(SLIDE)}>ตัวอย่างสไลด์</button>
        <button onClick={() => setPkts(randomPkts(newSeed(), 8))}>สุ่ม 8 แพ็กเก็ต</button>
        <span className="small">คลาส:</span>
        {pkts.map((p) => (
          <button key={p.id} onClick={() => toggle(p.id)} className={`${net.pkt} ${p.cls === 'hi' ? net.pktHi : net.pktLo}`} title="กดเพื่อสลับคลาส">
            {p.id}
          </button>
        ))}
      </ButtonRow>
      {policy === 'wfq' && (
        <Controls>
          <Slider label="w (high)" value={wh} min={1} max={4} step={1} onChange={setWh} />
          <Slider label="w (low)" value={wl} min={1} max={4} step={1} onChange={setWl} />
        </Controls>
      )}
      <div className={net.svgScroll}>
        <svg className={net.svg} viewBox={`0 0 ${W} 150`} role="img" aria-label="ไทม์ไลน์ขาเข้าและขาออก">
          <text x={0} y={38} fill="var(--muted)" fontSize={12}>
            มาถึง
          </text>
          <text x={0} y={108} fill="var(--muted)" fontSize={12}>
            ส่งออก
          </text>
          <line x1={L} x2={W - 10} y1={132} y2={132} stroke="var(--border)" />
          {Array.from({ length: Math.floor(T) + 1 }, (_, t) => (
            <g key={t}>
              <line x1={X(t)} x2={X(t)} y1={10} y2={132} stroke="var(--border)" strokeDasharray="2 4" />
              <text x={X(t)} y={146} fontSize={11} textAnchor="middle" fill="var(--muted)">
                {t}
              </text>
            </g>
          ))}
          {pkts.map((p) => (
            <g key={p.id}>
              <circle cx={X(p.t)} cy={33} r={11} fill={color(p.cls)} opacity={0.9} />
              <text x={X(p.t)} y={37} fontSize={12} fontWeight={700} textAnchor="middle" fill="#050505">
                {p.id}
              </text>
            </g>
          ))}
          {out.map(({ p, start }) => (
            <g key={p.id}>
              <rect x={X(start) + 1} y={88} width={box - 2} height={30} rx={6} fill={color(p.cls)} opacity={0.88} />
              <text x={X(start) + box / 2} y={108} fontSize={13} fontWeight={700} textAnchor="middle" fill="#050505">
                {p.id}
              </text>
              <line x1={X(p.t)} y1={45} x2={X(start) + box / 2} y2={86} stroke={color(p.cls)} strokeOpacity={0.35} />
            </g>
          ))}
        </svg>
      </div>
      <p className="small" style={{ margin: 0 }}>
        <span style={{ color: 'var(--def)' }}>● high</span> &nbsp; <span style={{ color: 'var(--ex)' }}>● low</span> · แต่ละแพ็กเก็ตใช้เวลาส่ง 1 หน่วย
      </p>
      <Readout>
        ลำดับออก: <b>{out.map((o) => o.p.id).join(', ')}</b>
        <div className="small">{POLICY_NOTE[policy]}</div>
        {policy === 'wfq' && (
          <div className="small">
            high ได้อย่างน้อย R·{wh}/{wh + wl} = {Math.round((100 * wh) / (wh + wl))}% · low ได้ {Math.round((100 * wl) / (wh + wl))}%
          </div>
        )}
      </Readout>
    </Widget>
  )
}
