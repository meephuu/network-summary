/**
 * Practice quiz built from the course's Review Questions (#5–#8, myCourseVille).
 * Questions live in src/chapters/quiz/questions.json, pictures in src/assets/quiz/.
 * Answers are remembered in this browser's localStorage so the score survives a reload.
 */
import { useState, useSyncExternalStore } from 'react'
import data from '../../chapters/quiz/questions.json'
import { site } from '../../site.config'
import s from './Quiz.module.css'

interface Question {
  n: number
  /** question HTML, split where a picture goes (parts.length = img.length + 1) */
  parts: string[]
  img: string[]
  choices: string[]
  /** indexes of correct choices (a few questions accept two) */
  answer: number[]
}
interface QuizSetData {
  id: string
  title: string
  topic: string
  by: string
  questions: Question[]
}

const SETS = data as QuizSetData[]
const LETTERS = 'abcdefghijkl'

const PICS = import.meta.glob<string>('../../assets/quiz/*.{jpg,png}', { eager: true, import: 'default', query: '?url' })
const picUrl: Record<string, string> = {}
for (const [path, url] of Object.entries(PICS)) picUrl[path.split('/').pop()!.replace(/\.(jpg|png)$/, '')] = url

/* ───────────── store: chosen index per question (-1 = only revealed) ───────────── */

type Answers = Record<string, number>
type Filter = 'all' | 'todo' | 'wrong'
const KEY = `${site.storagePrefix}:quiz`

function load(): Answers {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Answers
  } catch {
    return {}
  }
}
/** `visible` = questions picked by the filter when it was chosen, so a card doesn't vanish the moment you answer it */
let state: { answers: Answers; filter: Filter; visible: Set<string> | null } = { answers: load(), filter: 'all', visible: null }
const listeners = new Set<() => void>()
function set(next: Partial<typeof state>) {
  state = { ...state, ...next }
  try {
    localStorage.setItem(KEY, JSON.stringify(state.answers))
  } catch {
    // storage disabled: score just isn't remembered
  }
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
const useQuiz = () => useSyncExternalStore(subscribe, () => state)

const qKey = (setId: string, n: number) => `${setId}:${n}`
const isRight = (q: Question, pick: number | undefined) => pick !== undefined && q.answer.includes(pick)

function score(set: QuizSetData, answers: Answers) {
  let done = 0
  let right = 0
  for (const q of set.questions) {
    const pick = answers[qKey(set.id, q.n)]
    if (pick === undefined) continue
    done++
    if (isRight(q, pick)) right++
  }
  return { done, right, total: set.questions.length }
}

function setFilter(filter: Filter) {
  if (filter === 'all') return set({ filter, visible: null })
  const visible = new Set<string>()
  for (const x of SETS)
    for (const q of x.questions) {
      const k = qKey(x.id, q.n)
      const pick = state.answers[k]
      if (filter === 'todo' ? pick === undefined : pick !== undefined && !isRight(q, pick)) visible.add(k)
    }
  set({ filter, visible })
}

function clearSet(setId: string) {
  const answers = { ...state.answers }
  for (const k of Object.keys(answers)) if (k.startsWith(setId + ':')) delete answers[k]
  set({ answers })
}

/* ───────────── overview at the top of the page ───────────── */

export function QuizOverview() {
  const { answers, filter } = useQuiz()
  const all = SETS.map((x) => score(x, answers))
  const done = all.reduce((a, b) => a + b.done, 0)
  const right = all.reduce((a, b) => a + b.right, 0)
  const total = all.reduce((a, b) => a + b.total, 0)

  return (
    <div className={s.overview}>
      <div className={s.overviewHead}>
        <div>
          <div className={s.big}>
            {right}
            <span> / {total}</span>
          </div>
          <div className={s.muted}>
            ตอบถูก · ทำไปแล้ว {done} ข้อ{done > 0 && ` (ถูก ${Math.round((right / done) * 100)}%)`}
          </div>
        </div>
        <div className={s.controls}>
          <div className={s.seg} role="group" aria-label="แสดงข้อ">
            {(
              [
                ['all', 'ทุกข้อ'],
                ['todo', 'ยังไม่ทำ'],
                ['wrong', 'ข้อที่ผิด'],
              ] as [Filter, string][]
            ).map(([v, label]) => (
              <button key={v} aria-pressed={filter === v} onClick={() => setFilter(v)}>
                {label}
              </button>
            ))}
          </div>
          <button
            className={s.ghost}
            disabled={done === 0}
            onClick={() => {
              if (confirm('ล้างคำตอบทุกชุด?')) set({ answers: {}, filter: 'all', visible: null })
            }}
          >
            ล้างทั้งหมด
          </button>
        </div>
      </div>
      <div className={s.rows}>
        {SETS.map((x, i) => (
          <a key={x.id} className={s.row} href={`#quiz-${x.id}`} onClick={(e) => jump(e, x.id)}>
            <span className={s.rowName}>#{x.id}</span>
            <span className={s.rowTopic}>{x.topic}</span>
            <span className={s.bar}>
              <span style={{ width: `${(all[i].right / all[i].total) * 100}%` }} className={s.barRight} />
              <span style={{ width: `${((all[i].done - all[i].right) / all[i].total) * 100}%` }} className={s.barWrong} />
            </span>
            <span className={s.rowScore}>
              {all[i].right}/{all[i].total}
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}

/** hash routing is used for chapters, so scroll by hand instead of following #quiz-… */
function jump(e: React.MouseEvent, id: string) {
  e.preventDefault()
  document.getElementById(`quiz-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/* ───────────── one worksheet ───────────── */

export function QuizSet({ id }: { id: string }) {
  const { answers, filter, visible } = useQuiz()
  const qs = SETS.find((x) => x.id === id)
  if (!qs) return <p className="small">[ไม่พบชุด {id}]</p>
  const sc = score(qs, answers)
  const shown = visible ? qs.questions.filter((q) => visible.has(qKey(id, q.n))) : qs.questions

  return (
    <div className={s.set} id={`quiz-${id}`}>
      <div className={s.setHead}>
        <span className={s.muted}>
          {qs.title} · {qs.by} · {qs.questions.length} ข้อ
        </span>
        <span className={s.setScore}>
          ถูก {sc.right}/{sc.total}
          {sc.done > 0 && (
            <button className={s.ghost} onClick={() => clearSet(id)}>
              ทำชุดนี้ใหม่
            </button>
          )}
        </span>
      </div>
      {shown.length === 0 && (
        <p className={s.empty}>{filter === 'wrong' ? 'ไม่มีข้อที่ตอบผิดในชุดนี้ 🎉' : 'ทำครบทุกข้อในชุดนี้แล้ว'}</p>
      )}
      {shown.map((q) => (
        <QuestionCard key={q.n} setId={id} q={q} pick={answers[qKey(id, q.n)]} />
      ))}
    </div>
  )
}

function QuestionCard({ setId, q, pick }: { setId: string; q: Question; pick: number | undefined }) {
  const answered = pick !== undefined
  const [zoom, setZoom] = useState<string | null>(null)
  const choose = (i: number) => {
    if (answered) return
    set({ answers: { ...state.answers, [qKey(setId, q.n)]: i } })
  }
  const status = !answered ? '' : pick === -1 ? s.revealed : isRight(q, pick) ? s.right : s.wrong

  return (
    <div className={`${s.card} ${status}`}>
      <div className={s.qNo}>
        ข้อ {q.n}
        {answered && <span className={s.verdict}>{pick === -1 ? 'ดูเฉลย' : isRight(q, pick) ? '✓ ถูก' : '✗ ผิด'}</span>}
      </div>
      <div className={s.qText}>
        {q.parts.map((html, i) => (
          <div key={i}>
            {html && <div dangerouslySetInnerHTML={{ __html: html }} />}
            {i < q.img.length && (
              <figure className={s.fig}>
                <img
                  src={picUrl[q.img[i]]}
                  alt={`รูปประกอบข้อ ${q.n}`}
                  loading="lazy"
                  title="กดเพื่อขยาย"
                  onClick={() => setZoom(picUrl[q.img[i]])}
                />
              </figure>
            )}
          </div>
        ))}
      </div>
      <div className={s.choices}>
        {q.choices.map((c, i) => {
          const correct = q.answer.includes(i)
          const cls = !answered ? '' : correct ? s.cRight : i === pick ? s.cWrong : s.cDim
          return (
            <button key={i} className={`${s.choice} ${cls}`} onClick={() => choose(i)} disabled={answered && !correct && i !== pick}>
              <span className={s.letter}>{LETTERS[i]}</span>
              <span>{c}</span>
            </button>
          )
        })}
      </div>
      {zoom && (
        <div className={s.zoom} onClick={() => setZoom(null)} role="dialog" aria-label="รูปขยาย (กดเพื่อปิด)">
          <img src={zoom} alt={`รูปประกอบข้อ ${q.n} ขยาย`} />
        </div>
      )}
      <div className={s.cardFoot}>
        {!answered ? (
          <button className={s.ghost} onClick={() => choose(-1)}>
            ดูเฉลย
          </button>
        ) : (
          <>
            {q.answer.length > 1 && <span className={s.muted}>ข้อนี้ระบบรับได้ {q.answer.length} คำตอบ</span>}
            <button
              className={s.ghost}
              onClick={() => {
                const answers = { ...state.answers }
                delete answers[qKey(setId, q.n)]
                set({ answers })
              }}
            >
              ลองใหม่
            </button>
          </>
        )}
      </div>
    </div>
  )
}
