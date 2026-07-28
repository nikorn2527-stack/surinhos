---
Task ID: 1
Agent: Main Orchestrator
Task: วิเคราะห์ surinhos เดิม + ออกแบบ workflow + implement ครบถ้วน

Work Log:
- วิเคราะห์ repo surinhos ต้นฉบับ (backend Express.js + MySQL, frontend Next.js + DaisyUI)
- อ่าน schema.sql, repairRoutes.js, repairs/page.jsx ทุกไฟล์
- วิเคราะห์ tech stack เดิม vs เรา (frontend ตรงกัน, backend ต่างแต่ column name ต้อง match)
- ออกแบบ workflow 6 สถานะ (เพิ่ม cancelled จากเดิม 5): pending→accepted→in_progress→returned→closed / cancelled
- เพิ่มฟีเจอร์ใหม่ที่ surinhos ไม่มี: เสนอราคาซ่อม (repairCost, laborCost, totalCost, costStatus), ยกเลิก/ไม่คุ้มซ่อม (cancelReason)

Stage Summary:
- Tech stack เดิม: Express.js + MySQL + DaisyUI / เรา: Next.js API Routes + SQLite/Prisma + shadcn/ui
- Column name ทุก field ตรงกับ surinhos MySQL schema
- Library เดียวกับ surinhos: react-signature-canvas, html5-qrcode

---
Task ID: 2
Agent: Main Orchestrator
Task: อัพเดท Prisma Schema + Seed Data

Work Log:
- อัพเดท prisma/schema.prisma: เพิ่ม fields ใหม่ใน RepairTicket (receivedBy, receivedAt, senderSignature, receiverSignature, returnMethod, returnedBy, returnedAt, returnSenderSignature, returnReceiverSignature, repairCost, laborCost, totalCost, costStatus, cancelReason)
- รัน bun run db:push สำเร็จ
- อัพเดท seed.ts: สร้าง 10 locations, 15 assets (รูปแบบ COM-69-001, PRT-69-001, NET-69-001), 6 sample tickets ครอบคลุมทุก 6 สถานะ
- รัน seed สำเร็จ

Stage Summary:
- ไฟล์: prisma/schema.prisma, prisma/seed.ts
- Sample data ครอบคลุม: pending, accepted (มีลายเซ็น), in_progress (มีต้นทุน), returned (มีลายเซ็นส่งคืน), closed (สมบูรณ์), cancelled (มีเหตุผล)

---
Task ID: 3
Agent: full-stack-developer subagent
Task: สร้าง API endpoints สำหรับอัพเดทสถานะ

Work Log:
- สร้าง PUT /api/repairs/[id]/accept — รับเรื่อง + เซ็นชื่อ
- สร้าง PUT /api/repairs/[id]/progress — เริ่มซ่อม
- สร้าง PUT /api/repairs/[id]/return — ส่งคืน + เซ็นชื่อ
- สร้าง PUT /api/repairs/[id]/close — ปิดงาน
- สร้าง PUT /api/repairs/[id]/cancel — ยกเลิก (pending/accepted/in_progress → cancelled)
- สร้าง PUT /api/repairs/[id]/estimate — เสนอราคาซ่อม (ถ้า rejected → auto cancel)
- สร้าง GET /api/repairs/[id]/route.ts — ดึง single ticket

Stage Summary:
- ไฟล์: src/app/api/repairs/route.ts (GET+POST), src/app/api/repairs/[id]/route.ts (GET), src/app/api/repairs/[id]/accept/route.ts, progress, return, close, cancel, estimate
- ทุก endpoint validate status transition ก่อนอนุญาต
- Response รวม include asset + location

---
Task ID: 4
Agent: full-stack-developer subagent
Task: สร้าง Signature Pad + Ticket Detail components

Work Log:
- สร้าง signature-pad.tsx: ใช้ react-signature-canvas, auto-resize, save/clear, preview
- สร้าง ticket-detail.tsx: 1366 บรรทัด, ครอบคลุมทุกฟีเจอร์
  - Header: ticket_no, status badge, date
  - Info card: asset details, problem, reporter
  - Acceptance card: receivedBy, date, signature
  - Cost estimate card: ค่าอะไหล่/แรง/รวม, status badge
  - Return card: method, returnedBy, signatures
  - Status timeline: horizontal visual
  - Action buttons: context-sensitive per status
  - 6 modals: accept, estimate, return, cancel, start repair confirm, close confirm
  - Print system: @media print, ใบแจ้งซ่อม + ใบส่งคืน

Stage Summary:
- ไฟล์: src/components/repair/signature-pad.tsx, src/components/repair/ticket-detail.tsx
- รองรับ responsive design
- ใช้ useMutation (TanStack Query) สำหรับทุก API call

---
Task ID: 5
Agent: Main Orchestrator
Task: อัพเดท RepairList + Page + Responsive Design

Work Log:
- อัพเดท repair-list.tsx: เพิ่ม onTicketClick prop, เปลี่ยน button click, เพิ่ม cancelled status config
- อัพเดท page.tsx: responsive stats grid (4 cols mobile, 7 cols desktop), detail view routing, sticky footer
- แก้ compile error: PackageReturn → PackageOpen, import syntax
- รัน lint ผ่าน 0 errors
- Seed + dev server ทำงาน
- Agent Browser verify: GET / 200, GET /api/repairs 200 (6 tickets), stats แสดงถูกต้อง, list แสดงทุก 6 สถานะ

Stage Summary:
- ไฟล์: src/components/repair/repair-list.tsx, src/app/page.tsx
- หน้า list: responsive stats + รายการ 6 tickets ทุกสถานะ
- หน้า detail: click เข้าดูรายละเอียดพร้อม action buttons

---
Task ID: 2
Agent: Main Orchestrator
Task: ออกแบบใบปริ้นแบบ Thermal Receipt 50mm (บัตรคิว style)

Work Log:
- อ่านและวิเคราะห์ print system เดิมใน ticket-detail.tsx (PrintContent component + @media print CSS)
- สร้าง component ใหม่ `src/components/repair/thermal-receipt.tsx` — Thermal Receipt ขนาด 50mm
  - ฟอนต์ monospace (Noto Sans Thai / Courier New) เหมาะกับ thermal printer
  - เส้นแบ่ง dashed line เลียนแบบขอบกระดาษซอย
  - เลขที่ใบแจ้งซ่อมแสดงขนาดใหญ่ตรงกลาง (เหมือนบัตรคิวร้านอาหาร)
  - รองรับ 2 แบบ: ใบรับซ่อมอุปกรณ์ (repair) และ ใบส่งคืนครุภัณฑ์ (return)
  - รองรับลายเซ็นจริงจาก signature pad (base64 PNG)
  - รองรับข้อมูลค่าใช้จ่าย, สถานะ 6 แบบ (สีต่างกัน), ข้อมูลการยกเลิก
  - Print CSS: @page { size: 50mm auto } พิมพ์ตรงตามขนาดกระดาษ
  - Preview mode: ขยาย 2.2x พร้อม shadow เพื่อให้เห็นชัดบนหน้าจอ
- อัพเดท `ticket-detail.tsx`:
  - เปลี่ยน handlePrint ให้เปิด Preview Dialog แทน window.print ตรง
  - เพิ่ม Receipt Preview Dialog (พรีวิวใบรับซ่อม/ส่งคืน ก่อนปริ้น)
  - เพิ่มปุ่มปริ้นในหลายสถานะ (accepted, returned, closed)
  - ลบ PrintContent component เดิมออก
- สร้าง `public/receipt-preview.html` — standalone demo page แสดงตัวอย่างทั้ง 2 แบบ
- ทดสอบผ่าน agent-browser: เปิด file:// receipt-preview.html สำเร็จ
  - ตรวจสอบ accessibility tree: receipt content แสดงครบ (เลขที่, ชื่อ, ปัญหา, ลายเซ็น, ค่าใช้จ่าย)
  - Screenshot ทั้ง desktop (1920px) และ mobile (375px) viewport

Stage Summary:
- Thermal Receipt component พร้อมใช้งาน: `src/components/repair/thermal-receipt.tsx`
- อัพเดท ticket-detail.tsx พร้อม receipt preview dialog
- Standalone demo: `public/receipt-preview.html` (ดูได้โดยตรงไม่ต้องรัน server)
- Screenshot: screenshot-receipt.png (desktop), screenshot-receipt-mobile.png (mobile)
