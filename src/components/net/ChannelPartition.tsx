import { useState } from 'react'
import { ButtonRow, Readout, Widget } from '../interactive/Widget'
import { Seg, net } from './parts'

const COLORS = ['#f3d98a', '#a9d99c', '#c7b5f2', '#f2a477', '#8fd3e8', '#e8a0c4']

/** TDMA / FDMA with 6 stations: slots or bands of stations with nothing to send stay idle. */
export function ChannelPartition() {
  const [active, setActive] = useState([true, false, true, true, false, false])
  const [mode, setMode] = useState<'tdma' | 'fdma'>('tdma')
  const n = active.filter(Boolean).length
  const W = 600
  return (
    <Widget title="TDMA vs FDMA" hint="กดเลือกว่า station ไหนมีของจะส่ง (สไลด์: มีแค่ 1, 3, 4) แล้วดูช่องที่ว่างเปล่า">
      <ButtonRow>
        <Seg
          value={mode}
          onChange={setMode}
          options={[
            ['tdma', 'TDMA (แบ่งเวลา)'],
            ['fdma', 'FDMA (แบ่งความถี่)'],
          ]}
        />
      </ButtonRow>
      <ButtonRow>
        <span className="small">station ที่มีของส่ง:</span>
        {active.map((on, i) => (
          <button
            key={i}
            className={net.pkt}
            onClick={() => setActive((a) => a.map((x, j) => (j === i ? !x : x)))}
            style={{ background: on ? COLORS[i] : 'transparent', color: on ? '#050505' : 'var(--muted)', borderColor: COLORS[i] }}
          >
            {i + 1}
          </button>
        ))}
      </ButtonRow>
      <div className={net.svgScroll}>
        {mode === 'tdma' ? (
          <svg className={net.svg} viewBox={`0 0 ${W} 110`} role="img" aria-label="TDMA slots">
            {[0, 1].map((round) => (
              <g key={round}>
                {active.map((on, i) => {
                  const x = 20 + round * 290 + i * 45
                  return (
                    <g key={i}>
                      <rect x={x} y={30} width={42} height={40} rx={4} fill={on ? COLORS[i] : 'transparent'} stroke={on ? COLORS[i] : 'var(--border)'} strokeDasharray={on ? undefined : '4 3'} />
                      <text x={x + 21} y={56} textAnchor="middle" fontSize={14} fontWeight={700} fill={on ? '#050505' : 'var(--muted)'}>
                        {on ? i + 1 : 'idle'}
                      </text>
                    </g>
                  )
                })}
                <text x={20 + round * 290 + 135} y={20} textAnchor="middle" fontSize={12} fill="var(--muted)">
                  6-slot frame (รอบที่ {round + 1})
                </text>
              </g>
            ))}
            <line x1={20} x2={W - 10} y1={86} y2={86} stroke="var(--muted)" />
            <text x={W - 12} y={102} textAnchor="end" fontSize={12} fill="var(--muted)">
              เวลา →
            </text>
          </svg>
        ) : (
          <svg className={net.svg} viewBox={`0 0 ${W} 190`} role="img" aria-label="FDMA bands">
            {active.map((on, i) => {
              const y = 14 + i * 27
              return (
                <g key={i}>
                  <text x={14} y={y + 16} fontSize={12} fill="var(--muted)">
                    band {i + 1}
                  </text>
                  <rect x={70} y={y} width={W - 90} height={20} rx={4} fill={on ? COLORS[i] : 'transparent'} stroke={on ? COLORS[i] : 'var(--border)'} strokeDasharray={on ? undefined : '4 3'} opacity={on ? 0.9 : 1} />
                  {!on && (
                    <text x={70 + (W - 90) / 2} y={y + 15} textAnchor="middle" fontSize={12} fill="var(--muted)">
                      idle ตลอดเวลา
                    </text>
                  )}
                </g>
              )
            })}
            <text x={W - 12} y={186} textAnchor="end" fontSize={12} fill="var(--muted)">
              เวลา →
            </text>
          </svg>
        )}
      </div>
      <Readout>
        ใช้งานจริง {n}/6 ช่อง = <b>{Math.round((100 * n) / 6)}%</b> · ถ้ามี node ส่งอยู่ตัวเดียว ก็ยังได้แค่ <b>R/6</b> ไม่ใช่ R เต็ม (ข้อเสียตอน load ต่ำ)
      </Readout>
    </Widget>
  )
}
