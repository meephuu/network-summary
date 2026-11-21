/** Picture cropped from the lecture slides (src/assets/slides/<name>.jpg), inlined into the single-file build. */
const SLIDES = import.meta.glob<string>('../../assets/slides/*.jpg', { eager: true, import: 'default', query: '?url' })

const byName: Record<string, string> = {}
for (const [path, url] of Object.entries(SLIDES)) byName[path.split('/').pop()!.replace('.jpg', '')] = url

interface Props {
  /** file name in src/assets/slides without .jpg */
  src: string
  caption?: string
  /** max width in px (default: full column) */
  width?: number
}

export function Figure({ src, caption, width }: Props) {
  const url = byName[src]
  if (!url) return <p className="small">[ไม่พบรูป {src}]</p>
  return (
    <figure>
      <img src={url} alt={caption ?? src} loading="lazy" style={width ? { maxWidth: width } : undefined} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}
