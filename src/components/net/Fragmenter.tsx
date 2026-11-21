import { useState } from 'react'
import { Slider } from '../interactive/Slider'
import { ButtonRow, Controls, Readout, Widget } from '../interactive/Widget'
import { net } from './parts'

const HDR = 20

/** IP fragmentation: total length + MTU → fragments with length / MF flag / offset (in 8-byte units). */
export function Fragmenter() {
  const [total, setTotal] = useState(4000)
  const [mtu, setMtu] = useState(1500)
  const data = total - HDR
  const per = Math.floor((mtu - HDR) / 8) * 8 // data per fragment, multiple of 8
  const frags: { start: number; size: number }[] = []
  if (total <= mtu) frags.push({ start: 0, size: data })
  else for (let s = 0; s < data; s += per) frags.push({ start: s, size: Math.min(per, data - s) })

  return (
    <Widget title="IP fragmentation" hint="เลื่อนขนาด datagram กับ MTU ของลิงก์ แล้วดูว่าถูกหั่นเป็นกี่ fragment แต่ละชิ้นมี length / flag / offset เท่าไร">
      <ButtonRow>
        <button onClick={() => (setTotal(4000), setMtu(1500))}>สไลด์: 4000 B, MTU 1500</button>
        <button onClick={() => (setTotal(3000), setMtu(1000))}>3000 B, MTU 1000</button>
        <button onClick={() => (setTotal(5000), setMtu(1006))}>MTU−20 หาร 8 ไม่ลงตัว</button>
      </ButtonRow>
      <Controls>
        <Slider label="ขนาด datagram (bytes, รวม header)" value={total} min={200} max={9000} step={20} onChange={setTotal} />
        <Slider label="MTU (bytes)" value={mtu} min={100} max={3000} step={2} onChange={setMtu} />
      </Controls>

      {/* bar: one block per fragment, width ∝ data size */}
      <div style={{ display: 'flex', gap: 3, margin: '10px 0 4px', minHeight: 38 }}>
        {frags.map((f, i) => (
          <div
            key={i}
            style={{
              flex: `${f.size} 0 0`,
              minWidth: 18,
              display: 'flex',
              borderRadius: 7,
              overflow: 'hidden',
              border: '1px solid var(--border)',
              fontSize: 12,
            }}
            title={`fragment ${i + 1}`}
          >
            <div style={{ background: 'var(--accent)', color: '#050505', padding: '0 4px', display: 'grid', placeItems: 'center', fontWeight: 600 }}>
              H
            </div>
            <div style={{ flex: 1, background: 'color-mix(in srgb, var(--ex) 22%, transparent)', display: 'grid', placeItems: 'center', color: 'var(--ex)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {frags.length <= 12 ? `${f.size} B` : ''}
            </div>
          </div>
        ))}
      </div>
      <p className="small" style={{ margin: 0 }}>
        H = IP header 20 bytes (ต้องใส่ทุก fragment) · สีเขียว = data
      </p>

      <div className={net.tblWrap}>
        <table className={net.tbl}>
          <thead>
            <tr>
              <th>#</th>
              <th>length</th>
              <th>ID</th>
              <th>fragflag (MF)</th>
              <th>offset</th>
              <th>data byte</th>
            </tr>
          </thead>
          <tbody>
            {frags.slice(0, 12).map((f, i) => (
              <tr key={i}>
                <td className={net.num}>{i + 1}</td>
                <td className={net.num}>
                  {f.size + HDR} <span className="small">({f.size}+20)</span>
                </td>
                <td>x</td>
                <td className={net.num}>{i < frags.length - 1 ? 1 : 0}</td>
                <td className={net.num}>
                  {f.start}/8 = <b>{f.start / 8}</b>
                </td>
                <td className={net.mono}>
                  {f.start}–{f.start + f.size - 1}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {frags.length > 12 && <p className="small">… แสดง 12 ชิ้นแรกจาก {frags.length}</p>}
      <Readout>
        {total <= mtu ? (
          <>datagram เล็กกว่า MTU → ไม่ต้องหั่น</>
        ) : (
          <>
            data {data} B ÷ ชิ้นละ {per} B (= ⌊({mtu}−20)/8⌋×8) → <b>{frags.length} fragments</b>
            {(mtu - HDR) % 8 !== 0 && <> · ปัด {mtu - HDR} ลงเป็น {per} เพราะ offset นับทีละ 8 bytes</>}
          </>
        )}
      </Readout>
    </Widget>
  )
}
