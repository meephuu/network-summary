import { useState } from 'react'
import { ButtonRow, Readout, Widget } from '../interactive/Widget'
import { net } from './parts'

interface Pkt {
  srcIp: string
  dstIp: string
  dport: number
  dstMac: string
}
interface Rule {
  prio: number
  match: string
  test: (p: Pkt) => boolean
  action: string
  why: string
}

const wild = (pattern: string, ip: string) => {
  const a = pattern.split('.')
  const b = ip.split('.')
  return a.every((x, i) => x === '*' || x === b[i])
}

/** Rules taken from the OpenFlow examples in the slides, given priorities so overlaps can be shown. */
const RULES: Rule[] = [
  { prio: 40, match: 'TCP d-port = 22', test: (p) => p.dport === 22, action: 'drop', why: 'firewall: บล็อก ssh' },
  { prio: 30, match: 'IP Src = 128.119.1.1', test: (p) => p.srcIp === '128.119.1.1', action: 'drop', why: 'firewall: บล็อก host นี้' },
  { prio: 20, match: 'IP Src = 10.1.2.3', test: (p) => p.srcIp === '10.1.2.3', action: 'send to controller', why: 'ให้ controller ตัดสิน' },
  { prio: 10, match: 'IP Dst = 51.6.0.8', test: (p) => p.dstIp === '51.6.0.8', action: 'forward(6)', why: 'destination-based forwarding' },
  { prio: 5, match: 'IP Dst = 3.4.*.*', test: (p) => wild('3.4.*.*', p.dstIp), action: 'forward(2)', why: 'wildcard ปลายทาง' },
  { prio: 1, match: 'MAC dst = 22:A7:23:11:E1:02', test: (p) => p.dstMac === '22:A7:23:11:E1:02', action: 'forward(3)', why: 'layer 2 forwarding' },
]

const SRC = ['1.2.3.4', '128.119.1.1', '10.1.2.3']
const DST = ['51.6.0.8', '3.4.9.9', '8.8.8.8']
const PORT = [80, 22, 443]
const MAC = ['22:A7:23:11:E1:02', '0C:4F:11:AA:20:7B']

/** Match + action: a packet is checked against every rule; the highest-priority match wins and its counter goes up. */
export function FlowTable() {
  const [p, setP] = useState<Pkt>({ srcIp: '1.2.3.4', dstIp: '51.6.0.8', dport: 80, dstMac: MAC[1] })
  const [count, setCount] = useState<number[]>(RULES.map(() => 0))
  const [miss, setMiss] = useState(0)
  const hits = RULES.map((r) => r.test(p))
  const win = hits.indexOf(true)
  const upd = (k: keyof Pkt, v: string | number) => setP((q) => ({ ...q, [k]: v }))
  const send = () => {
    if (win >= 0) setCount((c) => c.map((x, i) => (i === win ? x + 1 : x)))
    else setMiss((m) => m + 1)
  }

  return (
    <Widget title="Flow table: match + action" hint="ตั้งค่า header ของแพ็กเก็ต แถวที่ match จะเรืองแสง ถ้า match หลายแถว priority สูงสุดชนะ กด 'ส่ง' แล้วดู counter ขึ้น">
      <div className={net.inputs}>
        <label>
          IP Src
          <select value={p.srcIp} onChange={(e) => upd('srcIp', e.target.value)}>
            {SRC.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          IP Dst
          <select value={p.dstIp} onChange={(e) => upd('dstIp', e.target.value)}>
            {DST.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          TCP d-port
          <select value={p.dport} onChange={(e) => upd('dport', +e.target.value)}>
            {PORT.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          MAC dst
          <select value={p.dstMac} onChange={(e) => upd('dstMac', e.target.value)}>
            {MAC.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </div>
      <ButtonRow>
        <button onClick={send} style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
          ส่งแพ็กเก็ตเข้า switch ▶
        </button>
        <button onClick={() => (setCount(RULES.map(() => 0)), setMiss(0))}>ล้าง counter</button>
      </ButtonRow>
      <div className={net.tblWrap}>
        <table className={net.tbl}>
          <thead>
            <tr>
              <th>priority</th>
              <th>match (ช่องอื่น = *)</th>
              <th>action</th>
              <th>counter</th>
            </tr>
          </thead>
          <tbody>
            {RULES.map((r, i) => (
              <tr key={i} className={i === win ? net.rowWin : hits[i] ? net.rowHit : undefined}>
                <td className={net.num}>{r.prio}</td>
                <td className={net.mono}>{r.match}</td>
                <td>{r.action}</td>
                <td className={net.num}>{count[i]}</td>
              </tr>
            ))}
            <tr className={win < 0 ? net.rowWin : net.rowDim}>
              <td className={net.num}>–</td>
              <td>table miss (ไม่ match อะไรเลย)</td>
              <td>send to controller</td>
              <td className={net.num}>{miss}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Readout>
        {win >= 0 ? (
          <>
            match {hits.filter(Boolean).length} กฎ → ใช้กฎ priority {RULES[win].prio}: <b>{RULES[win].action}</b> ({RULES[win].why})
          </>
        ) : (
          <>ไม่ match กฎไหนเลย → ส่งให้ controller ตัดสิน</>
        )}
      </Readout>
    </Widget>
  )
}
