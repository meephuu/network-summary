import type { ReactNode, Ref } from 'react'
import styles from './Widget.module.css'

interface Props {
  title: string
  hint?: ReactNode
  children: ReactNode
}

/** Card frame shared by every interactive demo. */
export function Widget({ title, hint, children }: Props) {
  return (
    <div className={styles.widget}>
      <h4 className={styles.title}>
        <span className={styles.tag}>ลองเล่น</span>
        {title}
      </h4>
      {hint && <p className={styles.hint}>{hint}</p>}
      {children}
    </div>
  )
}

export function Controls({ children }: { children: ReactNode }) {
  return <div className={styles.controls}>{children}</div>
}

export function Readout({ children }: { children: ReactNode }) {
  return <div className={styles.readout}>{children}</div>
}

export function ButtonRow({ children }: { children: ReactNode }) {
  return <div className={styles.buttons}>{children}</div>
}

export function PlotCanvas({
  canvasRef,
  label,
  height,
}: {
  canvasRef: Ref<HTMLCanvasElement>
  label: string
  /** px, default 280 */
  height?: number
}) {
  return <canvas ref={canvasRef} className={styles.canvas} style={height ? { height } : undefined} role="img" aria-label={label} />
}
