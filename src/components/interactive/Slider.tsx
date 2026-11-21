import { useId } from 'react'
import { fmt } from '../../lib/math'
import styles from './Slider.module.css'

interface Props {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}

/** Labelled range input that shows its current value. */
export function Slider({ label, value, min, max, step, onChange }: Props) {
  const id = useId()
  return (
    <div className={styles.slider}>
      <label htmlFor={id}>
        {label} = <span className={styles.value}>{fmt(value)}</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
    </div>
  )
}
