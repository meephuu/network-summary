import { Suspense, useEffect, useRef } from 'react'
import { findChapter, firstReady } from './chapters/registry'
import { mdxComponents } from './components/content/mdxComponents'
import { AppShell } from './components/layout/AppShell'
import { ChapterHeader } from './components/layout/ChapterHeader'
import { ComingSoon } from './components/layout/ComingSoon'
import { ReadingPosition } from './components/layout/ReadingPosition'
import { useHashRoute, useHeadings } from './lib/hooks'
import { getLastChapter } from './lib/readingPosition'
import { site } from './site.config'
import { applyChapterAccent } from './styles/themes'

export default function App() {
  const route = useHashRoute()
  // no chapter in the URL → reopen the chapter read last time
  const chapter = findChapter(route || getLastChapter() || '') ?? firstReady()
  // set before children render, so canvases drawn on mount already use this chapter's colour
  applyChapterAccent(chapter.accent)
  const contentRef = useRef<HTMLElement>(null)
  const headings = useHeadings(contentRef, chapter.id)

  useEffect(() => {
    document.title = `${chapter.subtitle} · ${site.title}`
  }, [chapter])

  const { Content } = chapter
  return (
    <AppShell chapter={chapter} headings={headings}>
      <ChapterHeader chapter={chapter} />
      <article className="prose" ref={contentRef} key={chapter.id}>
        {Content ? (
          <Suspense fallback={<p className="small">กำลังโหลด…</p>}>
            <Content components={mdxComponents} />
            <ReadingPosition chapterId={chapter.id} article={contentRef} />
          </Suspense>
        ) : (
          <ComingSoon chapter={chapter} />
        )}
      </article>
      <footer className="small" style={{ marginTop: 60, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        {chapter.group === 'extra' ? 'รวมจากทุกบท' : `สรุปจาก ${chapter.source}`} · {site.footer}
      </footer>
    </AppShell>
  )
}
