import { useState } from 'react'
import { Slider } from '../interactive/Slider'
import { Controls, Readout, Widget } from '../interactive/Widget'

const fmtBits = (b: number) =>
  b >= 1e9 ? `${+(b / 1e9).toFixed(2)} Gbit` : b >= 1e6 ? `${+(b / 1e6).toFixed(2)} Mbit` : `${+(b / 1e3).toFixed(1)} kbit`

/** RFC 3439 rule of thumb vs the newer RTT·C/√N recommendation. */
export function BufferCalc() {
  const [rtt, setRtt] = useState(250)
  const [c, setC] = useState(10)
  const [logN, setLogN] = useState(0)
  const N = Math.round(10 ** logN)
  const base = (rtt / 1000) * c * 1e9
  return (
    <Widget title="ควรมี buffer เท่าไหร่" hint="RTT × C คือ buffer แบบดั้งเดิม ถ้ามีหลาย flow ใช้ RTT × C / √N ได้ ลองเพิ่ม N ดูว่า buffer ที่ต้องการลดลงแค่ไหน">
      <Controls>
        <Slider label="RTT (ms)" value={rtt} min={10} max={500} step={10} onChange={setRtt} />
        <Slider label="C (Gbps)" value={c} min={1} max={100} step={1} onChange={setC} />
        <Slider label="log₁₀ N (จำนวน flow)" value={logN} min={0} max={4} step={0.25} onChange={setLogN} />
      </Controls>
      <Readout>
        RTT × C = {rtt / 1000} s × {c} Gbps = <b>{fmtBits(base)}</b>
        <br />
        N = {N.toLocaleString()} flows → (RTT × C)/√N = <b>{fmtBits(base / Math.sqrt(N))}</b>
      </Readout>
    </Widget>
  )
}
