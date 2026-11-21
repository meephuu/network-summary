import { useState } from 'react'
import { broadcastOf, ipToBits, ipToString, maskOf, networkOf, parseIp } from '../../lib/net'
import { Slider } from '../interactive/Slider'
import { ButtonRow, Controls, Readout, Widget } from '../interactive/Widget'
import { Bits, net } from './parts'

const PRESETS: [string, string, number, number][] = [
  ['สไลด์: 200.23.16.0/23', '200.23.16.0', 23, 0],
  ['ISP /20 แบ่ง 8 องค์กร', '200.23.16.0', 20, 3],
  ['223.1.1.0/24', '223.1.1.0', 24, 0],
  ['192.168.1.77/26', '192.168.1.77', 26, 0],
]

const fmtCount = (n: number) => n.toLocaleString('en-US')

/** CIDR a.b.c.d/x calculator + splitting a block into 2^k smaller blocks (route aggregation example). */
export function SubnetCalc() {
  const [text, setText] = useState('200.23.16.0')
  const [len, setLen] = useState(23)
  const [borrow, setBorrow] = useState(0)
  const parsed = parseIp(text)
  const ip = parsed ?? 0
  const net0 = networkOf(ip, len)
  const bc = broadcastOf(ip, len)
  const total = 2 ** (32 - len)
  const maxBorrow = Math.min(6, 32 - len)
  const k = Math.min(borrow, maxBorrow)
  const subLen = len + k
  const subs = Array.from({ length: 2 ** k }, (_, i) => (net0 + i * 2 ** (32 - subLen)) >>> 0)

  return (
    <Widget title="CIDR / subnet calculator" hint="พิมพ์ IP แล้วเลื่อน /x ดูว่าบิตไหนเป็น subnet part (เหลือง) บิตไหนเป็น host part (เขียว) และช่วง address ที่ได้">
      <ButtonRow>
        {PRESETS.map(([name, t, l, b]) => (
          <button key={name} onClick={() => (setText(t), setLen(l), setBorrow(b))}>
            {name}
          </button>
        ))}
      </ButtonRow>
      <div className={net.inputs}>
        <label>
          IP
          <input
            type="text"
            value={text}
            size={16}
            className={parsed === null ? net.bad : undefined}
            onChange={(e) => setText(e.target.value)}
            aria-label="IP address"
          />
        </label>
        <span className={net.mono}>
          / <b style={{ color: 'var(--accent)' }}>{len}</b>
        </span>
      </div>
      <Controls>
        <Slider label="/x (จำนวนบิต subnet)" value={len} min={8} max={32} step={1} onChange={setLen} />
        <Slider label="ยืมบิตแบ่งต่อ k" value={k} min={0} max={maxBorrow} step={1} onChange={setBorrow} />
      </Controls>
      <div className={net.label}>IP (ฐาน 2)</div>
      <Bits bits={ipToBits(ip)} cls={(i) => (i < len ? net.netBit : i < subLen ? net.badBit : net.hostBit)} />
      <div className={net.label}>Subnet mask = {ipToString(maskOf(len))}</div>
      <Bits bits={ipToBits(maskOf(len))} cls={(i) => (i < len ? net.netBit : net.dimBit)} />
      <div className={net.tblWrap}>
        <table className={net.tbl}>
          <tbody>
            <tr>
              <th>จำนวน address</th>
              <td>
                2<sup>32−{len}</sup> = 2<sup>{32 - len}</sup> = <b>{fmtCount(total)}</b>
                {total > 2 && <span className="small"> (host ใช้ได้ {fmtCount(total - 2)} ถ้าไม่นับ network/broadcast)</span>}
              </td>
            </tr>
            <tr>
              <th>Network address</th>
              <td className={net.mono}>
                {ipToString(net0)}/{len}
              </td>
            </tr>
            <tr>
              <th>ช่วง address</th>
              <td className={net.mono}>
                {ipToString(net0)} – {ipToString(bc)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {k > 0 && (
        <>
          <div className={net.label}>
            แบ่ง /{len} เป็น 2<sup>{k}</sup> = {2 ** k} ก้อน ก้อนละ /{subLen} ({fmtCount(2 ** (32 - subLen))} address) · บิตที่ยืม = สีส้ม
          </div>
          <div className={net.tblWrap}>
            <table className={net.tbl}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Block</th>
                  <th>บิตที่ยืม</th>
                  <th>ช่วง</th>
                </tr>
              </thead>
              <tbody>
                {subs.slice(0, 16).map((a, i) => (
                  <tr key={i}>
                    <td className={net.num}>{i}</td>
                    <td className={net.mono}>
                      {ipToString(a)}/{subLen}
                    </td>
                    <td className={net.mono}>{i.toString(2).padStart(k, '0')}</td>
                    <td className={net.mono}>
                      {ipToString(a)} – {ipToString(broadcastOf(a, subLen))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {subs.length > 16 && <p className="small">… แสดง 16 ก้อนแรกจาก {subs.length}</p>}
        </>
      )}
      <Readout>
        {k > 0 ? (
          <>
            ISP ประกาศแค่ <b>{ipToString(net0)}/{len}</b> บรรทัดเดียวก็ครอบทั้ง {2 ** k} ก้อน = <b>route aggregation</b>
          </>
        ) : (
          <>
            /{len} → subnet part {len} บิต, host part <b>{32 - len}</b> บิต → {fmtCount(total)} address
          </>
        )}
      </Readout>
    </Widget>
  )
}
