import { useState } from 'react'
import { ButtonRow, Readout, Widget } from '../interactive/Widget'

interface F {
  name: string
  size: string
  grow: number
  desc: string
  tag?: boolean
  color?: string
}

const BASE: F[] = [
  { name: 'preamble', size: '8 B', grow: 1.4, desc: '7 bytes ของ 10101010 ตามด้วย 10101011 ใช้ sync clock ฝั่งส่งกับฝั่งรับ' },
  { name: 'dest addr', size: '6 B', grow: 1.2, desc: 'MAC ปลายทาง ถ้าตรงกับตัวเองหรือเป็น broadcast (FF-FF-FF-FF-FF-FF) ส่งขึ้น network layer ไม่งั้นทิ้ง' },
  { name: 'source addr', size: '6 B', grow: 1.2, desc: 'MAC ต้นทาง (switch ใช้ field นี้ self-learn)' },
  { name: 'type', size: '', grow: 0.8, desc: 'protocol ชั้นบน (ส่วนใหญ่คือ IP) ใช้ demultiplex' },
  { name: 'data (payload)', size: '', grow: 4, desc: 'IP datagram', color: 'var(--ex)' },
  { name: 'CRC', size: '', grow: 0.9, desc: 'ตรวจ error ถ้าเจอทิ้ง frame (Ethernet ไม่ส่ง ACK/NAK)' },
]
const TAG: F[] = [
  { name: 'TPID 81-00', size: '2 B', grow: 1, tag: true, desc: '802.1Q: Tag Protocol Identifier บอกว่านี่คือ frame ที่มี VLAN tag' },
  { name: 'VLAN ID + pri', size: '2 B', grow: 1.2, tag: true, desc: 'Tag Control Information: VLAN ID 12 บิต + priority 3 บิต (คล้าย IP TOS) · CRC ต้องคำนวณใหม่' },
]

/** Ethernet frame fields; toggle the 802.1Q VLAN tag that trunk ports add after the source address. */
export function EthernetFrame() {
  const [vlan, setVlan] = useState(false)
  const [sel, setSel] = useState<F | null>(null)
  const fields = vlan ? [...BASE.slice(0, 3), ...TAG, ...BASE.slice(3)] : BASE
  return (
    <Widget title="Ethernet frame" hint="แตะ field เพื่ออ่านหน้าที่ · เปิด 802.1Q ดูว่า frame บน trunk port มี tag เพิ่มตรงไหน">
      <ButtonRow>
        <label>
          <input type="checkbox" checked={vlan} onChange={(e) => (setVlan(e.target.checked), setSel(null))} /> 802.1Q VLAN tag (บน trunk port)
        </label>
      </ButtonRow>
      <div style={{ display: 'flex', gap: 3, margin: '10px 0', overflowX: 'auto' }}>
        {fields.map((f) => {
          const on = sel?.name === f.name
          const c = f.tag ? 'var(--tip)' : f.color ?? 'var(--def)'
          return (
            <button
              key={f.name}
              onMouseEnter={() => setSel(f)}
              onClick={() => setSel(f)}
              style={{
                flex: `${f.grow} 0 0`,
                minWidth: 64,
                padding: '8px 4px',
                borderRadius: 7,
                border: `1px solid ${c}`,
                background: on ? c : `color-mix(in srgb, ${c} 14%, var(--surface))`,
                color: on ? '#050505' : c,
                fontSize: 12.5,
                fontWeight: 600,
                lineHeight: 1.25,
                cursor: 'pointer',
              }}
            >
              {f.name}
              {f.size && (
                <span style={{ display: 'block', fontWeight: 400, fontSize: 11, opacity: 0.8 }}>{f.size}</span>
              )}
            </button>
          )
        })}
      </div>
      <Readout>
        {sel ? (
          <>
            <b>{sel.name}</b>: {sel.desc}
          </>
        ) : (
          <>Ethernet เป็น connectionless + unreliable · MAC protocol = unslotted CSMA/CD with binary backoff</>
        )}
      </Readout>
    </Widget>
  )
}
