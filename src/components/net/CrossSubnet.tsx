import { useState } from 'react'
import { Readout, Widget } from '../interactive/Widget'
import { StepNote, Stepper, net } from './parts'

const A = { ip: '111.111.111.111', mac: '74-29-9C-E8-FF-55' }
const RL = { ip: '111.111.111.110', mac: 'E6-E9-00-17-BB-4B' }
const RR = { ip: '222.222.222.220', mac: '1A-23-F9-CD-06-9B' }
const B = { ip: '222.222.222.222', mac: '49-BD-D2-C7-56-2A' }

const STEPS = [
  { at: 'A', frame: null, note: 'A จะส่งให้ B (คนละ subnet) · A รู้ IP ของ B, IP ของ first-hop router R (จาก DHCP) และ MAC ของ R (จาก ARP)' },
  { at: 'A', frame: 'ip', note: 'A สร้าง IP datagram: src = IP ของ A, dest = IP ของ B' },
  { at: 'AR', frame: 'f1', note: 'A ห่อ datagram ใส่ frame ที่ MAC dest = MAC ของ R (ไม่ใช่ของ B!) แล้วส่งไป R' },
  { at: 'R', frame: 'ip', note: 'R รับ frame แกะ link-layer header ออก ส่ง datagram ขึ้นไปที่ IP แล้วดู forwarding table ว่าต้องออก interface ไหน' },
  { at: 'RB', frame: 'f2', note: 'R สร้าง frame ใหม่: MAC src = interface ขาออกของ R, MAC dest = MAC ของ B · IP src/dest ยังเหมือนเดิม' },
  { at: 'B', frame: 'ip', note: 'B รับ frame แกะออก ส่ง datagram ขึ้น IP เสร็จ' },
]

function Field({ k, v, hi }: { k: string; v: string; hi?: boolean }) {
  return (
    <div
      style={{
        padding: '3px 8px',
        borderRadius: 6,
        fontSize: 12.5,
        background: hi ? 'color-mix(in srgb, var(--def) 26%, transparent)' : 'var(--surface-2)',
        color: hi ? 'var(--def)' : 'var(--text)',
        transition: 'background .3s',
      }}
      className={net.mono}
    >
      <span className="small" style={{ fontSize: 11 }}>
        {k}
      </span>
      <br />
      {v}
    </div>
  )
}

/** Sending a datagram to another subnet: IP addresses stay the same, MAC addresses change at every hop. */
export function CrossSubnet() {
  const [step, setStep] = useState(0)
  const s = STEPS[step]
  const frame = s.frame === 'f1' ? { src: A.mac, dst: RL.mac } : s.frame === 'f2' ? { src: RR.mac, dst: B.mac } : null
  const pos = { A: 70, AR: 200, R: 300, RB: 400, B: 530 }[s.at]!
  return (
    <Widget title="ส่งข้าม subnet: IP คงเดิม MAC เปลี่ยนทุก hop" hint="กดถัดไป ดู header ทั้ง 2 ชั้นของแพ็กเก็ตในแต่ละช่วง">
      <Stepper step={step} max={STEPS.length - 1} onStep={(n) => setStep(Math.max(0, Math.min(STEPS.length - 1, n)))} />
      <div className={net.svgScroll}>
        <svg className={net.svg} viewBox="0 0 600 150" role="img" aria-label="A ส่งผ่านเราเตอร์ R ไป B">
          <rect x={20} y={10} width={250} height={130} rx={14} fill="color-mix(in srgb, var(--accent) 5%, transparent)" stroke="var(--border)" />
          <rect x={330} y={10} width={250} height={130} rx={14} fill="color-mix(in srgb, var(--ex) 5%, transparent)" stroke="var(--border)" />
          <text x={30} y={28} fontSize={11} fill="var(--muted)">
            subnet 111.111.111.x
          </text>
          <text x={570} y={28} fontSize={11} fill="var(--muted)" textAnchor="end">
            subnet 222.222.222.x
          </text>
          <line x1={70} x2={530} y1={78} y2={78} stroke="var(--border)" strokeWidth={3} />
          {[
            { x: 70, n: 'A', d: A },
            { x: 530, n: 'B', d: B },
          ].map((h) => (
            <g key={h.n}>
              <rect x={h.x - 26} y={60} width={52} height={36} rx={8} fill="var(--surface-2)" stroke="var(--muted)" />
              <text x={h.x} y={83} textAnchor="middle" fontWeight={700} fontSize={15} fill="var(--text)">
                {h.n}
              </text>
              <text x={h.x} y={114} textAnchor="middle" fontSize={10.5} fill="var(--muted)" fontFamily="var(--font-mono)">
                {h.d.ip}
              </text>
              <text x={h.x} y={128} textAnchor="middle" fontSize={10.5} fill="var(--muted)" fontFamily="var(--font-mono)">
                {h.d.mac}
              </text>
            </g>
          ))}
          <circle cx={300} cy={78} r={26} fill="var(--surface-2)" stroke="var(--accent)" strokeWidth={2} />
          <text x={300} y={84} textAnchor="middle" fontWeight={700} fontSize={16} fill="var(--accent)">
            R
          </text>
          <text x={262} y={114} textAnchor="end" fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">
            {RL.mac}
          </text>
          <text x={338} y={128} fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">
            {RR.mac}
          </text>
          <g style={{ transform: `translateX(${pos}px)`, transition: 'transform .4s ease' }}>
            <rect x={-18} y={36} width={36} height={18} rx={5} fill={frame ? 'var(--def)' : 'var(--ex)'} />
            <text x={0} y={49} textAnchor="middle" fontSize={10} fontWeight={700} fill="#050505">
              {frame ? 'frame' : 'IP'}
            </text>
          </g>
        </svg>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'stretch', margin: '6px 0' }}>
        {frame && (
          <div style={{ display: 'flex', gap: 4, border: '1.5px solid var(--def)', borderRadius: 9, padding: 4 }}>
            <Field k="MAC src" v={frame.src} hi />
            <Field k="MAC dest" v={frame.dst} hi />
          </div>
        )}
        {step > 0 && (
          <div style={{ display: 'flex', gap: 4, border: '1.5px solid var(--ex)', borderRadius: 9, padding: 4 }}>
            <Field k="IP src" v={A.ip} />
            <Field k="IP dest" v={B.ip} />
            <Field k="" v="data" />
          </div>
        )}
      </div>
      <StepNote>{s.note}</StepNote>
      <Readout>
        ช่วง A → R: MAC dest = <b>R</b> · ช่วง R → B: MAC dest = <b>B</b> · ทั้งสองช่วง IP src/dest = A → B เหมือนเดิม
      </Readout>
    </Widget>
  )
}
