import { useEffect, useState, type RefObject } from 'react'
import {
  capturePosition,
  clearPosition,
  loadPosition,
  resolvePosition,
  savePosition,
  setLastChapter,
} from '../../lib/readingPosition'
import styles from './ReadingPosition.module.css'

interface Props {
  chapterId: string
  article: RefObject<HTMLElement | null>
}

/**
 * Render this after the chapter content (inside the same Suspense) so it mounts once the
 * content exists. It scrolls back to where you left off, keeps saving as you scroll,
 * and shows a small notice with a "back to top" button.
 */
export function ReadingPosition({ chapterId, article }: Props) {
  const [resumed, setResumed] = useState(false)

  useEffect(() => {
    setLastChapter(chapterId)
    // we restore the position ourselves; stop the browser from fighting over it
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    const el = article.current
    if (!el) return
    let ready = false
    let cancelled = false

    const restore = async () => {
      // wait for web fonts so line heights (and so positions) are final
      await document.fonts?.ready
      if (cancelled) return
      const saved = loadPosition(chapterId)
      if (saved && saved.y > 200) {
        window.scrollTo(0, Math.max(0, resolvePosition(el, saved)))
        setResumed(true)
      } else {
        window.scrollTo(0, 0)
      }
      ready = true
    }

    const save = () => {
      // skip while restoring, and once React has swapped this chapter out of the page
      if (!ready || !el.isConnected) return
      if (window.scrollY < 50) clearPosition(chapterId)
      else savePosition(chapterId, capturePosition(el))
    }
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        save()
      })
    }

    restore()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pagehide', save)
    return () => {
      cancelled = true
      save()
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', save)
    }
  }, [chapterId, article])

  useEffect(() => {
    if (!resumed) return
    const t = window.setTimeout(() => setResumed(false), 5000)
    return () => window.clearTimeout(t)
  }, [resumed])

  if (!resumed) return null
  return (
    <div className={styles.toast} role="status">
      กลับมาที่อ่านค้างไว้แล้ว
      <button
        onClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
          setResumed(false)
        }}
      >
        ไปบนสุด
      </button>
      <button aria-label="ปิด" onClick={() => setResumed(false)}>
        ✕
      </button>
    </div>
  )
}
