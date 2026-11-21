# HANDOFF – สรุป Network ไฟนอล

อ่านไฟล์นี้ก่อนทำงานต่อในเซสชันใหม่ (สำหรับ Claude และเจ้าของโปรเจกต์) · อัปเดตทุกครั้งที่แก้บท

## สถานะบท

| # | id | บท | เอกสาร | สถานะ |
|---|---|---|---|---|
| 4 | `data-plane` | Network Layer: Data Plane | Chapter_4_v8.2.pdf | ✅ |
| 5 | `control-plane` | Network Layer: Control Plane | Chapter_5_v9.0_extended.pdf | ✅ |
| 6 | `link-layer` | Link Layer and LANs | Chapter_6_v9.0_extended.pdf | ✅ |
| C | `cheat-sheet` | Cheat Sheet | ทุกบท | ✅ |

## ตั้งค่า

- [x] `site`, `<title>`, `storagePrefix: network-final`
- [x] ธีม: dark เท่านั้น พื้น #050505 · accent ต่อบทใน `CHAPTERS[].accent` (เหลือง #f3d98a / เหลืองเขียว #d7e48f / เขียว #a9d99c) · ฟอนต์ display = Instrument Serif (ตัวเลขบท, ชื่อบท, คำว่า NETWORK)
- [x] floatingPanel = `NET_TABS` (Subnet /x + เครื่องคิด, ฐาน 2, ICMP/ตัวเลข)
- [x] git local (ยังไม่มี remote)
- [ ] ถ้าจะขึ้น GitHub Pages: สร้าง repo → push → Settings → Pages → GitHub Actions

## บันทึกงานล่าสุด

- 2026-11-21: สร้างเว็บจาก template ครบ 3 บท + cheat sheet · widget 25 ตัว (รายการใน README) · รูปครอปจากสไลด์ 16 รูป
- ตัวเลขในเครื่องมือตรวจกับสไลด์แล้ว: ตาราง Dijkstra กราฟหลัก (ตรงทุกแถว รวมการเลือก y ก่อน v), CRC 101110/1001 → 011 และ 100100/1101 → 001, fragmentation 4000/1500 → 0/185/370, checksum ตัวอย่างสไลด์, DV ของ b ที่ t=1
- ควิซท้ายบทเป็นโจทย์แต่งเอง คำนวณตรวจแล้ว

## ไอเดียที่ยังไม่ทำ

- widget BGP route selection / hot potato แบบเลือก gateway เองได้
- โหมดสว่าง (ตอนนี้บังคับ dark ตามที่เจ้าของขอ)
