import { useState } from 'react'
import { ButtonRow, Readout, Widget } from '../interactive/Widget'
import { Bits, net } from './parts'

const SLIDE: [number, number] = [0b1110011001100110, 0b1101010101010101]

/** Internet checksum of two 16-bit words: one's-complement sum with wraparound, then invert. */
export function ChecksumCalc() {
  const [w, setW] = useState<[number, number]>(SLIDE)
  const flip = (k: 0 | 1) => (i: number) => setW((x) => (k === 0 ? [x[0] ^ (1 << (15 - i)), x[1]] : [x[0], x[1] ^ (1 << (15 - i))]))
  const raw = w[0] + w[1]
  const carry = raw > 0xffff
  const sum = carry ? (raw & 0xffff) + 1 : raw
  const sum16 = sum & 0xffff // (+1 can't overflow again for two words except 0xffff+0xffff → 0x1fffe → 0xffff)
  const checksum = ~sum16 & 0xffff
  const b16 = (n: number) => n.toString(2).padStart(16, '0')
  const rowStyle = { display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center', gap: 8 } as const

  return (
    <Widget title="Internet checksum" hint="กดที่บิตของเลข 2 ตัวบนเพื่อแก้ค่า ดูผลบวกแบบ one's complement (ตัวทดที่ล้นวนกลับมาบวกที่บิตล่างสุด)">
      <ButtonRow>
        <button onClick={() => setW(SLIDE)}>ตัวอย่างสไลด์</button>
        <button onClick={() => setW([0b0110011001100000, 0b0101010101010101])}>ไม่มีตัวทด</button>
      </ButtonRow>
      <div style={{ display: 'grid', gap: 2, overflowX: 'auto' }}>
        <div style={rowStyle}>
          <span className="small">เลขตัวที่ 1</span>
          <Bits bits={' ' + b16(w[0])} group={0} onClick={(i) => i > 0 && flip(0)(i - 1)} />
        </div>
        <div style={rowStyle}>
          <span className="small">เลขตัวที่ 2</span>
          <Bits bits={' ' + b16(w[1])} group={0} onClick={(i) => i > 0 && flip(1)(i - 1)} />
        </div>
        <div style={{ ...rowStyle, borderTop: '1px solid var(--border)', paddingTop: 2 }}>
          <span className="small">ผลบวก 17 บิต</span>
          <Bits bits={raw.toString(2).padStart(17, '0')} group={0} cls={(i) => (i === 0 ? (carry ? net.badBit : net.dimBit) : undefined)} />
        </div>
        {carry && (
          <div style={rowStyle}>
            <span className="small">wraparound: เอา 1 ไปบวก</span>
            <Bits bits={' ' + b16(sum16)} group={0} cls={(i) => (i ? net.netBit : undefined)} />
          </div>
        )}
        <div style={rowStyle}>
          <span className="small">checksum (กลับบิต)</span>
          <Bits bits={' ' + b16(checksum)} group={0} cls={(i) => (i ? net.hostBit : undefined)} />
        </div>
      </div>
      <Readout>
        sum = <b>{b16(sum16).replace(/(.{4})/g, '$1 ').trim()}</b> → checksum = <b>{b16(checksum).replace(/(.{4})/g, '$1 ').trim()}</b>
        <div className="small">ฝั่งรับบวกข้อมูลทั้งหมดใหม่แล้วเทียบ: ไม่เท่า = มี error · เท่า = ไม่เจอ error (แต่อาจยังมีอยู่)</div>
      </Readout>
    </Widget>
  )
}
