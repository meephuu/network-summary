import { useState, type ReactNode } from 'react'
import { mod2Divide } from '../../lib/net'
import { ButtonRow, Readout, Widget } from '../interactive/Widget'
import { Bits, net } from './parts'

const PRESETS: [string, string, string][] = [
  ['สไลด์: D=101110, G=1001', '101110', '1001'],
  ['สไลด์ 18–20: D=100100, G=1101', '100100', '1101'],
  ['G ยาว 5 บิต (r=4)', '1101011011', '10011'],
]
const isBits = (s: string) => /^[01]+$/.test(s)

/** One line of the long division: `text` placed from column `at`, padded to `width` columns. */
function Line({ at, text, width, cls, label }: { at: number; text: string; width: number; cls?: (i: number) => string | undefined; label?: ReactNode }) {
  const full = ' '.repeat(at) + text + ' '.repeat(Math.max(0, width - at - text.length))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Bits bits={full} group={0} cls={(i) => (i >= at && i < at + text.length ? cls?.(i - at) : undefined)} />
      {label && <span className="small">{label}</span>}
    </div>
  )
}

/** CRC: sender divides D·2^r by G (mod 2, XOR), remainder R is appended; receiver checks the remainder is 0. */
export function CrcCalc() {
  const [d, setD] = useState('101110')
  const [g, setG] = useState('1001')
  const [flips, setFlips] = useState<Set<number>>(new Set())
  const ok = isBits(d) && isBits(g) && g.length >= 2 && g[0] === '1' && d.length <= 24 && g.length <= 9
  const r = g.length - 1
  const div = ok ? mod2Divide(d + '0'.repeat(r), g) : null
  const R = div?.remainder ?? ''
  const sent = d + R
  const recv = sent
    .split('')
    .map((b, i) => (flips.has(i) ? (b === '1' ? '0' : '1') : b))
    .join('')
  const check = ok ? mod2Divide(recv, g).remainder : ''
  const width = d.length + r
  const quotient = div ? div.steps.map((s) => s.window[0]).join('') : ''

  return (
    <Widget title="CRC calculator (หารแบบ modulo-2)" hint="ใส่ D กับ G แล้วดูการหารทีละขั้น (บิตนำเป็น 1 → XOR ด้วย G, เป็น 0 → XOR ด้วย 000…) จากนั้นลองพลิกบิตฝั่งรับดูว่าเศษไม่เป็น 0">
      <ButtonRow>
        {PRESETS.map(([n, dd, gg]) => (
          <button key={n} onClick={() => (setD(dd), setG(gg), setFlips(new Set()))}>
            {n}
          </button>
        ))}
      </ButtonRow>
      <div className={net.inputs}>
        <label>
          D
          <input type="text" value={d} size={14} className={isBits(d) && d.length <= 24 ? undefined : net.bad} onChange={(e) => (setD(e.target.value.trim()), setFlips(new Set()))} />
        </label>
        <label>
          G
          <input type="text" value={g} size={8} className={isBits(g) && g[0] === '1' && g.length <= 9 ? undefined : net.bad} onChange={(e) => (setG(e.target.value.trim()), setFlips(new Set()))} />
        </label>
        <span className="small">r = {Math.max(0, r)} → เติม 0 ต่อท้าย {Math.max(0, r)} ตัว</span>
      </div>
      {!ok && <p className="small">ใส่เฉพาะ 0/1 · G ขึ้นต้นด้วย 1 ยาว 2–9 บิต · D ไม่เกิน 24 บิต</p>}
      {div && (
        <div style={{ overflowX: 'auto', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', margin: '8px 0' }}>
          <Line at={r} text={quotient} width={width} cls={() => net.dimBit} label="← ผลหาร (ไม่ได้ใช้)" />
          <Line at={0} text={d + '0'.repeat(r)} width={width} cls={(i) => (i >= d.length ? net.netBit : undefined)} label={<>D·2<sup>{r}</sup></>} />
          {div.steps.map((s, k) => {
            const last = k === div.steps.length - 1
            const next = last ? s.result.slice(1) : s.result.slice(1) + (d + '0'.repeat(r))[s.pos + r + 1]
            return (
              <div key={k}>
                <Line at={s.pos} text={s.divisor} width={width} cls={() => (s.window[0] === '1' ? net.hostBit : net.dimBit)} label={s.window[0] === '1' ? 'XOR G' : 'XOR 0…0'} />
                <Line at={s.pos + 1} text={next} width={width} cls={(i) => (last ? net.netBit : i === next.length - 1 ? net.dimBit : undefined)} label={last ? <b style={{ color: 'var(--accent)' }}>= R</b> : undefined} />
              </div>
            )
          })}
        </div>
      )}
      {div && (
        <>
          <div className={net.label}>ฝั่งรับได้ ⟨D, R⟩ — กดบิตเพื่อจำลอง error</div>
          <Bits
            bits={recv}
            group={0}
            onClick={(i) =>
              setFlips((s) => {
                const n = new Set(s)
                n.has(i) ? n.delete(i) : n.add(i)
                return n
              })
            }
            cls={(i) => (flips.has(i) ? net.badBit : i >= d.length ? net.netBit : undefined)}
          />
          <Readout>
            R = <b>{R}</b> → ส่ง <b className={net.mono}>{d} {R}</b> · ฝั่งรับหารด้วย {g} ได้เศษ <b>{check}</b> →{' '}
            {/^0+$/.test(check) ? (flips.size ? <b style={{ color: 'var(--warn)' }}>เศษ 0 ทั้งที่มี error (หลุด!)</b> : 'ไม่มี error') : <b style={{ color: 'var(--warn)' }}>เศษไม่เป็น 0 = มี error</b>}
          </Readout>
        </>
      )}
    </Widget>
  )
}
