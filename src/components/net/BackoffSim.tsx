import { useState } from 'react'
import { ButtonRow, Readout, Widget } from '../interactive/Widget'
import { Seg, net } from './parts'

interface Round {
  m: number
  ka: number
  kb: number
}

const RATES: [number, string][] = [
  [10e6, '10 Mbps'],
  [100e6, '100 Mbps'],
  [1e9, '1 Gbps'],
]

/** Binary exponential backoff: after the m-th collision pick K ∈ {0 … 2^m − 1}, wait K·512 bit times. */
export function BackoffSim() {
  const [rounds, setRounds] = useState<Round[]>([])
  const [rate, setRate] = useState(10e6)
  const last = rounds[rounds.length - 1]
  const done = last && last.ka !== last.kb
  const m = rounds.length + 1
  const step = () => {
    if (done) return
    const mm = Math.min(m, 10)
    const r = () => Math.floor(Math.random() * 2 ** mm)
    setRounds((rs) => [...rs, { m: mm, ka: r(), kb: r() }])
  }
  const us = (k: number) => ((k * 512) / rate) * 1e6
  const fmtUs = (x: number) => (x >= 100 ? x.toFixed(0) : x.toFixed(2))

  return (
    <Widget title="Binary exponential backoff" hint="A กับ B ส่งพร้อมกันแล้วชน กด 'สุ่ม K' ทีละรอบ ถ้าสุ่มได้ K เท่ากันจะชนอีก แล้วช่วงสุ่มกว้างขึ้นเป็น 2 เท่า">
      <ButtonRow>
        <button onClick={step} disabled={!!done} style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
          {done ? 'ส่งสำเร็จแล้ว ✓' : `ชนครั้งที่ ${m}: สุ่ม K ▶`}
        </button>
        <button onClick={() => setRounds([])}>เริ่มใหม่</button>
        <Seg value={rate} onChange={setRate} options={RATES} />
      </ButtonRow>
      <div className={net.tblWrap}>
        <table className={net.tbl}>
          <thead>
            <tr>
              <th>ชนครั้งที่ m</th>
              <th>สุ่ม K จาก</th>
              <th>K ของ A</th>
              <th>K ของ B</th>
              <th>ผล</th>
            </tr>
          </thead>
          <tbody>
            {rounds.length === 0 && (
              <tr>
                <td colSpan={5} className="small">
                  A และ B เพิ่งชนกัน ทั้งคู่หยุดส่งแล้วส่ง jam signal
                </td>
              </tr>
            )}
            {rounds.map((r, i) => (
              <tr key={i} className={r.ka !== r.kb ? net.rowWin : undefined}>
                <td className={net.num}>{r.m}</td>
                <td className={net.mono}>
                  {'{'}0..{2 ** r.m - 1}
                  {'}'}
                </td>
                <td className={net.num}>
                  {r.ka} <span className="small">({fmtUs(us(r.ka))} µs)</span>
                </td>
                <td className={net.num}>
                  {r.kb} <span className="small">({fmtUs(us(r.kb))} µs)</span>
                </td>
                <td>{r.ka === r.kb ? 'K เท่ากัน → ชนอีก' : `${r.ka < r.kb ? 'A' : 'B'} ได้ส่งก่อน`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Readout>
        หลังชนครั้งที่ m: K ∈ {'{'}0, 1, …, 2<sup>m</sup>−1{'}'} รอ <b>K·512 bit times</b> (ที่ {RATES.find((r) => r[0] === rate)![1]} 1 หน่วย = {fmtUs(us(1))} µs)
        <div className="small">ชนบ่อย = load สูง → ช่วงสุ่มกว้างขึ้นให้โอกาสชนซ้ำน้อยลง</div>
      </Readout>
    </Widget>
  )
}
