import { useState } from 'react'
import { Readout, Widget } from '../interactive/Widget'
import { StepNote, Stepper, net } from './parts'

const NODES = {
  pc: { x: 55, y: 160, label: 'laptop', sub: '68.80.2.x' },
  sw: { x: 160, y: 160, label: 'switch', sub: '' },
  rt: { x: 270, y: 160, label: 'router', sub: 'DHCP server' },
  cc: { x: 395, y: 80, label: 'Comcast', sub: '68.80.0.0/13' },
  dns: { x: 530, y: 50, label: 'DNS server', sub: '' },
  gg: { x: 395, y: 245, label: 'Google net', sub: '64.233.160.0/19' },
  web: { x: 530, y: 255, label: 'www.google.com', sub: '64.233.169.105' },
} as const
type N = keyof typeof NODES
const LINKS: [N, N][] = [
  ['pc', 'sw'],
  ['sw', 'rt'],
  ['rt', 'cc'],
  ['cc', 'dns'],
  ['cc', 'gg'],
  ['gg', 'web'],
]

const KNOW = ['IP ของตัวเอง', 'IP ของ first-hop router', 'IP ของ DNS server', 'MAC ของ router', 'IP ของ www.google.com', 'TCP connection', 'หน้าเว็บ']

const STEPS: { name: string; path: N[]; stack: string[]; note: string; gain: number[]; bcast?: boolean }[] = [
  { name: 'เริ่ม', path: [], stack: [], note: 'laptop เพิ่งเสียบสาย Ethernet เข้าเครือข่ายมหาวิทยาลัย ยังไม่มี IP และไม่รู้อะไรเลย', gain: [] },
  {
    name: '1. DHCP',
    path: ['pc', 'sw', 'rt'],
    stack: ['DHCP', 'UDP', 'IP', 'Ethernet (dest FF:FF:FF:FF:FF:FF)'],
    bcast: true,
    note: 'ส่ง DHCP request แบบ broadcast (ยังไม่รู้ว่า server อยู่ไหน) เราเตอร์แกะทีละชั้นส่งให้ DHCP server ซึ่งตอบ DHCP ACK กลับ · switch ส่ง frame กลับถูกพอร์ตเพราะ self-learning จำ MAC ของ laptop ได้แล้ว',
    gain: [0, 1, 2],
  },
  {
    name: '2. ARP',
    path: ['pc', 'sw', 'rt'],
    stack: ['ARP query (dest MAC FF-FF-FF-FF-FF-FF)', 'ARP reply (unicast)'],
    bcast: true,
    note: 'จะถาม DNS ได้ต้องส่ง frame ผ่านเราเตอร์ก่อน แต่รู้แค่ IP ของเราเตอร์ → broadcast ARP query เราเตอร์ตอบ MAC ของ interface ตัวเอง (ARP มาก่อน DNS!)',
    gain: [3],
  },
  {
    name: '3. DNS',
    path: ['pc', 'sw', 'rt', 'cc', 'dns'],
    stack: ['DNS', 'UDP', 'IP', 'Ethernet (dest MAC = router)'],
    note: 'DNS query วิ่งไปเราเตอร์ แล้วถูก forward เข้า Comcast ตาม forwarding table ที่สร้างจาก RIP / OSPF / IS-IS / BGP จนถึง DNS server ซึ่งตอบ IP ของ www.google.com',
    gain: [4],
  },
  {
    name: '4. TCP',
    path: ['pc', 'sw', 'rt', 'cc', 'gg', 'web'],
    stack: ['TCP SYN / SYNACK / ACK', 'IP', 'Ethernet'],
    note: 'เปิด TCP socket: ส่ง SYN (ถูก route ข้ามโดเมนด้วย BGP ไปถึง Google) server ตอบ SYNACK แล้ว laptop ตอบ ACK = 3-way handshake',
    gain: [5],
  },
  {
    name: '5. HTTP',
    path: ['pc', 'sw', 'rt', 'cc', 'gg', 'web'],
    stack: ['HTTP request / reply', 'TCP', 'IP', 'Ethernet'],
    note: 'browser ส่ง HTTP request เข้า TCP socket web server ตอบ HTTP reply ที่มีหน้าเว็บ แล้ว route กลับมาแสดงผลในที่สุด',
    gain: [6],
  },
]

/** "A day in the life of a web request": DHCP → ARP → DNS → TCP → HTTP. */
export function WebRequest() {
  const [step, setStep] = useState(0)
  const s = STEPS[step]
  const known = new Set(STEPS.slice(0, step + 1).flatMap((x) => x.gain))
  const onPath = (a: N, b: N) => {
    const i = s.path.indexOf(a)
    const j = s.path.indexOf(b)
    return i >= 0 && j >= 0 && Math.abs(i - j) === 1
  }
  return (
    <Widget title="A day in the life of a web request" hint="ไล่ 5 ขั้นตั้งแต่เสียบสายจนเห็นหน้าเว็บ ดูว่าแต่ละขั้นวิ่งไปถึงไหน ห่อด้วยอะไร และได้ความรู้อะไรเพิ่ม">
      <Stepper step={step} max={STEPS.length - 1} onStep={(n) => setStep(Math.max(0, Math.min(STEPS.length - 1, n)))} />
      <div className={net.svgScroll}>
          <svg className={net.svg} viewBox="0 0 610 300" role="img" aria-label="แผนภาพเครือข่าย">
            <rect x={10} y={110} width={310} height={100} rx={18} fill="color-mix(in srgb, var(--accent) 6%, transparent)" stroke="var(--border)" />
            <text x={20} y={204} fontSize={11} fill="var(--muted)">
              เครือข่ายมหาวิทยาลัย 68.80.2.0/24
            </text>
            {LINKS.map(([a, b]) => {
              const on = onPath(a, b)
              return (
                <line
                  key={a + b}
                  x1={NODES[a].x}
                  y1={NODES[a].y}
                  x2={NODES[b].x}
                  y2={NODES[b].y}
                  stroke={on ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={on ? 4 : 2.5}
                  strokeDasharray={on && s.bcast ? '8 5' : undefined}
                />
              )
            })}
            {(Object.keys(NODES) as N[]).map((k) => {
              const n = NODES[k]
              const on = s.path.includes(k)
              const end = s.path[s.path.length - 1] === k
              return (
                <g key={k}>
                  <circle cx={n.x} cy={n.y} r={end ? 22 : 17} fill={end ? 'var(--accent)' : on ? 'color-mix(in srgb, var(--accent) 25%, var(--surface))' : 'var(--surface-2)'} stroke={on ? 'var(--accent)' : 'var(--muted)'} />
                  <text x={n.x} y={n.y + (n.y > 200 ? 38 : -38)} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--text)">
                    {n.label}
                  </text>
                  {n.sub && (
                    <text x={n.x} y={n.y + (n.y > 200 ? 52 : -25)} textAnchor="middle" fontSize={10.5} fill="var(--muted)" fontFamily="var(--font-mono)">
                      {n.sub}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
      </div>
      <div className={net.twoCol}>
        <div>
          <div className={net.label}>laptop รู้อะไรแล้วบ้าง</div>
          {KNOW.map((k, i) => (
            <div key={k} style={{ fontSize: 14, color: known.has(i) ? 'var(--text)' : 'var(--muted)', opacity: known.has(i) ? 1 : 0.55 }}>
              {known.has(i) ? <span style={{ color: 'var(--ex)' }}>✓</span> : '○'} {k}
            </div>
          ))}
        </div>
        <div>
          {s.stack.length > 0 && (
            <>
              <div className={net.label}>ห่อเป็นชั้น (บน → ล่าง)</div>
              {s.stack.map((x, i) => (
                <div
                  key={x}
                  style={{
                    fontSize: 12.5,
                    padding: '3px 8px',
                    margin: `0 ${i * 6}px 3px ${i * 6}px`,
                    borderRadius: 6,
                    textAlign: 'center',
                    border: '1px solid var(--border)',
                    background: `color-mix(in srgb, var(--accent) ${24 - i * 5}%, var(--surface))`,
                  }}
                >
                  {x}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      <StepNote>
        <b>{s.name}</b> {s.note}
      </StepNote>
      <Readout>
        จำลำดับ: <b>DHCP → ARP → DNS → TCP → HTTP</b> · broadcast ใช้ 2 ครั้ง (DHCP, ARP query) เพราะตอนนั้นยังไม่รู้ว่าปลายทางอยู่ไหน
      </Readout>
    </Widget>
  )
}
