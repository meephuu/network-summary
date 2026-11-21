import { useState } from 'react'
import { ButtonRow, Readout, Widget } from '../interactive/Widget'
import { Bits, Seg, net } from './parts'

/** 1D: slide data 0111000110101011 + even parity bit. 2D: slide 3×5 block with row/column parity. */
const D1 = '0111000110101011'
const P1 = String(D1.split('').filter((b) => b === '1').length % 2)
const GRID = ['10101', '11110', '01110'].map((r) => r + String(r.split('').filter((b) => b === '1').length % 2))
const colPar = Array.from({ length: 6 }, (_, c) => String(GRID.reduce((a, r) => a ^ +r[c], 0))).join('')
const FULL = [...GRID, colPar] // 4 rows × 6 cols, last row / last col = parity

export function ParityDemo() {
  const [mode, setMode] = useState<'1d' | '2d'>('2d')
  const [flip1, setFlip1] = useState<Set<number>>(new Set())
  const [flip2, setFlip2] = useState<Set<string>>(new Set())

  const toggle1 = (i: number) =>
    setFlip1((s) => {
      const n = new Set(s)
      n.has(i) ? n.delete(i) : n.add(i)
      return n
    })
  const toggle2 = (k: string) =>
    setFlip2((s) => {
      const n = new Set(s)
      n.has(k) ? n.delete(k) : n.add(k)
      return n
    })

  // ---------- 1D ----------
  const sent1 = D1 + P1
  const recv1 = sent1
    .split('')
    .map((b, i) => (flip1.has(i) ? (b === '1' ? '0' : '1') : b))
    .join('')
  const ok1 = recv1.split('').filter((b) => b === '1').length % 2 === 0

  // ---------- 2D ----------
  const cell = (r: number, c: number) => (+FULL[r][c] ^ (flip2.has(`${r},${c}`) ? 1 : 0)) as 0 | 1
  const badRows = [0, 1, 2, 3].filter((r) => [0, 1, 2, 3, 4, 5].reduce((a, c) => a ^ cell(r, c), 0) === 1)
  const badCols = [0, 1, 2, 3, 4, 5].filter((c) => [0, 1, 2, 3].reduce((a, r) => a ^ cell(r, c), 0) === 1)
  const fixable = badRows.length === 1 && badCols.length === 1

  return (
    <Widget title="Parity checking" hint="กดที่บิตเพื่อจำลองว่าบิตนั้นผิดระหว่างทาง แล้วดูว่าฝั่งรับตรวจเจอ / แก้ได้ไหม">
      <ButtonRow>
        <Seg
          value={mode}
          onChange={setMode}
          options={[
            ['1d', 'Single bit parity'],
            ['2d', 'Two-dimensional parity'],
          ]}
        />
        <button onClick={() => (setFlip1(new Set()), setFlip2(new Set()))}>ล้าง error</button>
      </ButtonRow>

      {mode === '1d' ? (
        <>
          <div className={net.label}>บิตที่ฝั่งรับได้ (d data bits + parity bit) — กดเพื่อพลิก</div>
          <Bits
            bits={recv1}
            group={0}
            onClick={toggle1}
            cls={(i) => (flip1.has(i) ? net.badBit : i === D1.length ? net.netBit : undefined)}
          />
          <Readout>
            ผิด {flip1.size} บิต · จำนวนเลข 1 ทั้งหมด = {recv1.split('').filter((b) => b === '1').length} ({ok1 ? 'คู่' : 'คี่'}) →{' '}
            {ok1 ? (
              flip1.size ? (
                <b style={{ color: 'var(--warn)' }}>ตรวจไม่เจอ! (ผิดเป็นจำนวนคู่ parity เท่าเดิม)</b>
              ) : (
                <b>ไม่มี error</b>
              )
            ) : (
              <b>เจอ error</b>
            )}
            {!ok1 && ' แต่ไม่รู้ว่าบิตไหน จึงแก้ไม่ได้'}
          </Readout>
        </>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 36px)', gap: 4, margin: '10px 0', justifyContent: 'start' }}>
            {FULL.map((row, r) => (
              <div key={r} style={{ display: 'contents' }}>
                {row.split('').map((_, c) => {
                  const k = `${r},${c}`
                  const parity = r === 3 || c === 5
                  const hit = fixable && badRows[0] === r && badCols[0] === c
                  return (
                    <button
                      key={k}
                      onClick={() => toggle2(k)}
                      className={net.mono}
                      style={{
                        height: 34,
                        borderRadius: 7,
                        cursor: 'pointer',
                        fontSize: 15,
                        fontWeight: 600,
                        border: hit ? '2px solid var(--warn)' : '1px solid var(--border)',
                        background: flip2.has(k)
                          ? 'color-mix(in srgb, var(--warn) 30%, transparent)'
                          : badRows.includes(r) || badCols.includes(c)
                            ? 'color-mix(in srgb, var(--warn) 9%, var(--surface))'
                            : parity
                              ? 'color-mix(in srgb, var(--def) 14%, var(--surface))'
                              : 'var(--surface)',
                        color: parity ? 'var(--def)' : 'var(--text)',
                      }}
                    >
                      {cell(r, c)}
                    </button>
                  )
                })}
                <span style={{ alignSelf: 'center', fontSize: 12, color: badRows.includes(r) ? 'var(--warn)' : 'var(--muted)' }}>{badRows.includes(r) ? '✗ แถว' : r === 3 ? '' : '✓'}</span>
              </div>
            ))}
            {[0, 1, 2, 3, 4, 5].map((c) => (
              <span key={c} style={{ textAlign: 'center', fontSize: 12, color: badCols.includes(c) ? 'var(--warn)' : 'var(--muted)' }}>
                {badCols.includes(c) ? '✗' : '✓'}
              </span>
            ))}
          </div>
          <p className="small" style={{ margin: 0 }}>
            สีเหลือง = parity bit (คอลัมน์ขวา = row parity, แถวล่าง = column parity) · even parity
          </p>
          <ButtonRow>
            {fixable && <button onClick={() => toggle2(`${badRows[0]},${badCols[0]}`)}>แก้บิตที่ผิดให้ ✓</button>}
          </ButtonRow>
          <Readout>
            {flip2.size === 0 && <>ทุกแถวและทุกคอลัมน์ parity ถูก → ไม่มี error</>}
            {fixable && (
              <>
                แถว {badRows[0] + 1} กับคอลัมน์ {badCols[0] + 1} parity ผิด → จุดตัด = บิตที่ผิด <b>แก้เองได้โดยไม่ต้องส่งใหม่</b>
              </>
            )}
            {flip2.size > 0 && !fixable && (badRows.length || badCols.length) > 0 && (
              <>
                parity ผิด {badRows.length} แถว {badCols.length} คอลัมน์ → <b>ตรวจเจอ</b> แต่ระบุตำแหน่งไม่ได้แน่ชัด แก้เองไม่ได้
              </>
            )}
            {flip2.size > 0 && badRows.length === 0 && badCols.length === 0 && (
              <b style={{ color: 'var(--warn)' }}>error {flip2.size} บิตที่ทุกแถว/คอลัมน์ยังคู่ → ตรวจไม่เจอ (เกิดได้แต่ยากมาก)</b>
            )}
          </Readout>
        </>
      )}
    </Widget>
  )
}
