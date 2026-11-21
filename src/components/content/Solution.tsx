import type { ReactNode } from 'react'
import styles from './Solution.module.css'

interface Props {
  /** Text on the toggle. */
  label?: string
  children: ReactNode
}

/** Collapsible worked solution, hidden until the reader has tried the problem. */
export function Solution({ label = 'ดูวิธีทำ', children }: Props) {
  return (
    <details className={styles.details}>
      <summary className={styles.summary}>{label}</summary>
      <div className={styles.body}>{children}</div>
    </details>
  )
}
