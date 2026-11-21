import type React from 'react'
import { CHAPTERS, type Chapter } from '../../chapters/registry'
import { site } from '../../site.config'
import { navigate } from '../../lib/hooks'
import styles from './ChapterMenu.module.css'

interface Props {
  currentId: string
  onPick?: () => void
}

/** Chapter list (lessons, then extra pages like the cheat sheet); pages without content yet are shown but disabled. */
export function ChapterMenu({ currentId, onPick }: Props) {
  const renderList = (items: Chapter[]) => (
    <ul className={styles.list}>
      {items.map((c) => {
        const ready = Boolean(c.Content)
        const active = c.id === currentId
        return (
          <li key={c.id}>
            <button
              className={`${styles.item} ${active ? styles.active : ''}`}
              disabled={!ready && !active}
              aria-current={active ? 'page' : undefined}
              onClick={() => {
                navigate(c.id)
                onPick?.()
              }}
            >
              <span className={styles.no} style={c.accent ? ({ '--c': c.accent } as React.CSSProperties) : undefined}>
                {c.no}
              </span>
              <span className={styles.text}>
                <span className={styles.title}>{c.subtitle}</span>
                {!ready && <span className={styles.soon}>เร็วๆ นี้</span>}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )

  const lessons = CHAPTERS.filter((c) => c.group !== 'extra')
  const extras = CHAPTERS.filter((c) => c.group === 'extra')
  return (
    <nav aria-label="เลือกบท">
      <div className={styles.heading}>{site.lessonsHeading}</div>
      {renderList(lessons)}
      {extras.length > 0 && (
        <>
          <div className={`${styles.heading} ${styles.groupGap}`}>{site.extrasHeading}</div>
          {renderList(extras)}
        </>
      )}
    </nav>
  )
}
