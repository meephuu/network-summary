import { useState, type ReactNode } from 'react'
import styles from './FloatingPanel.module.css'

/* Building blocks for panel tabs: a note line, a small calculator row, a number input and a
 * table that highlights the row/column under the mouse. See statTables.tsx for real use. */

export function Note({ children }: { children: ReactNode }) {
  return <p className={styles.note}>{children}</p>
}

export function NumInput({ label, value, onChange, step = 0.01, min, max }: {
  label: ReactNode
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : ''}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value === '' ? NaN : +e.target.value)}
      />
    </label>
  )
}

export const f4 = (v: number) => (Number.isFinite(v) ? (v < 0.0001 ? '< 0.0001' : v.toFixed(4)) : '–')

/** Table with row/column highlight on hover. */
export function Grid({ corner, cols, colsSub, rows }: {
  corner: ReactNode
  cols: ReactNode[]
  colsSub?: ReactNode[]
  rows: { label: ReactNode; cells: string[]; strong?: boolean }[]
}) {
  const [hover, setHover] = useState<[number, number] | null>(null)
  return (
    <div className={styles.gridWrap}>
      <table className={styles.grid} onMouseLeave={() => setHover(null)}>
        <thead>
          <tr>
            <th className={styles.corner} rowSpan={colsSub ? 2 : 1}>
              {corner}
            </th>
            {cols.map((c, j) => (
              <th key={j} className={hover?.[1] === j ? styles.hl : undefined}>
                {c}
              </th>
            ))}
          </tr>
          {colsSub && (
            <tr className={styles.subHead}>
              {colsSub.map((c, j) => (
                <th key={j} className={hover?.[1] === j ? styles.hl : undefined}>
                  {c}
                </th>
              ))}
            </tr>
          )}
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={r.strong ? styles.strongRow : undefined}>
              <th className={hover?.[0] === i ? styles.hl : undefined}>{r.label}</th>
              {r.cells.map((v, j) => (
                <td
                  key={j}
                  onMouseEnter={() => setHover([i, j])}
                  className={
                    hover && hover[0] === i && hover[1] === j
                      ? styles.cellHit
                      : hover && (hover[0] === i || hover[1] === j)
                        ? styles.cellLine
                        : undefined
                  }
                >
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


/** Grey strip for a small calculator: inputs + live results. */
export function Calc({ children }: { children: ReactNode }) {
  return <div className={styles.calc}>{children}</div>
}

/** Pill buttons to switch between two or more views. */
export function Toggle<T extends string>({ options, value, onChange }: {
  options: { id: T; label: ReactNode }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className={styles.toggle}>
      {options.map((o) => (
        <button key={o.id} className={o.id === value ? styles.tabActive : undefined} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
