import { useState } from 'react'
import { ButtonRow, Readout, Widget } from '../interactive/Widget'
import { net } from './parts'

const NAT_IP = '138.76.29.7'
const HOSTS = [
  { ip: '10.0.0.1', port: 3345 },
  { ip: '10.0.0.2', port: 4012 },
  { ip: '10.0.0.3', port: 3345 },
]
const SERVERS = [
  { ip: '128.119.40.186', port: 80 },
  { ip: '64.233.169.105', port: 443 },
]

interface Entry {
  wanPort: number
  lanIp: string
  lanPort: number
}
type Ev =
  | { kind: 'out'; host: (typeof HOSTS)[number]; srv: (typeof SERVERS)[number]; wanPort: number; isNew: boolean }
  | { kind: 'in-miss'; port: number }

function Hdr({ label, src, dst, hi }: { label: string; src: string; dst: string; hi?: 'src' | 'dst' }) {
  const cell = (k: 'src' | 'dst', v: string) => (
    <div
      className={net.mono}
      style={{
        fontSize: 12.5,
        padding: '2px 6px',
        borderRadius: 5,
        background: hi === k ? 'color-mix(in srgb, var(--accent) 26%, transparent)' : 'var(--surface-2)',
        color: hi === k ? 'var(--accent)' : 'var(--text)',
      }}
    >
      {k === 'src' ? 'S' : 'D'}: {v}
    </div>
  )
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 9, padding: 6, display: 'grid', gap: 3, minWidth: 0 }}>
      <div className="small" style={{ fontSize: 12 }}>
        {label}
      </div>
      {cell('src', src)}
      {cell('dst', dst)}
    </div>
  )
}

/** NAT translation table: send from different LAN hosts and watch (IP, port) get rewritten. */
export function NatSim() {
  const [h, setH] = useState(0)
  const [sv, setSv] = useState(0)
  const [table, setTable] = useState<Entry[]>([])
  const [ev, setEv] = useState<Ev | null>(null)
  const host = HOSTS[h]
  const srv = SERVERS[sv]

  const send = () => {
    const found = table.find((e) => e.lanIp === host.ip && e.lanPort === host.port)
    const wanPort = found ? found.wanPort : 5001 + table.length
    if (!found) setTable((t) => [...t, { wanPort, lanIp: host.ip, lanPort: host.port }])
    setEv({ kind: 'out', host, srv, wanPort, isNew: !found })
  }
  const outsider = () => setEv({ kind: 'in-miss', port: 5001 + table.length + 7 })

  return (
    <Widget title="NAT translation table" hint="เลือกเครื่องในบ้านแล้วกดส่ง ดู NAT เปลี่ยน source (IP, port) ตอนออก และเปลี่ยน destination กลับตอนเข้า">
      <div className={net.inputs}>
        <label>
          เครื่องในบ้าน
          <select value={h} onChange={(e) => setH(+e.target.value)}>
            {HOSTS.map((x, i) => (
              <option key={i} value={i}>
                {x.ip}:{x.port}
              </option>
            ))}
          </select>
        </label>
        <label>
          ส่งไป
          <select value={sv} onChange={(e) => setSv(+e.target.value)}>
            {SERVERS.map((x, i) => (
              <option key={i} value={i}>
                {x.ip}:{x.port}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ButtonRow>
        <button onClick={send} style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
          ส่งแพ็กเก็ตออก ▶
        </button>
        <button onClick={outsider}>คนข้างนอกขอเชื่อมเข้ามาเอง</button>
        <button onClick={() => (setTable([]), setEv(null))}>ล้างตาราง</button>
      </ButtonRow>

      {ev?.kind === 'out' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, margin: '10px 0' }}>
          <Hdr label="① LAN → NAT" src={`${ev.host.ip}, ${ev.host.port}`} dst={`${ev.srv.ip}, ${ev.srv.port}`} />
          <Hdr label="② NAT → อินเทอร์เน็ต" src={`${NAT_IP}, ${ev.wanPort}`} dst={`${ev.srv.ip}, ${ev.srv.port}`} hi="src" />
          <Hdr label="③ server ตอบกลับ" src={`${ev.srv.ip}, ${ev.srv.port}`} dst={`${NAT_IP}, ${ev.wanPort}`} />
          <Hdr label="④ NAT → LAN" src={`${ev.srv.ip}, ${ev.srv.port}`} dst={`${ev.host.ip}, ${ev.host.port}`} hi="dst" />
        </div>
      )}

      <div className={net.label}>NAT translation table</div>
      <div className={net.tblWrap}>
        <table className={net.tbl}>
          <thead>
            <tr>
              <th>WAN side addr</th>
              <th>LAN side addr</th>
            </tr>
          </thead>
          <tbody>
            {table.length === 0 && (
              <tr>
                <td colSpan={2} className="small">
                  ว่าง
                </td>
              </tr>
            )}
            {table.map((e) => (
              <tr key={e.wanPort} className={ev?.kind === 'out' && ev.wanPort === e.wanPort ? (ev.isNew ? net.rowNew : net.rowHit) : undefined}>
                <td className={net.mono}>
                  {NAT_IP}, {e.wanPort}
                </td>
                <td className={net.mono}>
                  {e.lanIp}, {e.lanPort}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Readout>
        {!ev && <>โลกภายนอกเห็นทุกแพ็กเก็ตจากบ้านมี source IP เดียวกันคือ {NAT_IP} ต่างกันแค่ port</>}
        {ev?.kind === 'out' &&
          (ev.isNew ? (
            <>
              เพิ่ม entry ใหม่: <b>{NAT_IP}, {ev.wanPort}</b> ↔ {ev.host.ip}, {ev.host.port}
              {table.some((e) => e.lanPort === ev.host.port && e.lanIp !== ev.host.ip) && ' (port ในบ้านซ้ำกันได้ เพราะ NAT แยกด้วย port ฝั่ง WAN)'}
            </>
          ) : (
            <>มี entry อยู่แล้ว ใช้ port {ev.wanPort} เดิม</>
          ))}
        {ev?.kind === 'in-miss' && (
          <>
            แพ็กเก็ตจากข้างนอกมาที่ {NAT_IP}:{ev.port} แต่ตาราง<b>ไม่มี entry</b> → NAT ไม่รู้จะส่งให้ใคร ทิ้ง = ปัญหา <b>NAT traversal</b>
          </>
        )}
      </Readout>
    </Widget>
  )
}
