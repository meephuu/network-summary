import { useScrollProgress } from '../../lib/hooks'

/** Thin bar at the top of the window showing how far through the chapter you are. */
export function ReadingProgress() {
  const p = useScrollProgress()
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: 3,
        width: `${p * 100}%`,
        background: 'var(--accent)',
        zIndex: 30,
      }}
    />
  )
}
