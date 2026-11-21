import { useEffect, useRef, useState, type ReactNode } from 'react'
import { chapterLabel, type Chapter } from '../../chapters/registry'
import { useAutoHideScrollbar, type Heading } from '../../lib/hooks'
import { ChapterMenu } from './ChapterMenu'
import { floatingPanel, site } from '../../site.config'
import { FloatingPanel } from '../panel/FloatingPanel'
import { ReadingProgress } from './ReadingProgress'
import { TableOfContents } from './TableOfContents'
import styles from './AppShell.module.css'

interface Props {
  chapter: Chapter
  headings: Heading[]
  children: ReactNode
}

const COLLAPSE_KEY = `${site.storagePrefix}:sidebar-collapsed`

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path
        d={dir === 'left' ? 'M10 3 5 8l5 5' : 'M6 3l5 5-5 5'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Page layout: sidebar (chapter menu + TOC) on desktop, top bar with a drawer on mobile.
 * On desktop the sidebar can be collapsed (button or the `[` key); the choice is remembered in localStorage.
 */
export function AppShell({ chapter, headings, children }: Props) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const [collapsed, setCollapsed] = useState(readCollapsed)

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
    } catch {
      /* storage unavailable: keep in memory only */
    }
  }, [collapsed])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '[' || e.ctrlKey || e.metaKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      setCollapsed((c) => !c)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const sidebarRef = useRef<HTMLElement>(null)
  useAutoHideScrollbar(sidebarRef)
  useAutoHideScrollbar('document')

  const sidebar = (
    <>
      <div className={styles.brandRow}>
        <button
          className={styles.collapseButton}
          onClick={() => setCollapsed(true)}
          aria-label="พับแถบเมนู"
          title="พับแถบเมนู ( [ )"
        >
          <ChevronIcon dir="left" />
        </button>
        <div className={styles.brandSub}>Summary · Final</div>
        <div className={styles.brand}>NETWORK</div>
        <div className={styles.course}>{site.course}</div>
        <div className={styles.layers} aria-label="layer ที่ออกสอบ: network และ link">
          {['Application', 'Transport', 'Network', 'Link', 'Physical'].map((l) => (
            <span key={l} className={l === 'Network' || l === 'Link' ? styles.on : undefined}>
              {l}
            </span>
          ))}
        </div>
      </div>
      <ChapterMenu currentId={chapter.id} onPick={close} />
      <TableOfContents headings={headings} onPick={close} />
    </>
  )

  return (
    <>
      <ReadingProgress />
      <div className={styles.topbar} data-topbar>
        <button className={styles.menuButton} onClick={() => setOpen(true)} aria-label="เปิดเมนู">
          ☰
        </button>
        <span className={styles.topTitle}>
          {chapter.group === 'extra' ? chapter.subtitle : `${chapterLabel(chapter)} · ${chapter.subtitle}`}
        </span>
      </div>
      {open && <div className={styles.scrim} onClick={close} />}
      {collapsed && (
        <button
          className={styles.expandButton}
          onClick={() => setCollapsed(false)}
          aria-label="กางแถบเมนู"
          title="กางแถบเมนู ( [ )"
        >
          <ChevronIcon dir="right" />
          <span>เมนู</span>
        </button>
      )}
      <div className={`${styles.layout} ${collapsed ? styles.collapsed : ''}`}>
        <aside ref={sidebarRef} className={`${styles.sidebar} ${open ? styles.open : ''}`}>{sidebar}</aside>
        <main className={styles.main}>{children}</main>
      </div>
      {floatingPanel && <FloatingPanel {...floatingPanel} />}
    </>
  )
}
