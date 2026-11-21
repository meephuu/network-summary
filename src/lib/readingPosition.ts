/**
 * Remembers where you were reading, per chapter, in this browser's localStorage (no backend).
 * The position is stored as "which block of the chapter was at the top + how far into it",
 * so it still lands in the right place if the window width (and so the page height) changes.
 */

import { site } from '../site.config'

const POS_KEY = (chapterId: string) => `${site.storagePrefix}:reading-pos:${chapterId}`
const LAST_KEY = `${site.storagePrefix}:last-chapter`

export interface SavedPosition {
  /** index of the article's child block at the top of the screen */
  index: number
  /** px of that block already scrolled past */
  offset: number
  /** raw scrollY, used if the block no longer exists */
  y: number
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // storage full or disabled: just don't remember
  }
}

export function getLastChapter(): string | null {
  return safeGet(LAST_KEY)
}

export function setLastChapter(id: string) {
  safeSet(LAST_KEY, id)
}

export function loadPosition(chapterId: string): SavedPosition | null {
  const raw = safeGet(POS_KEY(chapterId))
  if (!raw) return null
  try {
    return JSON.parse(raw) as SavedPosition
  } catch {
    return null
  }
}

export function savePosition(chapterId: string, pos: SavedPosition) {
  safeSet(POS_KEY(chapterId), JSON.stringify(pos))
}

export function clearPosition(chapterId: string) {
  try {
    localStorage.removeItem(POS_KEY(chapterId))
  } catch {
    // ignore
  }
}

/** Height of the sticky mobile top bar (0 on desktop, where it is hidden). */
function topInset(): number {
  const bar = document.querySelector<HTMLElement>('[data-topbar]')
  return bar && getComputedStyle(bar).display !== 'none' ? bar.offsetHeight : 0
}

/** Describe the current scroll position relative to the article's blocks. */
export function capturePosition(article: HTMLElement): SavedPosition {
  const blocks = Array.from(article.children) as HTMLElement[]
  const line = topInset()
  let index = 0
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].getBoundingClientRect().top <= line) index = i
    else break
  }
  const offset = blocks[index] ? line - blocks[index].getBoundingClientRect().top : 0
  return { index, offset: Math.max(0, offset), y: window.scrollY }
}

/** Absolute scrollY for a saved position in the current layout. */
export function resolvePosition(article: HTMLElement, pos: SavedPosition): number {
  const block = article.children[pos.index] as HTMLElement | undefined
  if (!block) return pos.y
  return block.getBoundingClientRect().top + window.scrollY + pos.offset - topInset()
}
