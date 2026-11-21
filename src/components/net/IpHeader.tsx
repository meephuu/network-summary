import { useState } from 'react'
import { ButtonRow, Readout, Widget } from '../interactive/Widget'
import { Seg } from './parts'

interface Field {
  name: string
  bits: number
  /** columns spanned in a 32-bit row */
  span: number
  desc: string
  /** IPv4 field that IPv6 dropped */
  gone?: boolean
  tall?: boolean
}

const V4: Field[][] = [
  [
    { name: 'ver', bits: 4, span: 4, desc: 'เวอร์ชัน IP (4)' },
    { name: 'head len', bits: 4, span: 4, desc: 'ความยาว header (ต้องมีเพราะ options ยาวไม่คงที่)' },
    { name: 'type of service', bits: 8, span: 8, desc: 'บิต 0–5 = diffserv (แบ่งคลาสบริการ), บิต 6–7 = ECN (บอก congestion)' },
    { name: 'length', bits: 16, span: 16, desc: 'ความยาวทั้ง datagram (header + data) หน่วย byte สูงสุด 64K ปกติ ≤ 1500' },
  ],
  [
    { name: '16-bit identifier', bits: 16, span: 16, desc: 'ID: ทุก fragment ของ datagram เดียวกันมี ID เดียวกัน', gone: true },
    { name: 'flgs', bits: 3, span: 3, desc: 'fragflag (More Fragments): 1 = ยังมีชิ้นตามมา, 0 = ชิ้นสุดท้าย', gone: true },
    { name: 'fragment offset', bits: 13, span: 13, desc: 'ตำแหน่ง data ใน datagram เดิม หน่วยละ 8 bytes', gone: true },
  ],
  [
    { name: 'TTL', bits: 8, span: 8, desc: 'time to live: จำนวน hop ที่เหลือ ลด 1 ทุกเราเตอร์ ถึง 0 ทิ้ง (กันวนไม่รู้จบ)' },
    { name: 'upper layer', bits: 8, span: 8, desc: 'protocol ชั้นบน เช่น TCP หรือ UDP บอกฝั่งรับว่าส่ง data ให้ใคร' },
    { name: 'header checksum', bits: 16, span: 16, desc: 'ตรวจ error เฉพาะ header ต้องคำนวณใหม่ทุก hop เพราะ TTL เปลี่ยน', gone: true },
  ],
  [{ name: 'source IP address', bits: 32, span: 32, desc: 'IP ต้นทาง 32 บิต' }],
  [{ name: 'destination IP address', bits: 32, span: 32, desc: 'IP ปลายทาง 32 บิต' }],
  [{ name: 'options (if any)', bits: 0, span: 32, desc: 'เช่น timestamp, record route ยาวไม่คงที่', gone: true }],
  [{ name: 'data (payload)', bits: 0, span: 32, desc: 'ปกติคือ TCP หรือ UDP segment', tall: true }],
]

const V6: Field[][] = [
  [
    { name: 'ver', bits: 4, span: 4, desc: 'เวอร์ชัน (6)' },
    { name: 'pri', bits: 8, span: 8, desc: 'priority ของ datagram ใน flow' },
    { name: 'flow label', bits: 20, span: 20, desc: 'ระบุ datagram ที่อยู่ใน "flow" เดียวกัน (คำว่า flow ยังนิยามไม่ชัด)' },
  ],
  [
    { name: 'payload len', bits: 16, span: 16, desc: 'ความยาว payload' },
    { name: 'next hdr', bits: 8, span: 8, desc: 'header ถัดไป (คล้าย upper layer ของ IPv4) ใช้แทน options ด้วย' },
    { name: 'hop limit', bits: 8, span: 8, desc: 'เทียบเท่า TTL' },
  ],
  [{ name: 'source address (128 bits)', bits: 128, span: 32, desc: 'IP ต้นทาง 128 บิต', tall: true }],
  [{ name: 'destination address (128 bits)', bits: 128, span: 32, desc: 'IP ปลายทาง 128 บิต', tall: true }],
  [{ name: 'data (payload)', bits: 0, span: 32, desc: 'payload', tall: true }],
]

/** Interactive IPv4 / IPv6 header: hover or tap a field to read what it does. */
export function IpHeader() {
  const [ver, setVer] = useState<'v4' | 'v6'>('v4')
  const [sel, setSel] = useState<Field | null>(null)
  const rows = ver === 'v4' ? V4 : V6
  return (
    <Widget title="IP datagram format" hint="แตะ/ชี้ที่ field เพื่ออ่านหน้าที่ · ในโหมด IPv4 กรอบประสีส้ม = field ที่ IPv6 ตัดทิ้ง">
      <ButtonRow>
        <Seg
          value={ver}
          onChange={(v) => (setVer(v), setSel(null))}
          options={[
            ['v4', 'IPv4 (20 bytes + options)'],
            ['v6', 'IPv6 (40 bytes คงที่)'],
          ]}
        />
      </ButtonRow>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', margin: '8px 2px 2px' }}>
        <span>0</span>
        <span>← 32 bits →</span>
        <span>31</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(32, 1fr)', gap: 3 }}>
        {rows.flat().map((f) => {
          const on = sel?.name === f.name
          const gone = ver === 'v4' && f.gone
          return (
            <button
              key={f.name}
              onMouseEnter={() => setSel(f)}
              onFocus={() => setSel(f)}
              onClick={() => setSel(f)}
              style={{
                gridColumn: `span ${f.span}`,
                minHeight: f.tall ? 56 : 40,
                padding: '2px 4px',
                fontSize: 'clamp(9.5px, 2.5vw, 12.5px)',
                lineHeight: 1.2,
                wordBreak: 'break-word',
                borderRadius: 6,
                cursor: 'pointer',
                border: gone ? '1.5px dashed var(--warn)' : '1px solid var(--border)',
                background: on ? 'var(--accent)' : f.name.startsWith('data') ? 'var(--surface-2)' : 'color-mix(in srgb, var(--accent) 9%, var(--surface))',
                color: on ? '#050505' : gone ? 'var(--warn)' : 'var(--text)',
                fontWeight: on ? 600 : 400,
                overflow: 'hidden',
              }}
            >
              {f.name}
            </button>
          )
        })}
      </div>
      <Readout>
        {sel ? (
          <>
            <b>{sel.name}</b>
            {sel.bits > 0 && ` (${sel.bits} bits)`} — {sel.desc}
            {ver === 'v4' && sel.gone && <span style={{ color: 'var(--warn)' }}> · IPv6 ไม่มี field นี้</span>}
          </>
        ) : ver === 'v4' ? (
          <>header ปกติ 20 bytes · TCP 20 + IP 20 = 40 bytes overhead</>
        ) : (
          <>IPv6 ตัด checksum, fragmentation และ options ออก → header ยาวคงที่ 40 bytes เราเตอร์ประมวลผลเร็วขึ้น</>
        )}
      </Readout>
    </Widget>
  )
}
