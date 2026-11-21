import type { ReactNode } from 'react'
import styles from './Compare.module.css'

/** Side-by-side cards (stack on mobile). Use with <CompareItem>. */
export function Compare({ children }: { children: ReactNode }) {
  return <div className={styles.grid}>{children}</div>
}

export function CompareItem({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className={styles.item}>
      <h4 className={styles.title}>{title}</h4>
      {children}
    </div>
  )
}
