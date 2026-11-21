import { chapterLabel, type Chapter } from '../../chapters/registry'
import { CalloutLegend } from '../content/Callout'
import styles from './ChapterHeader.module.css'

/** Chapter title block: a big display-font number (like the printed summary) + English title. */
export function ChapterHeader({ chapter }: { chapter: Chapter }) {
  const extra = chapter.group === 'extra'
  return (
    <header className={styles.header}>
      <div className={styles.glow} aria-hidden />
      <div className={styles.row}>
        <div className={styles.num} aria-hidden>
          {chapter.no}
        </div>
        <div className={styles.text}>
          <div className={styles.kicker}>{extra ? chapterLabel(chapter) : `Chapter ${chapter.no} · ${chapterLabel(chapter)}`}</div>
          <h1 className={styles.title}>{chapter.title}</h1>
        </div>
      </div>
      {extra ? (
        <p className={styles.lead}>{chapter.blurb}</p>
      ) : (
        <>
          <p className={styles.lead}>
            สรุปจาก <code>{chapter.source}</code> · {chapter.blurb}
          </p>
          {chapter.Content && <CalloutLegend />}
        </>
      )}
    </header>
  )
}
