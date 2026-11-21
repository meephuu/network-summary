import { useMemo, useState } from 'react'
import { ButtonRow, Readout, Widget } from '../interactive/Widget'
import { Seg, StepNote, Stepper, net } from './parts'

const IDS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']
/** 3×3 grid from the slides: every link costs 1 except a–b = 8, and there is no c–f link. */
const LINKS: [string, string, number][] = [
  ['a', 'b', 8],
  ['b', 'c', 1],
  ['a', 'd', 1],
  ['b', 'e', 1],
  ['d', 'e', 1],
  ['e', 'f', 1],
  ['d', 'g', 1],
  ['e', 'h', 1],
  ['f', 'i', 1],
  ['g', 'h', 1],
  ['h', 'i', 1],
]
const POS: Record<string, [number, number]> = Object.fromEntries(IDS.map((id, k) => [id, [70 + (k % 3) * 150, 50 + Math.floor(k / 3) * 120]]))
const nbrs = (x: string) => LINKS.filter(([a, b]) => a === x || b === x).map(([a, b, c]) => [a === x ? b : a, c] as [string, number])

type DV = Record<string, Record<string, number>>

/** Synchronous rounds: at t+1 every node recomputes from its neighbours' vectors at t. */
function rounds(): DV[] {
  const t0: DV = {}
  for (const x of IDS) {
    t0[x] = Object.fromEntries(IDS.map((y) => [y, y === x ? 0 : Infinity]))
    for (const [n, c] of nbrs(x)) t0[x][n] = c
  }
  const out = [t0]
  for (let t = 0; t < 12; t++) {
    const prev = out[out.length - 1]
    const next: DV = {}
    for (const x of IDS) {
      next[x] = {}
      for (const y of IDS) next[x][y] = y === x ? 0 : Math.min(...nbrs(x).map(([v, c]) => c + prev[v][y]))
    }
    const same = IDS.every((x) => IDS.every((y) => next[x][y] === prev[x][y]))
    if (same) break
    out.push(next)
  }
  return out
}

const f = (d: number) => (Number.isFinite(d) ? String(d) : '∞')

export function DvGrid() {
  const all = useMemo(rounds, [])
  const [t, setT] = useState(0)
  const [me, setMe] = useState('b')
  const [track, setTrack] = useState('c')
  const max = all.length // last index = converged + 1 "done" view
  const tt = Math.min(t, all.length - 1)
  const cur = all[tt]
  const prev = all[Math.max(0, tt - 1)]
  const knows = (x: string) => Number.isFinite(cur[x][track])

  return (
    <Widget
      title="Distance vector บนกริด 3×3"
      hint="ทุก t ทุก node รับ DV ของเพื่อนบ้านจากรอบก่อน แล้วคำนวณ Dₓ(y) = minᵥ{c(x,v) + Dᵥ(y)} พร้อมกัน · กดที่ node เพื่อดูตารางของมัน"
    >
      <Stepper step={t} max={max - 1} onStep={(n) => setT(Math.max(0, Math.min(max - 1, n)))} nextLabel="t + 1 ▶" />
      <ButtonRow>
        <span className="small">ระบายสี node ที่รู้ทางไป:</span>
        <Seg value={track} onChange={setTrack} options={IDS.map((x) => [x, x] as [string, string])} />
      </ButtonRow>
      <div className={net.twoCol}>
        <svg className={net.svg} viewBox="0 0 440 330" role="img" aria-label="กริด 3x3" style={{ maxWidth: 440 }}>
          {LINKS.map(([a, b, c]) => {
            const [x1, y1] = POS[a]
            const [x2, y2] = POS[b]
            return (
              <g key={a + b}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c > 1 ? 'var(--warn)' : 'var(--border)'} strokeWidth={2} />
                <text x={(x1 + x2) / 2 + (x1 === x2 ? 10 : 0)} y={(y1 + y2) / 2 + (y1 === y2 ? -7 : 4)} fontSize={12} fill={c > 1 ? 'var(--warn)' : 'var(--muted)'} textAnchor="middle">
                  {c}
                </text>
              </g>
            )
          })}
          {IDS.map((x) => {
            const [cx, cy] = POS[x]
            const k = knows(x)
            return (
              <g key={x} onClick={() => setMe(x)} style={{ cursor: 'pointer' }}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={20}
                  fill={k ? 'var(--accent)' : 'var(--surface-2)'}
                  stroke={x === me ? 'var(--text)' : k ? 'var(--accent)' : 'var(--muted)'}
                  strokeWidth={x === me ? 3 : 1.5}
                />
                <text x={cx} y={cy + 5} textAnchor="middle" fontSize={16} fontWeight={700} fill={k ? '#050505' : 'var(--text)'}>
                  {x}
                </text>
                {x !== track && (
                  <text x={cx + 24} y={cy - 16} fontSize={11.5} fill="var(--muted)" fontFamily="var(--font-mono)">
                    {f(cur[x][track])}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
        <div>
          <div className={net.label}>
            ตารางของ {me} ที่ t = {tt}
          </div>
          <div className={net.tblWrap}>
            <table className={net.tbl}>
              <thead>
                <tr>
                  <th>ปลายทาง</th>
                  {tt > 0 &&
                    nbrs(me).map(([v, c]) => (
                      <th key={v}>
                        ผ่าน {v} ({c}+D<sub>{v}</sub>)
                      </th>
                    ))}
                  <th>
                    D<sub>{me}</sub>
                  </th>
                </tr>
              </thead>
              <tbody>
                {IDS.filter((y) => y !== me).map((y) => {
                  const changed = tt > 0 && cur[me][y] !== prev[me][y]
                  return (
                    <tr key={y} className={changed ? net.rowHit : undefined}>
                      <td>{y}</td>
                      {tt > 0 &&
                        nbrs(me).map(([v, c]) => {
                          const val = c + prev[v][y]
                          return (
                            <td key={v} className={net.num} style={val === cur[me][y] && Number.isFinite(val) ? { color: 'var(--accent)' } : undefined}>
                              {f(val)}
                            </td>
                          )
                        })}
                      <td className={net.num}>
                        <b>{f(cur[me][y])}</b>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <StepNote>
        {tt === 0 ? (
          <>t = 0: ทุก node รู้แค่ cost ไปเพื่อนบ้าน (ที่เหลือ ∞) แล้วส่ง DV ให้เพื่อนบ้าน</>
        ) : (
          <>
            t = {tt}: ข้อมูลของ <b>{track}</b> กระจายไปถึง {IDS.filter(knows).length}/9 node แล้ว (ไปได้ทีละ 1 hop ต่อรอบ)
            {tt === all.length - 1 && <> · <b>converge แล้ว</b> รอบถัดไปไม่มีค่าไหนเปลี่ยน ทุก node หยุดเอง (self-stopping)</>}
          </>
        )}
      </StepNote>
      <Readout>
        ตัวเลขข้าง node = ระยะไป {track} ที่ node นั้นรู้ตอนนี้ · แถวไฮไลต์ในตาราง = ค่าที่เปลี่ยนรอบนี้ (สีเหลือง = เพื่อนบ้านที่ให้ค่า min = next hop)
      </Readout>
    </Widget>
  )
}
