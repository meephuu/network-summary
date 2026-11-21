import { useEffect, useMemo, useRef, useState } from 'react'
import { ButtonRow, Readout, Widget } from '../interactive/Widget'
import { Seg, StepNote, Stepper, net } from './parts'

type Hop = 'x' | 'y' | 'z'
interface St {
  who: 'start' | 'y' | 'z'
  Dy: number
  ny: Hop
  Dz: number
  nz: Hop
}

const C_YZ = 1
const C_XZ = 50

/**
 * x — y — z triangle from the slides: c(x,y)=4, c(y,z)=1, c(x,z)=50.
 * y notices the change first, then y and z take turns updating. With poisoned reverse a node that routes
 * through its neighbour tells that neighbour its distance is ∞.
 */
function simulate(newXY: number, poison: boolean): St[] {
  let s: St = { who: 'start', Dy: 4, ny: 'x', Dz: 5, nz: 'y' }
  const out = [s]
  let quiet = 0
  for (let k = 0; k < 200 && quiet < 2; k++) {
    const yTurn = k % 2 === 0
    let n: St
    if (yTurn) {
      const heardZ = poison && s.nz === 'y' ? Infinity : s.Dz
      const viaX = newXY
      const viaZ = C_YZ + heardZ
      n = viaX <= viaZ ? { ...s, who: 'y', Dy: viaX, ny: 'x' } : { ...s, who: 'y', Dy: viaZ, ny: 'z' }
    } else {
      const heardY = poison && s.ny === 'z' ? Infinity : s.Dy
      const viaX = C_XZ
      const viaY = C_YZ + heardY
      n = viaY < viaX ? { ...s, who: 'z', Dz: viaY, nz: 'y' } : { ...s, who: 'z', Dz: viaX, nz: 'x' }
    }
    quiet = n.Dy === s.Dy && n.Dz === s.Dz && n.ny === s.ny && n.nz === s.nz ? quiet + 1 : 0
    if (quiet < 2) out.push(n)
    s = n
  }
  // drop the trailing no-change update, keep one to show "nothing changes → stop"
  return out
}

const f = (d: number) => (Number.isFinite(d) ? String(d) : '∞')

export function CountToInfinity() {
  const [scen, setScen] = useState<'good' | 'bad'>('bad')
  const [poison, setPoison] = useState(false)
  const [step, setStep] = useState(0)
  const newXY = scen === 'good' ? 1 : 60
  const st = useMemo(() => simulate(newXY, poison), [newXY, poison])
  const max = st.length - 1
  const k = Math.min(step, max)
  const s = st[k]
  const tblRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = tblRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [k, scen, poison])

  // little chart of Dy(x), Dz(x)
  const W = 560
  const H = 120
  const yMax = Math.max(62, ...st.map((q) => q.Dy), ...st.map((q) => q.Dz))
  const X = (i: number) => 30 + (i / Math.max(1, max)) * (W - 40)
  const Y = (v: number) => H - 14 - (v / yMax) * (H - 26)
  const line = (key: 'Dy' | 'Dz') =>
    st
      .slice(0, k + 1)
      .map((q, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(q[key]).toFixed(1)}`)
      .join(' ')

  const tri = { x: [70, 60], y: [300, 60], z: [185, 150] } as Record<Hop, [number, number]>
  const edge = (a: Hop, b: Hop, label: string, hot?: boolean) => (
    <g>
      <line x1={tri[a][0]} y1={tri[a][1]} x2={tri[b][0]} y2={tri[b][1]} stroke={hot ? 'var(--warn)' : 'var(--border)'} strokeWidth={2.5} />
      <text x={(tri[a][0] + tri[b][0]) / 2} y={(tri[a][1] + tri[b][1]) / 2 - 6} textAnchor="middle" fontSize={13} fill={hot ? 'var(--warn)' : 'var(--muted)'}>
        {label}
      </text>
    </g>
  )

  return (
    <Widget title="Good news travels fast, bad news travels slow" hint="เปลี่ยน c(x,y) แล้วไล่การอัปเดตของ y กับ z ทีละครั้ง ลองเปิด poisoned reverse ดูว่าแก้ count-to-infinity ได้อย่างไร">
      <ButtonRow>
        <Seg
          value={scen}
          onChange={(v) => (setScen(v), setStep(0))}
          options={[
            ['good', 'good news: 4 → 1'],
            ['bad', 'bad news: 4 → 60'],
          ]}
        />
        <label>
          <input type="checkbox" checked={poison} onChange={(e) => (setPoison(e.target.checked), setStep(0))} /> poisoned reverse
        </label>
      </ButtonRow>
      <Stepper
        step={k}
        max={max}
        onStep={(n) => setStep(Math.max(0, Math.min(max, n)))}
        nextLabel="อัปเดตถัดไป ▶"
        extra={
          <button className={net.stepBtn} onClick={() => setStep(max)}>
            ข้ามไปจนจบ ⏭
          </button>
        }
      />
      <div className={net.twoCol}>
        <svg className={net.svg} viewBox="0 0 370 190" role="img" aria-label="สามเหลี่ยม x y z" style={{ maxWidth: 380 }}>
          {edge('x', 'y', `c(x,y) = ${k === 0 ? 4 : newXY}`, k > 0)}
          {edge('y', 'z', 'c(y,z) = 1')}
          {edge('x', 'z', 'c(x,z) = 50')}
          {(['x', 'y', 'z'] as Hop[]).map((n) => (
            <g key={n}>
              <circle cx={tri[n][0]} cy={tri[n][1]} r={20} fill={s.who === n ? 'var(--accent)' : 'var(--surface-2)'} stroke="var(--muted)" />
              <text x={tri[n][0]} y={tri[n][1] + 6} textAnchor="middle" fontSize={17} fontWeight={700} fill={s.who === n ? '#050505' : 'var(--text)'}>
                {n}
              </text>
            </g>
          ))}
          <text x={300} y={26} textAnchor="middle" fontSize={12.5} fill="var(--text)" fontFamily="var(--font-mono)">
            Dy(x)={f(s.Dy)} via {s.ny}
          </text>
          <text x={185} y={184} textAnchor="middle" fontSize={12.5} fill="var(--text)" fontFamily="var(--font-mono)">
            Dz(x)={f(s.Dz)} via {s.nz}
          </text>
        </svg>
        <div>
          <svg className={net.svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="กราฟ Dy(x) และ Dz(x)">
            <line x1={30} x2={W - 10} y1={Y(50)} y2={Y(50)} stroke="var(--border)" strokeDasharray="3 4" />
            <text x={26} y={Y(50) + 4} fontSize={10} textAnchor="end" fill="var(--muted)">
              50
            </text>
            <text x={26} y={Y(0) + 4} fontSize={10} textAnchor="end" fill="var(--muted)">
              0
            </text>
            <path d={line('Dy')} fill="none" stroke="var(--def)" strokeWidth={2} />
            <path d={line('Dz')} fill="none" stroke="var(--ex)" strokeWidth={2} />
          </svg>
          <p className="small" style={{ margin: 0 }}>
            <span style={{ color: 'var(--def)' }}>— Dy(x)</span> · <span style={{ color: 'var(--ex)' }}>— Dz(x)</span> · อัปเดตไปแล้ว {k}/{max} ครั้ง
          </p>
        </div>
      </div>
      <div ref={tblRef} className={net.tblWrap} style={{ maxHeight: 210, overflowY: 'auto' }}>
        <table className={net.tbl}>
          <thead>
            <tr>
              <th>#</th>
              <th>ใครอัปเดต</th>
              <th>Dy(x)</th>
              <th>Dz(x)</th>
            </tr>
          </thead>
          <tbody>
            {st.slice(0, k + 1).map((q, i) => (
              <tr key={i} className={i === k ? net.rowHit : undefined}>
                <td className={net.num}>{i}</td>
                <td>{q.who === 'start' ? 'ก่อนเปลี่ยน' : q.who}</td>
                <td className={net.mono}>
                  {f(q.Dy)} via {q.ny}
                </td>
                <td className={net.mono}>
                  {f(q.Dz)} via {q.nz}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <StepNote>
        {k === 0 && <>ก่อนเปลี่ยน: y ไป x ตรง (4), z ไป x ผ่าน y (1+4 = 5)</>}
        {k > 0 && s.who === 'y' && (
          <>
            y คำนวณ: min( c(y,x) = {newXY}, 1 + {poison && st[k - 1].nz === 'y' ? '∞ (z โกหกว่า ∞ เพราะ z ไปผ่าน y)' : `Dz(x) ที่ z บอก = ${f(st[k - 1].Dz)}`} ) = <b>{f(s.Dy)}</b>
          </>
        )}
        {k > 0 && s.who === 'z' && (
          <>
            z คำนวณ: min( c(z,x) = 50, 1 + {poison && st[k - 1].ny === 'z' ? '∞ (poisoned)' : `Dy(x) = ${f(st[k - 1].Dy)}`} ) = <b>{f(s.Dz)}</b>
          </>
        )}
        {k === max && k > 0 && <> · ไม่มีอะไรเปลี่ยนแล้ว หยุด</>}
      </StepNote>
      <Readout>
        {scen === 'good' ? (
          <>ข่าวดี (cost ลด) กระจายเร็ว: มีการเปลี่ยนค่าแค่ {max - 1} ครั้งก็นิ่ง</>
        ) : poison ? (
          <>poisoned reverse: z ที่ไปผ่าน y บอก y ว่า "ไป x = ∞" → y ไม่วนกลับมาใช้ทางของ z → นิ่งหลังเปลี่ยนค่า <b>{max - 1}</b> ครั้ง (ได้ผลเฉพาะ loop 2 node)</>
        ) : (
          <>
            ข่าวร้าย (cost เพิ่ม) → y กับ z อ้างทางของกันและกัน ค่าเพิ่มทีละ 1 = <b>count-to-infinity</b> ต้องเปลี่ยนค่า <b>{max - 1}</b> ครั้งกว่าจะนิ่ง (ระหว่างนั้นเกิด routing loop)
          </>
        )}
      </Readout>
    </Widget>
  )
}
