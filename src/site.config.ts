/**
 * ⚙️  SITE CONFIG – the one file to edit when starting a new subject.
 *
 *  1. `site`          name of the site / course shown in the sidebar and browser tab
 *  2. `theme`         colours (preset or your own) + light/dark mode
 *  3. `CHAPTERS`      the menu: chapters (4, 5, 6) and extra pages (C = cheat sheet)
 *  4. `floatingPanel` optional button at the bottom right that opens reference tables
 *
 * Chapter content lives in src/chapters/<folder>/content.mdx. See README.md for the full guide.
 */
import { lazy } from 'react'
import type { Chapter } from './chapters/registry'
import type { FloatingPanelConfig } from './components/panel/FloatingPanel'
import { NET_TABS } from './components/panel/netTables'
import type { ThemeConfig } from './styles/themes'

/* ───────────────────────── 1. site ───────────────────────── */

export const site = {
  title: 'สรุป Network · ไฟนอล',
  course: 'Computer Networks · Chapter 4–6 (Kurose & Ross)',
  footer: 'Computer Networks · ไฟนอล',
  lessonsHeading: 'บทเรียน',
  extrasHeading: 'ทบทวนก่อนสอบ',
  storagePrefix: 'network-final',
}

/* ───────────────────────── 2. theme ───────────────────────── */
/*
 * Black background, pale yellow + pale green as the main colours (owner's request).
 * Each chapter can also set its own accent (see CHAPTERS below): 4 = yellow, 5 = yellow-green, 6 = green,
 * the same colour code as the owner's printed summary.
 */
export const COLORS = {
  yellow: '#f3d98a',
  lime: '#d7e48f',
  green: '#a9d99c',
} as const

export const theme: ThemeConfig = {
  accent: { light: '#8a6d12', dark: COLORS.yellow },
  base: 'neutral',
  mode: 'dark',
  overrides: {
    dark: {
      '--bg': '#050505',
      '--surface': '#0f0f0f',
      '--surface-2': '#191919',
      '--border': '#2a2a27',
      '--text': '#ecebe3',
      '--muted': '#a5a49a',
      '--def': COLORS.yellow,
      '--def-soft': '#17150d',
      '--ex': COLORS.green,
      '--ex-soft': '#0f170e',
      '--warn': '#f2a477',
      '--warn-soft': '#1d130d',
      '--tip': '#c7b5f2',
      '--tip-soft': '#15121d',
    },
  },
}

/* ───────────────────────── 3. chapters / menu ───────────────────────── */

export const CHAPTERS: Chapter[] = [
  {
    id: 'data-plane',
    no: 4,
    title: 'Network Layer: Data Plane',
    subtitle: 'Data Plane',
    source: 'Chapter_4_v8.2.pdf',
    blurb: 'forwarding, ข้างในเราเตอร์, IP / subnet / CIDR, DHCP, NAT, IPv6, SDN match+action',
    accent: COLORS.yellow,
    Content: lazy(() => import('./chapters/04-data-plane/content.mdx')),
  },
  {
    id: 'control-plane',
    no: 5,
    title: 'Network Layer: Control Plane',
    subtitle: 'Control Plane',
    source: 'Chapter_5_v9.0_extended.pdf',
    blurb: 'Dijkstra, Distance Vector, OSPF, BGP, SDN controller, ICMP, network management',
    accent: COLORS.lime,
    Content: lazy(() => import('./chapters/05-control-plane/content.mdx')),
  },
  {
    id: 'link-layer',
    no: 6,
    title: 'Link Layer and LANs',
    subtitle: 'Link Layer',
    source: 'Chapter_6_v9.0_extended.pdf',
    blurb: 'error detection, multiple access, MAC/ARP, Ethernet, switch, VLAN, a day in the life',
    accent: COLORS.green,
    Content: lazy(() => import('./chapters/06-link-layer/content.mdx')),
  },
  {
    id: 'cheat-sheet',
    no: 'C',
    group: 'extra',
    title: 'Cheat Sheet',
    subtitle: 'Cheat Sheet',
    source: 'ทุกบท',
    blurb: 'สูตร ตัวเลข และลำดับขั้นที่ต้องจำ จากทั้ง 3 บท อ่านรอบสุดท้ายก่อนเข้าห้องสอบ',
    accent: COLORS.yellow,
    Content: lazy(() => import('./chapters/cheat-sheet/content.mdx')),
  },
  {
    id: 'quiz',
    no: 'Q',
    group: 'extra',
    title: 'Quiz: Review Questions #5–8',
    subtitle: 'Quiz',
    source: 'Review Questions #5–#8 (myCourseVille)',
    blurb: 'โจทย์ Review Questions จาก myCourseVille 117 ข้อ ทำในเว็บได้ รู้ผลทันที จำคะแนนไว้',
    accent: COLORS.lime,
    Content: lazy(() => import('./chapters/quiz/content.mdx')),
  },
]

/* ───────────────────────── 4. floating panel ───────────────────────── */

export const floatingPanel: FloatingPanelConfig | null = {
  title: 'ตารางอ้างอิง',
  buttonLabel: 'Subnet / ฐาน 2 / ICMP',
  tabs: NET_TABS,
}
