import type { Chapter } from '../../chapters/registry'
import { firstReady } from '../../chapters/registry'
import { navigate } from '../../lib/hooks'

export function ComingSoon({ chapter }: { chapter: Chapter }) {
  return (
    <div style={{ padding: '32px 0' }}>
      <p>บทนี้ยังไม่ได้ทำสรุป จะครอบคลุม: {chapter.blurb}</p>
      <button
        onClick={() => navigate(firstReady().id)}
        style={{
          padding: '6px 14px',
          borderRadius: 999,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          cursor: 'pointer',
        }}
      >
        ← กลับไปบทที่มีแล้ว
      </button>
    </div>
  )
}
