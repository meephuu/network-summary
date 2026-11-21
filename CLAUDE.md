# CLAUDE.md – เว็บสรุป Network ไฟนอล

เว็บสรุปเนื้อหาสำหรับสอบไฟนอลวิชา **Computer Networks (Chapter 4–6, Kurose & Ross)** ของ Meephu (Phu, วิศวะคอมฯ จุฬาฯ)
สร้างจาก template `exam-summary-template` · คุยกับเจ้าของเป็น**ภาษาไทย**เสมอ · สถานะงานล่าสุดอยู่ใน `HANDOFF.md` (อ่านคู่กัน)

- โฟลเดอร์ในเครื่อง: `D:\Work-Uni\year3\NETWORK\summary-web`
- GitHub: ยังไม่ได้สร้าง repo (เจ้าของขอให้อยู่ในเครื่องก่อน มี git local แล้ว)
- Deploy: GitHub Actions (`.github/workflows/deploy.yml`) build แล้วขึ้น GitHub Pages ทุกครั้งที่ push `main`

## เอกสารต้นฉบับ

เนื้อหาทุกบท**ต้องอิงจากเอกสารจริง** ห้ามแต่งตัวอย่างหรือตัวเลขในสไลด์ขึ้นเอง ตัวอย่างที่แต่งเพิ่มต้องคำนวณตรวจก่อนใส่

- ในเครื่อง: `D:\Work-Uni\year3\NETWORK\slide final\` (อ่านผ่าน device tools; PDF เป็นสไลด์ ใช้ `pdftotext` / `pdftoppm` บนเครื่องได้)
- Claude Docs (artifact): "สรุป Network Chapter 4/5/6" (3 doc แยกบท) = สรุปละเอียดที่เว็บนี้ย่อมา

| ไฟล์ | เนื้อหา | ใช้ทำบท |
|---|---|---|
| `Chapter_4_v8.2-….pdf` (103 หน้า) | Network layer: data plane | 4 |
| `Chapter_5_v9.0_extended-….pdf` (134 หน้า) | Network layer: control plane (มีสไลด์ไทยของอาจารย์บางหน้า) | 5 |
| `Chapter_6_v9.0_extended-….pdf` (118 หน้า) | Link layer and LANs | 6 |
| `NETWORK_SUMMARY_highlighted.pdf` (36 หน้า, เป็นภาพ) | สรุปของเจ้าของ (เนื้อหาเดียวกับ Claude Docs) พื้นดำ สีบท 4 เหลือง / 5 เหลืองเขียว / 6 เขียว | ใช้ดูว่าเน้นอะไร + โทนสีเว็บ |

รูปที่ครอปจากสไลด์อยู่ `src/assets/slides/` (ครอปด้วย `pdftoppm -r 150` + `convert -crop` แล้วย่อ ≤1000px, jpg q≈78)

**ขอบเขตสอบ:** Chapter 4–6

## สไตล์เนื้อหา (ใช้เหมือนกันทุกบท – เปิดบทที่เขียนเสร็จแล้วดูเป็นแบบก่อนเขียนบทใหม่)

- ภาษาไทย อ่านง่าย คนไม่เคยเรียนก็เข้าใจ อธิบายสัญชาตญาณก่อนสูตร ศัพท์เทคนิคใส่อังกฤษในวงเล็บ
- ชื่อบท (`title` ใน `src/site.config.ts`) เป็น**ภาษาอังกฤษ** · `subtitle` = ชื่อสั้นในเมนู
- `##` = ส่วนใหญ่ (มีเลขและสารบัญอัตโนมัติ ห้ามใส่เลขเอง) · `###` = หัวข้อย่อย
- กล่อง: `<Def>` นิยาม · `<Example>` ตัวอย่าง (วิธีทำซ่อนใน `<Solution>`) · `<Warn>` จุดที่คนพลาด · `<Tip>` ทิปสอบ · `<Compare>/<CompareItem>` เทียบสองฝั่ง
- **เจ้าของขอ: เนื้อหาไม่ต้องละเอียดเท่า Claude Docs ย่อได้ ขอใจความครบ เน้นคอนเซปหลัก รูป และของเล่น**
- เรื่องรอง (net neutrality, SNMP/NETCONF, MPLS, data center) ใส่ครบแต่สั้นมาก
- รูปที่ต้องเห็นถึงเข้าใจ: `<Figure src="…" caption="…" />` หรือวาดเป็น SVG ใน widget
- ปิดบทด้วย `## สรุป + ควิซ` (ตารางสั้น + ควิซ 4 ข้อมีเฉลย + `<Tip title="บทต่อไป">`)
- สี: ใช้ `--accent` (สีประจำบท) สำหรับไฮไลต์สีเดียว · ถ้าต้องแยก 2 สีให้ใช้ `--def` (เหลือง) คู่กับ `--ex` (เขียว) เพราะบท 6 accent = เขียว
- รายละเอียด component ทั้งหมด: `docs/components.md`

## โค้ด

React 19 + Vite 8 + TypeScript + MDX (`remark-math` + `rehype-katex` render สูตรตอน build) + `vite-plugin-singlefile`
→ `dist/index.html` ไฟล์เดียว รวมฟอนต์ Google Sans (ไทย/อังกฤษ/กรีก) และ KaTeX เปิดได้ offline

```
src/site.config.ts                  ⚙️ ชื่อเว็บ, ธีมสี, รายชื่อบท (CHAPTERS), แผงตารางลอย
src/chapters/<folder>/content.mdx   เนื้อหาแต่ละบท
src/components/content/             Callout(Def/Example/Warn/Tip), Solution, Compare, mdxComponents.ts ← ลงทะเบียน component ให้ MDX ที่นี่
src/components/interactive/         Widget/Controls/ButtonRow/Readout/PlotCanvas, Slider, ExampleWidget (แบบสำหรับ widget ใหม่)
src/components/panel/               FloatingPanel + PanelParts, statTables (z/t/χ²), exampleTab
src/components/layout/              AppShell, ChapterMenu, TableOfContents, ChapterHeader, ReadingPosition, ReadingProgress
src/lib/                            math, plot (drawFrame/drawMarker/cssVar/withAlpha), hooks (useCanvas, hash routing), random, readingPosition
src/styles/themes.ts                preset สี + สร้าง CSS ธีม (สีทั้งหมดเป็น hex)
```

- เพิ่มบท: สร้าง `src/chapters/NN-xxx/content.mdx` แล้วใส่ `Content: lazy(() => import('./chapters/NN-xxx/content.mdx'))` ใน `CHAPTERS`
- หน้าเสริม (cheat sheet ฯลฯ): `group: 'extra'`, `no: 'C'`
- widget ใหม่: ก๊อป `ExampleWidget.tsx` (useCanvas + drawFrame + `<Widget>`) แล้วลงทะเบียนใน `mdxComponents.ts` · สีในกราฟใช้ `cssVar('--…')` เสมอ
- routing เป็น hash (`#/chapter-id`) เพื่อให้เปิดไฟล์จากดิสก์ได้

### ข้อควรระวัง MDX
- `<` และ `{ }` นอกสูตรต้อง escape (`\<`) หรือใส่ในสูตร `$…$`
- เนื้อหาใน component เว้นบรรทัดว่างก่อน/หลัง ห้ามย่อหน้าด้วย space
- `title="…"` เป็น string ธรรมดา ห้ามมีสูตร
- ตาราง GFM: ห้ามมี `|` ในสูตร (ใช้ `\mid`, `\lvert…\rvert`) · `%` ในสูตรต้องเป็น `\%`
- `katex` ต้องเป็น 0.16.x ให้ตรงกับ rehype-katex ไม่งั้นตัวห้อย/ตัวยกเพี้ยน

## คำสั่ง

```bash
npm run dev        # dev server
npm run build      # สร้าง dist/index.html
npm run typecheck
```
scripts เรียก `node node_modules/vite/bin/vite.js` ตรงๆ เพื่อให้ใช้ได้แม้ node_modules ติดตั้งจาก Linux VM ด้วย `npm install --no-bin-links --os=win32` (ไม่มี `.bin`) อย่าเปลี่ยนเป็น `vite`

## Workflow ของ Claude

1. **แก้ไฟล์ในเครื่องเจ้าของ** ผ่าน device tools (ขอสิทธิ์โฟลเดอร์ และ**สิทธิ์ลบ**ไว้ก่อน เพราะ git ต้องลบ lock file ของตัวเอง)
2. ถ้ายังไม่มี `node_modules`: ใน VM รัน `npm install --no-bin-links --os=win32` (ให้ใช้ได้ทั้ง VM และ Windows)
3. Build ใน VM: ถ้า unlink `dist/index.html` ไม่ได้ ใช้ `npm run build -- --outDir /tmp/out --emptyOutDir` แล้ว `cp` ทับ
4. **ตรวจก่อนส่ง:** stage `dist/index.html` มาเปิดด้วย Playwright (1280px + มือถือ 390px) → `.katex-error` = 0, `scrollWidth` มือถือ = 390, ดูภาพ widget, ตรวจตัวเลขเทียบเอกสาร
5. **Git: commit ในเครื่องก่อน แล้วค่อย push** (เจ้าของไม่อยากต้อง pull)
   - commit ใน VM: `git -c user.name="Phu" -c user.email="phu.anuntaworasakul@gmail.com" commit …` + บรรทัด Co-Authored-By
   - commit เฉพาะไฟล์ที่ตัวเองแก้ ไฟล์ที่เจ้าของแก้ค้างไว้ (เช่น `HANDOFF.md`) อย่า commit ให้
   - `git bundle create .git/x.bundle origin/main..main` → stage → ใน container `add_repo` (access: push) แล้ว `git fetch <bundle> main:refs/bundle/main` + `git push origin refs/bundle/main:refs/heads/main`
   - ลบ bundle, `git fetch origin` ใน VM ให้ `main...origin/main` ตรงกัน, เช็ก `gh run list -R <owner/repo> -L 1`
6. สรุปให้เจ้าของสั้นๆ เป็นภาษาไทย

## สิ่งที่เจ้าของเคยตัดสินใจ (จากเว็บ CEM II)
- ไม่เอาไอคอนข้างชื่อเว็บในแถบเมนู (ไอคอนใช้แค่ favicon)
- dark mode พื้นหลังดำ
- ไอเดียที่พักไว้: ไฮไลท์ข้อความด้วยคลิกขวา (localStorage; sync ข้ามเครื่องต้องมี backend)
