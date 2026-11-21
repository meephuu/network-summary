import type { Heading } from '../../lib/hooks'
import { useActiveHeading } from '../../lib/hooks'
import styles from './TableOfContents.module.css'

interface Props {
  headings: Heading[]
  onPick?: () => void
}

/** "ในบทนี้": the current chapter's sections, highlighting the one on screen. */
export function TableOfContents({ headings, onPick }: Props) {
  const active = useActiveHeading(headings)
  if (!headings.length) return null
  return (
    <nav aria-label="หัวข้อในบทนี้" className={styles.toc}>
      <div className={styles.heading}>ในบทนี้</div>
      <ol className={styles.list}>
        {headings.map((h, i) => (
          <li key={h.id}>
            <button
              className={`${styles.link} ${active === h.id ? styles.active : ''}`}
              onClick={() => {
                document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' })
                onPick?.()
              }}
            >
              <span className={styles.num}>{i + 1}.</span> {h.text}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
