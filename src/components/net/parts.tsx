import type { ReactNode } from 'react'
import s from './net.module.css'

/** Segmented toggle: <Seg value={v} options={[['a','A'],['b','B']]} onChange={setV} /> */
export function Seg<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: [T, ReactNode][]
  onChange: (v: T) => void
  label?: string
}) {
  return (
    <div className={s.seg} role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={String(v)} aria-pressed={v === value} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </div>
  )
}

/** ◀ step / dots / step ▶ / reset. `step` runs 0..max. */
export function Stepper({
  step,
  max,
  onStep,
  nextLabel = 'ถัดไป ▶',
  extra,
}: {
  step: number
  max: number
  onStep: (n: number) => void
  nextLabel?: string
  extra?: ReactNode
}) {
  return (
    <div className={s.stepper}>
      <button className={s.stepBtn} onClick={() => onStep(step - 1)} disabled={step <= 0}>
        ◀
      </button>
      <button className={`${s.stepBtn} ${s.primary}`} onClick={() => onStep(step + 1)} disabled={step >= max}>
        {nextLabel}
      </button>
      <button className={s.stepBtn} onClick={() => onStep(0)} disabled={step === 0}>
        เริ่มใหม่
      </button>
      {max <= 14 && (
        <div className={s.dots}>
          {Array.from({ length: max + 1 }, (_, i) => (
            <button
              key={i}
              className={`${s.dot} ${i <= step ? s.dotOn : ''}`}
              onClick={() => onStep(i)}
              aria-label={`ขั้นที่ ${i}`}
            />
          ))}
        </div>
      )}
      {extra}
    </div>
  )
}

export function StepNote({ children }: { children: ReactNode }) {
  return (
    <div className={s.stepNote} aria-live="polite">
      {children}
    </div>
  )
}

/** Render a bit string; `cls(i)` picks a class per bit. Spaces are kept as small gaps. */
export function Bits({
  bits,
  cls,
  onClick,
  group = 8,
}: {
  bits: string
  cls?: (i: number) => string | undefined
  onClick?: (i: number) => void
  group?: number
}) {
  const out: ReactNode[] = []
  for (let i = 0; i < bits.length; i++) {
    if (group && i && i % group === 0) out.push(<span key={`g${i}`} className={s.bitGap} />)
    out.push(
      <span
        key={i}
        className={`${s.bit} ${cls?.(i) ?? ''} ${onClick ? s.clickBit : ''}`}
        onClick={onClick ? () => onClick(i) : undefined}
      >
        {bits[i]}
      </span>,
    )
  }
  return <span className={s.bits}>{out}</span>
}

export { s as net }
