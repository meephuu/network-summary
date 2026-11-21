import { useState } from 'react'
import { ButtonRow, Readout, Widget } from '../interactive/Widget'
import { net } from './parts'

const MSGS = [
  { name: 'features', dir: 'down', desc: 'controller ถาม feature ของ switch' },
  { name: 'configure', dir: 'down', desc: 'controller ถาม/ตั้งค่า configuration ของ switch' },
  { name: 'modify-state', dir: 'down', desc: 'เพิ่ม / ลบ / แก้ flow entry ใน flow table' },
  { name: 'packet-out', dir: 'down', desc: 'สั่ง switch ส่งแพ็กเก็ตนี้ออกพอร์ตที่กำหนด' },
  { name: 'packet-in', dir: 'up', desc: 'switch ส่งแพ็กเก็ต (เช่น ตัวที่ไม่ match กฎ) ขึ้นไปให้ controller' },
  { name: 'flow-removed', dir: 'up', desc: 'แจ้งว่า flow entry ถูกลบที่ switch' },
  { name: 'port status', dir: 'up', desc: 'แจ้งว่าพอร์ตเปลี่ยนสถานะ เช่น ลิงก์เสีย' },
] as const

/** SDN layers (apps / controller / switches), north- vs southbound API, and OpenFlow message directions. */
export function SdnStack() {
  const [m, setM] = useState<(typeof MSGS)[number] | null>(null)
  const up = m?.dir === 'up'
  const down = m?.dir === 'down'
  return (
    <Widget title="สถาปัตยกรรม SDN + OpenFlow messages" hint="กดชื่อ message เพื่อดูว่าวิ่งทิศไหนระหว่าง controller กับ switch">
      <ButtonRow>
        {MSGS.map((x) => (
          <button key={x.name} onClick={() => setM(x)} style={m?.name === x.name ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined}>
            {x.dir === 'up' ? '↑' : '↓'} {x.name}
          </button>
        ))}
      </ButtonRow>
      <div className={net.svgScroll}>
        <svg className={net.svg} viewBox="0 0 600 330" role="img" aria-label="ชั้นของ SDN">
          <defs>
            <marker id="sdn-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="var(--accent)" />
            </marker>
          </defs>
          {/* apps */}
          {['routing', 'access control', 'load balance'].map((a, i) => (
            <g key={a}>
              <rect x={60 + i * 170} y={14} width={140} height={40} rx={20} fill="color-mix(in srgb, var(--ex) 18%, var(--surface))" stroke="var(--ex)" />
              <text x={130 + i * 170} y={39} textAnchor="middle" fontSize={13} fill="var(--ex)">
                {a}
              </text>
            </g>
          ))}
          <text x={300} y={74} textAnchor="middle" fontSize={11.5} fill="var(--muted)">
            network-control applications (third party เขียนได้)
          </text>
          <line x1={20} x2={580} y1={86} y2={86} stroke="var(--border)" strokeDasharray="5 4" />
          <text x={576} y={100} textAnchor="end" fontSize={12} fontStyle="italic" fill="var(--muted)">
            northbound API
          </text>
          {/* controller */}
          <rect x={120} y={108} width={360} height={74} rx={12} fill="color-mix(in srgb, var(--accent) 16%, var(--surface))" stroke="var(--accent)" />
          <text x={300} y={130} textAnchor="middle" fontSize={14.5} fontWeight={700} fill="var(--accent)">
            SDN Controller (network OS)
          </text>
          {['interface ให้ app', 'network-wide state', 'communication'].map((t, i) => (
            <g key={t}>
              <rect x={132 + i * 114} y={142} width={106} height={30} rx={6} fill="var(--surface-2)" stroke="var(--border)" />
              <text x={185 + i * 114} y={161} textAnchor="middle" fontSize={11} fill="var(--text)">
                {t}
              </text>
            </g>
          ))}
          <line x1={20} x2={580} y1={200} y2={200} stroke="var(--border)" strokeDasharray="5 4" />
          <text x={576} y={216} textAnchor="end" fontSize={12} fontStyle="italic" fill="var(--muted)">
            southbound API (OpenFlow บน TCP)
          </text>
          {/* message arrow */}
          {m && (
            <g>
              <line x1={300} y1={up ? 262 : 186} x2={300} y2={up ? 190 : 258} stroke="var(--accent)" strokeWidth={3} markerEnd="url(#sdn-a)" />
              <rect x={312} y={212} width={118} height={24} rx={12} fill="var(--accent)" />
              <text x={371} y={228} textAnchor="middle" fontSize={12} fontWeight={700} fill="#050505">
                {m.name}
              </text>
            </g>
          )}
          {/* switches */}
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={70 + i * 125} y={266} width={90} height={44} rx={10} fill="var(--surface-2)" stroke={up || down ? 'var(--accent)' : 'var(--muted)'} />
              <text x={115 + i * 125} y={293} textAnchor="middle" fontSize={12} fill="var(--text)">
                switch
              </text>
              {i < 3 && <line x1={160 + i * 125} x2={195 + i * 125} y1={288} y2={288} stroke="var(--muted)" strokeWidth={2} />}
            </g>
          ))}
          <text x={300} y={326} textAnchor="middle" fontSize={11.5} fill="var(--muted)">
            data-plane switches: เร็ว ถูก ทำ generalized forwarding ตาม flow table
          </text>
        </svg>
      </div>
      <Readout>
        {m ? (
          <>
            <b>{m.name}</b> ({m.dir === 'down' ? 'controller → switch' : 'switch → controller'}): {m.desc}
          </>
        ) : (
          <>
            จำง่าย: <b>northbound</b> = controller คุยขึ้นไปหา app · <b>southbound</b> = คุยลงไปหา switch
          </>
        )}
      </Readout>
    </Widget>
  )
}
