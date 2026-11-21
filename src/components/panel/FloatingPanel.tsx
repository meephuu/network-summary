import { useEffect, useRef, useState, type ReactNode } from 'react'
import { site } from '../../site.config'
import { useAutoHideScrollbar } from '../../lib/hooks'
import styles from './FloatingPanel.module.css'

export interface PanelTab {
  id: string
  label: string
  /** rendered only while the panel is open on this tab */
  render: () => ReactNode
}

export interface FloatingPanelConfig {
  /** heading inside the panel */
  title: string
  /** text on the round button (hidden on mobile) */
  buttonLabel: string
  tabs: PanelTab[]
}

/** Floating button (bottom right) that opens a tabbed panel: reference tables, formulas, anything. */
export function FloatingPanel({ title, buttonLabel, tabs }: FloatingPanelConfig) {
  const storeKey = `${site.storagePrefix}:panel-tab`
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<string>(() => {
    try {
      const v = localStorage.getItem(storeKey)
      if (v && tabs.some((t) => t.id === v)) return v
    } catch {
      /* storage blocked: use default */
    }
    return tabs[0]?.id ?? ''
  })
  const bodyRef = useRef<HTMLDivElement>(null)
  useAutoHideScrollbar(bodyRef)

  useEffect(() => {
    try {
      localStorage.setItem(storeKey, tab)
    } catch {
      /* ignore */
    }
    bodyRef.current?.scrollTo({ top: 0 })
  }, [tab, storeKey])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const current = tabs.find((t) => t.id === tab) ?? tabs[0]
  return (
    <>
      <div className={`${styles.backdrop} ${open ? styles.backdropOpen : ''}`} onClick={() => setOpen(false)} aria-hidden />
      <div
        className={`${styles.panel} ${open ? styles.panelOpen : ''}`}
        role="dialog"
        aria-label={title}
        aria-hidden={!open}
        inert={!open}
      >
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <span className={styles.title}>{title}</span>
            <button className={styles.close} onClick={() => setOpen(false)} aria-label="ปิด">
              ✕
            </button>
          </div>
          {tabs.length > 1 && (
            <div className={styles.tabs} role="tablist">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={t.id === current?.id}
                  className={t.id === current?.id ? styles.tabActive : undefined}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={styles.body} ref={bodyRef}>
          {open && current?.render()}
        </div>
      </div>
      <button
        className={`${styles.fab} ${open ? styles.fabOpen : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? `ปิด${title}` : `เปิด${title}`}
      >
        <span className={styles.fabIcon} aria-hidden>
          {open ? '✕' : <TableIcon />}
        </span>
        <span className={styles.fabLabel}>{buttonLabel}</span>
      </button>
    </>
  )
}

function TableIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M3 10h18M3 15h18M9 4v16" />
    </svg>
  )
}
