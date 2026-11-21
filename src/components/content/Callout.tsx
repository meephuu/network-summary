import type { ReactNode } from 'react'
import styles from './Callout.module.css'

export type CalloutType = 'def' | 'ex' | 'warn' | 'tip'

export const CALLOUT_LABEL: Record<CalloutType, string> = {
  def: 'นิยาม',
  ex: 'ตัวอย่าง',
  warn: 'ระวัง!',
  tip: 'ทิปสำหรับสอบ',
}

interface Props {
  type?: CalloutType
  /** Heading shown at the top. Defaults to the type's label (นิยาม, ตัวอย่าง, …). */
  title?: ReactNode
  children: ReactNode
}

/** Coloured box for definitions, worked examples, pitfalls and exam tips. */
export function Callout({ type = 'def', title, children }: Props) {
  return (
    <div className={`${styles.box} ${styles[type]}`}>
      <div className={styles.title}>{title ?? CALLOUT_LABEL[type]}</div>
      <div className={styles.body}>{children}</div>
    </div>
  )
}

/** Shorthands so MDX reads naturally: <Def>, <Example>, <Warn>, <Tip>. */
export const Def = (p: Omit<Props, 'type'>) => <Callout type="def" {...p} />
export const Example = (p: Omit<Props, 'type'>) => <Callout type="ex" {...p} />
export const Warn = (p: Omit<Props, 'type'>) => <Callout type="warn" {...p} />
export const Tip = (p: Omit<Props, 'type'>) => <Callout type="tip" {...p} />

/** The colour key shown under a chapter title. */
export function CalloutLegend() {
  return (
    <div className={styles.legend}>
      {(Object.keys(CALLOUT_LABEL) as CalloutType[]).map((t) => (
        <span key={t} className={`${styles.chip} ${styles[t]}`}>
          ■ {t === 'warn' ? 'ระวัง! จุดที่คนพลาด' : CALLOUT_LABEL[t]}
        </span>
      ))}
    </div>
  )
}
