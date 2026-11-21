import { useState } from 'react'
import { ipFromOctets, ipToBits, octetsOf, ipToString } from '../../lib/net'
import { Slider } from '../interactive/Slider'
import { ButtonRow, Controls, Readout, Widget } from '../interactive/Widget'
import { Bits, net } from './parts'

/** Forwarding table from the slide (Chapter 4, "Longest prefix matching"). */
const ROWS = [
  { prefix: ipFromOctets([200, 23, 16, 0]), len: 21, iface: 0 },
  { prefix: ipFromOctets([200, 23, 24, 0]), len: 24, iface: 1 },
  { prefix: ipFromOctets([200, 23, 24, 0]), len: 21, iface: 2 },
]

const PRESETS: [string, number[]][] = [
  ['โจทย์สไลด์ข้อ 1', [200, 23, 22, 161]],
  ['โจทย์สไลด์ข้อ 2', [200, 23, 24, 170]],
  ['ตรงแค่แถว 3', [200, 23, 31, 5]],
  ['ไม่ตรงเลย', [10, 0, 0, 1]],
]

export function PrefixMatch() {
  const [oct, setOct] = useState([200, 23, 22, 161])
  const ip = ipFromOctets(oct)
  const ipBits = ipToBits(ip)
  const set = (i: number) => (v: number) => setOct((o) => o.map((x, j) => (j === i ? v : x)))

  const results = ROWS.map((r) => {
    const pb = ipToBits(r.prefix)
    let firstMiss = -1
    for (let i = 0; i < r.len; i++)
      if (pb[i] !== ipBits[i]) {
        firstMiss = i
        break
      }
    return { ...r, pb, firstMiss, match: firstMiss === -1 }
  })
  const best = results.filter((r) => r.match).sort((a, b) => b.len - a.len)[0]

  return (
    <Widget
      title="Longest prefix matching"
      hint="เลื่อนไบต์ที่ 3 / 4 ของ IP ปลายทาง ดูว่าตรงกับแถวไหนบ้าง (สีเหลือง = บิตที่ตรง, สีส้ม = บิตแรกที่ไม่ตรง) แถวที่ตรงและ prefix ยาวที่สุดชนะ"
    >
      <ButtonRow>
        {PRESETS.map(([name, o]) => (
          <button key={name} onClick={() => setOct(o)}>
            {name}
          </button>
        ))}
      </ButtonRow>
      <Controls>
        <Slider label="ไบต์ที่ 3" value={oct[2]} min={0} max={255} step={1} onChange={set(2)} />
        <Slider label="ไบต์ที่ 4" value={oct[3]} min={0} max={255} step={1} onChange={set(3)} />
      </Controls>
      <div className={net.label}>IP ปลายทาง = {ipToString(ip)}</div>
      <div>
        <Bits bits={ipBits} />
      </div>
      <div className={net.tblWrap}>
        <table className={net.tbl}>
          <thead>
            <tr>
              <th>Destination address range</th>
              <th>prefix</th>
              <th>ผล</th>
              <th>link</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, k) => (
              <tr key={k} className={best === r ? net.rowWin : r.match ? net.rowHit : undefined}>
                <td>
                  <Bits
                    bits={r.pb.slice(0, r.len) + '*'.repeat(32 - r.len)}
                    cls={(i) =>
                      i >= r.len
                        ? net.dimBit
                        : r.firstMiss === -1 || i < r.firstMiss
                          ? net.netBit
                          : i === r.firstMiss
                            ? net.badBit
                            : net.dimBit
                    }
                  />
                </td>
                <td className={net.num}>/{r.len}</td>
                <td>{r.match ? (best === r ? '✓ ยาวสุด' : '✓ ตรง') : `✗ บิตที่ ${r.firstMiss + 1}`}</td>
                <td className={net.num}>{r.iface}</td>
              </tr>
            ))}
            <tr className={!best ? net.rowWin : undefined}>
              <td>otherwise</td>
              <td className={net.num}>/0</td>
              <td>{best ? 'ตรงเสมอ (ยาว 0)' : '✓ ไม่มีแถวอื่นตรง'}</td>
              <td className={net.num}>3</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Readout>
        {octetsOf(ip).join('.')} → ส่งออก link interface <b>{best ? best.iface : 3}</b>
        {best && results.filter((r) => r.match).length > 1 && ` (ตรงหลายแถว เลือก /${best.len} เพราะยาวกว่า)`}
      </Readout>
    </Widget>
  )
}
