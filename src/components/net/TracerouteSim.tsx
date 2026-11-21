import { useState } from 'react'
import { mulberry32 } from '../../lib/random'
import { ButtonRow, Readout, Widget } from '../interactive/Widget'
import { net } from './parts'

const HOPS = [
  { name: 'R1 gw.home', ip: '192.168.1.1' },
  { name: 'R2 isp-edge', ip: '10.20.0.1' },
  { name: 'R3 isp-core', ip: '61.19.8.5' },
  { name: 'R4 peer', ip: '72.14.198.9' },
  { name: 'dns.google', ip: '8.8.8.8' },
]

/** traceroute: probes with TTL = 1, 2, 3 … ; router n replies ICMP 11/0, the destination replies 3/3. */
export function TracerouteSim() {
  const [ttl, setTtl] = useState(0)
  const [silent, setSilent] = useState(false)
  const done = ttl >= HOPS.length
  const rtt = (h: number, k: number) => {
    const r = mulberry32(h * 31 + k * 7 + 3)
    return (2 + h * 5.5 + r() * 3).toFixed(1)
  }
  const isSilent = (h: number) => silent && h === 3
  const W = 620
  const xs = [30, 140, 250, 360, 470, 585]
  const cur = ttl // index of node reached by the last probe set (1..5)

  return (
    <Widget title="traceroute 8.8.8.8" hint="กดส่ง probe ทีละชุด (ชุดละ 3 ตัว) TTL เพิ่มทีละ 1 ดูว่าใครตอบ ICMP อะไรกลับมา">
      <ButtonRow>
        <button onClick={() => setTtl((t) => Math.min(HOPS.length, t + 1))} disabled={done} style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
          ส่ง probe TTL = {Math.min(ttl + 1, HOPS.length)} ▶
        </button>
        <button onClick={() => setTtl(HOPS.length)}>รันจนจบ</button>
        <button onClick={() => setTtl(0)}>เริ่มใหม่</button>
        <label>
          <input type="checkbox" checked={silent} onChange={(e) => setSilent(e.target.checked)} /> R3 ตั้งไม่ให้ตอบ probe
        </label>
      </ButtonRow>
      <div className={net.svgScroll}>
        <svg className={net.svg} viewBox={`0 0 ${W} 130`} role="img" aria-label="เส้นทาง traceroute">
          <defs>
            {(['accent', 'warn', 'ex'] as const).map((c) => (
              <marker key={c} id={`tr-${c}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" fill={`var(--${c})`} />
              </marker>
            ))}
          </defs>
          {xs.slice(0, -1).map((x, i) => (
            <line key={i} x1={x} x2={xs[i + 1]} y1={60} y2={60} stroke="var(--border)" strokeWidth={3} />
          ))}
          {cur > 0 && <line x1={xs[0]} x2={xs[cur] - 22} y1={52} y2={52} stroke="var(--accent)" strokeWidth={2.5} markerEnd="url(#tr-accent)" />}
          {cur > 0 && !isSilent(cur) && (
            <line x1={xs[cur] - 10} x2={xs[0] + 16} y1={74} y2={74} stroke={done ? 'var(--ex)' : 'var(--warn)'} strokeWidth={2} strokeDasharray="6 4" markerEnd={done ? 'url(#tr-ex)' : 'url(#tr-warn)'} />
          )}
          {xs.map((x, i) => {
            const reached = i === cur && cur > 0
            const label = i === 0 ? 'ต้นทาง' : HOPS[i - 1].name.split(' ').pop()
            return (
              <g key={i}>
                <circle cx={x} cy={60} r={i === 0 || i === xs.length - 1 ? 17 : 15} fill={reached ? (done ? 'var(--ex)' : 'var(--warn)') : 'var(--surface-2)'} stroke="var(--muted)" />
                <text x={x} y={65} textAnchor="middle" fontSize={11} fontWeight={700} fill={reached ? '#050505' : 'var(--text)'}>
                  {i === 0 ? 'PC' : i === xs.length - 1 ? 'dst' : `R${i}`}
                </text>
                <text x={x} y={104} textAnchor="middle" fontSize={11} fill="var(--muted)">
                  {label}
                </text>
                {reached && !isSilent(i) && (
                  <text x={x} y={24} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={done ? 'var(--ex)' : 'var(--warn)'}>
                    {done ? 'ICMP 3/3' : 'TTL=0 → ICMP 11/0'}
                  </text>
                )}
                {reached && isSilent(i) && (
                  <text x={x} y={24} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--muted)">
                    (เงียบ)
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
      <pre className={net.mono} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', fontSize: 13, margin: '8px 0', overflowX: 'auto', minHeight: 64 }}>
        {`traceroute to 8.8.8.8, 30 hops max\n`}
        {HOPS.slice(0, ttl)
          .map((h, i) => (isSilent(i + 1) ? ` ${i + 1}  * * *` : ` ${i + 1}  ${h.name.split(' ').pop()} (${h.ip})  ${rtt(i + 1, 1)} ms  ${rtt(i + 1, 2)} ms  ${rtt(i + 1, 3)} ms`))
          .join('\n')}
      </pre>
      <Readout>
        {ttl === 0 && <>ยังไม่ได้ส่ง probe · probe คือ UDP ไปพอร์ตที่ (น่าจะ) ไม่มีแอปเปิดอยู่</>}
        {ttl > 0 && !done && !isSilent(ttl) && (
          <>
            ชุด TTL = {ttl} หมดอายุที่เราเตอร์ตัวที่ {ttl} → เราเตอร์ทิ้งแล้วส่ง <b>ICMP type 11 code 0 (TTL expired)</b> กลับมา พร้อมชื่อ/IP ของมัน ต้นทางจด RTT
          </>
        )}
        {ttl > 0 && !done && isSilent(ttl) && (
          <>
            R3 ไม่ตอบ → ขึ้น <b>* * *</b> ไม่ได้แปลว่าเส้นทางเสีย (probe ชุดถัดไปยังผ่าน R3 ไปได้)
          </>
        )}
        {done && (
          <>
            UDP ถึงปลายทาง ซึ่งไม่มีแอปที่พอร์ตนั้น → ตอบ <b>ICMP 3/3 port unreachable</b> → ต้นทาง<b>หยุด</b>
          </>
        )}
      </Readout>
    </Widget>
  )
}
