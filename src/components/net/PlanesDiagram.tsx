import { useState } from 'react'
import { ButtonRow, Readout, Widget } from '../interactive/Widget'
import { Seg, net } from './parts'

/** Per-router control plane vs SDN (logically centralized) control plane. */
export function PlanesDiagram() {
  const [mode, setMode] = useState<'per' | 'sdn'>('per')
  const xs = [80, 230, 380, 530]
  const yData = 190
  return (
    <Widget title="Control plane 2 แบบ" hint="สลับดูว่าใครเป็นคนคำนวณ forwarding table">
      <ButtonRow>
        <Seg
          value={mode}
          onChange={setMode}
          options={[
            ['per', 'Per-router (ดั้งเดิม)'],
            ['sdn', 'SDN (remote controller)'],
          ]}
        />
      </ButtonRow>
      <div className={net.svgScroll}>
        <svg className={net.svg} viewBox="0 0 610 250" role="img" aria-label="แผนภาพ control plane">
          <text x={600} y={20} textAnchor="end" fontSize={12} fill="var(--accent)">
            control plane
          </text>
          <text x={600} y={242} textAnchor="end" fontSize={12} fill="var(--ex)">
            data plane
          </text>
          <line x1={10} x2={600} y1={134} y2={134} stroke="var(--border)" strokeDasharray="4 5" />
          {mode === 'sdn' && (
            <g>
              <rect x={205} y={14} width={200} height={46} rx={10} fill="color-mix(in srgb, var(--accent) 22%, var(--surface))" stroke="var(--accent)" />
              <text x={305} y={35} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--accent)">
                Remote Controller
              </text>
              <text x={305} y={51} textAnchor="middle" fontSize={11} fill="var(--muted)">
                คำนวณตารางให้ทุกตัว แล้วส่งลงไปติดตั้ง
              </text>
            </g>
          )}
          {xs.map((x, i) => (
            <g key={i}>
              {mode === 'per' ? (
                <>
                  <rect x={x - 52} y={62} width={104} height={44} rx={8} fill="color-mix(in srgb, var(--accent) 16%, var(--surface))" stroke="var(--accent)" />
                  <text x={x} y={81} textAnchor="middle" fontSize={11.5} fontWeight={600} fill="var(--accent)">
                    Routing
                  </text>
                  <text x={x} y={96} textAnchor="middle" fontSize={11.5} fontWeight={600} fill="var(--accent)">
                    Algorithm
                  </text>
                  {i < 3 && <line x1={x + 52} x2={xs[i + 1] - 52} y1={84} y2={84} stroke="var(--accent)" strokeDasharray="5 4" strokeWidth={1.6} />}
                </>
              ) : (
                <>
                  <rect x={x - 24} y={92} width={48} height={26} rx={6} fill="var(--surface-2)" stroke="var(--muted)" />
                  <text x={x} y={110} textAnchor="middle" fontSize={11.5} fill="var(--text)">
                    CA
                  </text>
                  <line x1={305} y1={60} x2={x} y2={92} stroke="var(--accent)" strokeDasharray="5 4" strokeWidth={1.5} />
                </>
              )}
              <line x1={x} x2={x} y1={mode === 'per' ? 106 : 118} y2={yData - 22} stroke="var(--muted)" />
              <rect x={x - 46} y={yData - 22} width={92} height={44} rx={10} fill="color-mix(in srgb, var(--ex) 16%, var(--surface))" stroke="var(--ex)" />
              <text x={x} y={yData - 3} textAnchor="middle" fontSize={11} fill="var(--ex)">
                forwarding
              </text>
              <text x={x} y={yData + 12} textAnchor="middle" fontSize={11} fill="var(--ex)">
                table
              </text>
              {i < 3 && <line x1={x + 46} x2={xs[i + 1] - 46} y1={yData} y2={yData} stroke="var(--ex)" strokeWidth={2.5} />}
            </g>
          ))}
        </svg>
      </div>
      <Readout>
        {mode === 'per' ? (
          <>
            <b>ทุกเราเตอร์</b> มี routing algorithm ของตัวเอง คุยกับเพื่อนบ้าน (เส้นประ) แล้วคำนวณตารางเอง เช่น OSPF, BGP
          </>
        ) : (
          <>
            <b>remote controller</b> ตัวกลางคำนวณแล้วติดตั้งตารางผ่าน control agent (CA) เราเตอร์เหลือแค่งาน data plane
          </>
        )}
      </Readout>
    </Widget>
  )
}
