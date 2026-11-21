import type { ComponentType, LazyExoticComponent } from 'react'
import type { MDXProps } from 'mdx/types'
import { CHAPTERS, site } from '../site.config'

export interface Chapter {
  /** used in the URL: #/<id> */
  id: string
  /** number shown in the menu ('C' for the cheat sheet) */
  no: number | string
  /** 'lesson' = regular chapter, 'extra' = pages in the second menu group (cheat sheet) */
  group?: 'lesson' | 'extra'
  title: string
  subtitle: string
  /** what the summary is based on (slide file, textbook chapter, …); shown under the title */
  source: string
  /** what the chapter covers, one line */
  blurb: string
  /** optional accent colour for this chapter (hex); recolours headings, widgets, menu badge */
  accent?: string
  /** undefined → not written yet (shown as "เร็วๆ นี้") */
  Content?: LazyExoticComponent<ComponentType<MDXProps>>
}

/** Header kicker: "บทที่ 3" for chapters, the menu group name for extra pages. */
export const chapterLabel = (c: Chapter) => (c.group === 'extra' ? site.extrasHeading : `บทที่ ${c.no}`)

export const findChapter = (id: string) => CHAPTERS.find((c) => c.id === id)
export const firstReady = () => CHAPTERS.find((c) => c.Content)!

export { CHAPTERS }
