# Components

ทุกอย่างในหน้านี้ใช้ใน `content.mdx` ได้ทันทีโดยไม่ต้อง import (ลงทะเบียนไว้ใน `src/components/content/mdxComponents.ts`)
ดูตัวอย่างจริงได้ในบท "วิธีใช้ template" และ "Widget ตัวอย่าง" ของเว็บ

## กล่องเนื้อหา (`components/content/`)

| Component | ใช้กับ | สี |
|---|---|---|
| `<Def>` | นิยาม ทฤษฎีบท | `--def` (= accent) |
| `<Example>` | ตัวอย่างโจทย์ | `--ex` เขียว |
| `<Warn>` | จุดที่คนพลาด | `--warn` ส้ม |
| `<Tip>` | ทิปสอบ สูตรลัด | `--tip` ม่วง |
| `<Callout type="def\|ex\|warn\|tip">` | ตัวเต็มของสี่ตัวบน | |

ทุกตัวรับ `title="…"` (ข้อความธรรมดา ห้ามมีสูตร) ถ้าไม่ใส่จะใช้ชื่อปกติ (นิยาม, ตัวอย่าง, ระวัง!, ทิปสำหรับสอบ แก้ได้ที่ `CALLOUT_LABEL` ใน `Callout.tsx`)

```mdx
<Example title="ตัวอย่าง: โยนเหรียญ">

โยนเหรียญ 3 ครั้ง โอกาสได้หัวอย่างน้อย 1 ครั้งเท่าไร?

<Solution>

$1 - (1/2)^3 = 7/8$

</Solution>

</Example>
```

- `<Solution label="ดูเฉลย">` ซ่อนวิธีทำ กดเปิดได้ (ค่าเริ่มต้นของ label คือ "ดูวิธีทำ")
- `<Compare>` + `<CompareItem title="…">` การ์ดเทียบสองฝั่ง (หรือมากกว่า) บนมือถือเรียงลงล่าง

## Widget (`components/interactive/`)

| Component | คืออะไร |
|---|---|
| `<ExampleWidget />` | พาราโบลา $ax^2+bx+c$ **ตัวเริ่มต้นสำหรับก๊อปไปทำใหม่** มีคอมเมนต์อธิบายทุกขั้น |
| `<NormalArea />` | พื้นที่ใต้กราฟ Normal ระหว่าง a, b (ตัวอย่างสถิติ) |
| `<CLTSimulator />` | จำลอง Central Limit Theorem (ตัวอย่างการสุ่ม + histogram) |

### ชิ้นส่วนสำหรับสร้าง widget

```tsx
<Widget title="ชื่อ" hint="คำอธิบายสั้นๆ ว่าให้ลองทำอะไร">
  <Controls>
    <Slider label="n" value={n} min={1} max={100} step={1} onChange={setN} />
  </Controls>
  <ButtonRow>
    <button onClick={…}>ปุ่มลัด</button>
  </ButtonRow>
  <PlotCanvas canvasRef={ref} label="คำอธิบายกราฟสำหรับ screen reader" height={280} />
  <Readout>ผลลัพธ์ <b>ตัวเลขสำคัญ</b></Readout>
</Widget>
```

วาดกราฟ:

```ts
const ref = useCanvas((g, w, h) => {
  const f = drawFrame(g, w, h, { xlo: -5, xhi: 5, ymax: 1 })   // แกน + เส้น grid, คืน X(), Y(), left/right/top/bottom
  g.strokeStyle = cssVar('--accent')                             // สีจากธีมเสมอ ห้าม hard-code
  g.fillStyle = withAlpha(cssVar('--accent'), 0.3)
  drawMarker(g, f, 0, 'μ')                                       // เส้นประแนวตั้ง + ป้าย
})
```

`useCanvas` วาดใหม่เองทุกครั้งที่ state เปลี่ยน ขนาดเปลี่ยน หรือสลับโหมดมืด

ขั้นตอนเพิ่ม widget ใหม่: ก๊อป `ExampleWidget.tsx` → แก้ → เพิ่มชื่อใน `mdxComponents.ts` → ใช้ `<MyWidget />` ใน MDX

### lib

| ไฟล์ | มีอะไร |
|---|---|
| `lib/math.ts` | `fmt`, `range`, `erf`, `normalCdf/Pdf`, `tCdf/Pdf`, `chi2Cdf`, `logGamma`, `betaInc`, `gammaIncLower`, `invertCdf` (หาค่าผกผันด้วย bisection) |
| `lib/plot.ts` | `drawFrame`, `drawMarker`, `cssVar`, `withAlpha`, `niceTicks` |
| `lib/random.ts` | `mulberry32(seed)` ตัวสุ่มกำหนด seed, `newSeed()` |
| `lib/populations.ts` | ประชากรตัวอย่างที่ CLTSimulator ใช้ |
| `lib/hooks.ts` | `useCanvas`, `useHashRoute`/`navigate`, `useHeadings`, `useActiveHeading`, `useScrollProgress`, `useAutoHideScrollbar` |

## แผงตารางลอย (`components/panel/`)

ปุ่มมุมขวาล่าง กดแล้วเปิดแผงมีแท็บ ตั้งค่าใน `floatingPanel` ของ `site.config.ts`:

```ts
export const floatingPanel = {
  title: 'ตารางอ้างอิง',
  buttonLabel: 'ตาราง z / t / χ²',
  tabs: [...STAT_TABLE_TABS, EXAMPLE_TAB],   // หรือ null เพื่อซ่อนปุ่ม
}
```

- `STAT_TABLE_TABS` (`statTables.tsx`) ตาราง Φ(z), t, χ² และค่าที่ใช้บ่อย คำนวณจริงพร้อมเครื่องคิดเลขเล็ก
- `EXAMPLE_TAB` (`exampleTab.tsx`) แท็บง่ายที่สุด ก๊อปไปทำแท็บของตัวเอง (สูตร, ตารางแปลงหน่วย, truth table ฯลฯ)
- ชิ้นส่วนใน `PanelParts.tsx`: `Note` (บรรทัดคำอธิบาย), `Grid` (ตารางไฮไลต์แถว/คอลัมน์ตามเมาส์), `Calc` (แถบเครื่องคิดเลข), `NumInput`, `Toggle`, `f4` (ทศนิยม 4 ตำแหน่ง)

แท็บคือ object `{ id, label, render: () => <… /> }` แท็บที่เลือกล่าสุดถูกจำไว้ในเบราว์เซอร์

## Layout (ปกติไม่ต้องแก้)

- `ChapterMenu` เมนูสองกลุ่ม: บทเรียน (เลข) และหน้าเสริม (`group: 'extra'`, ตัวอักษร)
- `TableOfContents` สารบัญจากหัวข้อ `##` ไฮไลต์หัวข้อที่กำลังอ่าน
- `ReadingPosition` จำตำแหน่งที่อ่านของแต่ละบท เปิดบทแล้วเลื่อนกลับไปที่เดิมให้ พร้อมแจ้งเตือนเล็กๆ ที่มีปุ่มกลับขึ้นด้านบน
- `ReadingProgress` แถบความคืบหน้าด้านบน
- `ChapterHeader` หัวบท: "บทที่ N" + ชื่อ + ที่มา + คำอธิบายสีของกล่อง
