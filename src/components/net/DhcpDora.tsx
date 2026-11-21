import { useState } from 'react'
import { Widget } from '../interactive/Widget'
import { StepNote, Stepper, net } from './parts'

const MSGS = [
  {
    name: 'DHCP discover',
    dir: 'up' as const,
    src: '0.0.0.0 : 68',
    dst: '255.255.255.255 : 67',
    body: ['yiaddr: 0.0.0.0', 'transaction ID: 654'],
    note: (
      <>
        client ยังไม่มี IP (ใช้ <b>0.0.0.0</b>) และไม่รู้ว่า server อยู่ไหน จึง <b>broadcast</b> ถามว่า "มี DHCP server อยู่ไหม?"
      </>
    ),
  },
  {
    name: 'DHCP offer',
    dir: 'down' as const,
    src: '223.1.2.5 : 67',
    dst: '255.255.255.255 : 68',
    body: ['yiaddr: 223.1.2.4', 'transaction ID: 654', 'lifetime: 3600 secs'],
    note: (
      <>
        server เสนอ IP <b>223.1.2.4</b> ให้เช่า (lease) 3600 วินาที ยัง broadcast อยู่เพราะ client ยังไม่มี IP
      </>
    ),
  },
  {
    name: 'DHCP request',
    dir: 'up' as const,
    src: '0.0.0.0 : 68',
    dst: '255.255.255.255 : 67',
    body: ['yiaddr: 223.1.2.4', 'transaction ID: 655', 'lifetime: 3600 secs'],
    note: <>client ตอบ "โอเค ขอใช้ 223.1.2.4" (ขั้น 1–2 ข้ามได้ถ้า client จำ IP เดิมและขอใช้ซ้ำ)</>,
  },
  {
    name: 'DHCP ACK',
    dir: 'down' as const,
    src: '223.1.2.5 : 67',
    dst: '255.255.255.255 : 68',
    body: ['yiaddr: 223.1.2.4', 'transaction ID: 655', 'lifetime: 3600 secs'],
    note: (
      <>
        server ยืนยัน "IP นี้เป็นของคุณ" พร้อมให้ <b>first-hop router, DNS server, network mask</b> ด้วย
      </>
    ),
  },
]

/** DHCP Discover–Offer–Request–ACK as a step-through sequence diagram (slide example, server 223.1.2.5). */
export function DhcpDora() {
  const [step, setStep] = useState(0)
  const W = 620
  const xc = 70
  const xs = W - 70
  const y0 = 64
  const gap = 74
  return (
    <Widget title="DHCP 4 ขั้น (DORA)" hint="กดถัดไปทีละขั้น สังเกต src/dest IP และพอร์ต 68 (client) ↔ 67 (server)">
      <Stepper step={step} max={4} onStep={(n) => setStep(Math.max(0, Math.min(4, n)))} />
      <div className={net.svgScroll}>
        <svg className={net.svg} viewBox={`0 0 ${W} ${y0 + gap * 4 + 8}`} role="img" aria-label="sequence diagram DHCP">
          <text x={xc} y={20} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--text)">
            client (laptop)
          </text>
          <text x={xc} y={38} textAnchor="middle" fontSize={11.5} fill="var(--muted)">
            ยังไม่มี IP
          </text>
          <text x={xs} y={20} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--text)">
            DHCP server
          </text>
          <text x={xs} y={38} textAnchor="middle" fontSize={11.5} fill="var(--muted)">
            223.1.2.5
          </text>
          <line x1={xc} x2={xc} y1={46} y2={y0 + gap * 4} stroke="var(--border)" strokeWidth={2} />
          <line x1={xs} x2={xs} y1={46} y2={y0 + gap * 4} stroke="var(--border)" strokeWidth={2} />
          <defs>
            <marker id="dhcp-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="var(--accent)" />
            </marker>
          </defs>
          {MSGS.map((m, i) => {
            const shown = i < step
            const cur = i === step - 1
            const y1 = y0 + gap * i + 4
            const y2 = y1 + 54
            const [a, b] = m.dir === 'up' ? [xc, xs] : [xs, xc]
            return (
              <g key={i} opacity={shown ? 1 : 0.12} style={{ transition: 'opacity .3s' }}>
                <line x1={a} y1={y1 + 44} x2={b} y2={y2} stroke={cur ? 'var(--accent)' : 'var(--muted)'} strokeWidth={cur ? 2.4 : 1.5} markerEnd="url(#dhcp-arr)" />
                <text x={W / 2} y={y1 + 4} textAnchor="middle" fontSize={13.5} fontWeight={700} fill={cur ? 'var(--accent)' : 'var(--text)'}>
                  {i + 1}. {m.name}
                </text>
                <text x={W / 2} y={y1 + 19} textAnchor="middle" fontSize={11.5} fill="var(--muted)" fontFamily="var(--font-mono)">
                  src {m.src} → dest {m.dst}
                </text>
                <text x={W / 2} y={y1 + 34} textAnchor="middle" fontSize={11.5} fill="var(--ex)" fontFamily="var(--font-mono)">
                  {m.body.join(' · ')}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <StepNote>
        {step === 0 ? (
          <>laptop เพิ่งเสียบเข้าเครือข่าย ยังไม่มี IP กด "ถัดไป" เพื่อเริ่ม</>
        ) : (
          <>
            <b>{MSGS[step - 1].name}:</b> {MSGS[step - 1].note}
          </>
        )}
      </StepNote>
    </Widget>
  )
}
