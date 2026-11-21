# สรุป Network · ไฟนอล (Chapter 4–6)

เว็บสรุปเนื้อหาเตรียมสอบไฟนอลวิชา Computer Networks (Kurose & Ross บทที่ 4 Data Plane, 5 Control Plane, 6 Link Layer)
สร้างจาก template [`exam-summary-template`](https://github.com/meephuu/exam-summary-template) (React + Vite + MDX + KaTeX)

ธีม: พื้นหลังดำ สีหลักเหลืองอ่อน + เขียวอ่อน · แต่ละบทมีสีประจำ (4 = เหลือง, 5 = เหลืองเขียว, 6 = เขียว) เหมือนสรุป PDF

## เปิดอ่านเลย

ดับเบิลคลิก `dist/index.html` ไฟล์เดียวรวมทุกอย่าง (ฟอนต์, สูตร, รูปจากสไลด์, ของเล่น) เปิดได้แม้ไม่มีเน็ต

## มีอะไรในเว็บ

| บท | ของเล่น (widget) | รูปจากสไลด์ |
|---|---|---|
| 4 Data Plane | Control plane 2 แบบ · Longest prefix match · Packet scheduling (FIFO/Priority/RR/WFQ) · Buffer sizing · IPv4/IPv6 header · Fragmentation · CIDR/subnet calculator · DHCP DORA · NAT table · Flow table match+action | router analogy, HOL blocking, subnets, tunneling, IP hourglass |
| 5 Control Plane | Dijkstra (แก้ cost/เปลี่ยน source ได้) · Distance vector กริด 3×3 · Count-to-infinity + poisoned reverse · SDN + OpenFlow messages · traceroute | LS oscillation, eBGP/iBGP, hot potato, BGP policy |
| 6 Link Layer | Parity 1D/2D · Internet checksum · CRC (หาร mod-2 ทีละขั้น) · TDMA/FDMA · ALOHA/CSMA-CD efficiency · Binary backoff · ส่งข้าม subnet · Ethernet frame + 802.1Q · Switch self-learning (1 ตัว / S1–S4) · A day in the life | ARP, VLAN, MPLS tables, data center, multipath, scenario |
| C Cheat Sheet | – | ตัวเลข/สูตร/ลำดับขั้น/คู่เปรียบเทียบ/กับดัก |

ปุ่มมุมขวาล่างเปิดตาราง **Subnet /x** (มีเครื่องคิด), **ฐาน 2**, **ICMP / ตัวเลขที่ต้องจำ**

## พัฒนาต่อ

ต้องมี Node.js 20 ขึ้นไป

```bash
npm install      # ครั้งแรกครั้งเดียว
npm run dev      # http://localhost:5173 แก้ไฟล์แล้วหน้าเว็บอัปเดตทันที
npm run build    # สร้าง dist/index.html ใหม่
```

## โครงสร้าง

```
src/site.config.ts                 ชื่อเว็บ, ธีม (ดำ + เหลือง/เขียว), รายชื่อบท + สีประจำบท, แผงตาราง
src/chapters/04-data-plane/        เนื้อหาบท 4 (content.mdx)
src/chapters/05-control-plane/     เนื้อหาบท 5
src/chapters/06-link-layer/        เนื้อหาบท 6
src/chapters/cheat-sheet/          หน้า Cheat Sheet
src/components/net/                widget ของวิชานี้ทั้งหมด + parts.tsx (Seg, Stepper, Bits) + net.module.css
src/components/content/Figure.tsx  <Figure src="ชื่อไฟล์" caption="…" /> รูปจาก src/assets/slides/*.jpg
src/components/panel/netTables.tsx แท็บในแผงตารางลอย
src/lib/net.ts                     ฟังก์ชัน IP / CIDR / CRC (mod-2) / checksum
```

วิธีใช้กล่องเนื้อหาและ component พื้นฐานดูที่ [`docs/components.md`](docs/components.md)

## Deploy (GitHub Pages)

ยังไม่ได้ขึ้น GitHub · ถ้าจะขึ้น: สร้าง repo เปล่า → `git remote add origin …` → `git push -u origin main` แล้วตั้ง **Settings → Pages → Source: GitHub Actions** (มี `.github/workflows/deploy.yml` แล้ว)
