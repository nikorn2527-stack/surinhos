import { db } from '../src/lib/db'

async function main() {
  console.log('🌱 Seeding surinhos data...')

  // Delete existing
  await db.repairTicket.deleteMany()
  await db.asset.deleteMany()
  await db.location.deleteMany()

  // สร้างสถานที่ (locations)
  const loc1 = await db.location.create({ data: { buildingName: 'อาคารอำนวยการ', roomName: 'ห้องไอที ชั้น 2' } })
  const loc2 = await db.location.create({ data: { buildingName: 'อาคารอำนวยการ', roomName: 'ห้อง 101' } })
  const loc3 = await db.location.create({ data: { buildingName: 'อาคารอำนวยการ', roomName: 'ห้อง 102' } })
  const loc4 = await db.location.create({ data: { buildingName: 'อาคารอำนวยการ', roomName: 'ห้อง 103' } })
  const loc5 = await db.location.create({ data: { buildingName: 'อาคารเรียนรวม', roomName: 'ห้อง 201' } })
  const loc6 = await db.location.create({ data: { buildingName: 'อาคารเรียนรวม', roomName: 'ห้อง 202' } })
  const loc7 = await db.location.create({ data: { buildingName: 'อาคารเรียนรวม', roomName: 'ห้องประชุม A' } })
  const loc8 = await db.location.create({ data: { buildingName: 'อาคารอำนวยการ', roomName: 'ห้องเซิร์ฟเวอร์' } })
  const loc9 = await db.location.create({ data: { buildingName: 'อาคารอำนวยการ', roomName: 'ห้อง 105' } })
  const loc10 = await db.location.create({ data: { buildingName: 'อาคารเรียนรวม', roomName: 'ห้อง 301' } })

  // สร้างครุภัณฑ์ (assets) — รูปแบบ asset_code ตาม surinhos
  const assets = [
    { assetCode: 'COM-69-001', name: 'คอมพิวเตอร์แม่ข่าย (Server)', category: 'อุปกรณ์คอมพิวเตอร์', locationId: loc8.id, status: 'ปกติ', price: 150000 },
    { assetCode: 'COM-69-002', name: 'คอมพิวเตอร์ Dell OptiPlex 7090', category: 'อุปกรณ์คอมพิวเตอร์', locationId: loc2.id, status: 'ปกติ', price: 35000 },
    { assetCode: 'COM-69-003', name: 'คอมพิวเตอร์ Dell OptiPlex 7090', category: 'อุปกรณ์คอมพิวเตอร์', locationId: loc3.id, status: 'ปกติ', price: 35000 },
    { assetCode: 'COM-69-004', name: 'คอมพิวเตอร์ Lenovo ThinkCentre', category: 'อุปกรณ์คอมพิวเตอร์', locationId: loc5.id, status: 'ปกติ', price: 28000 },
    { assetCode: 'COM-69-005', name: 'โน้ตบุ๊ค ASUS ExpertBook B9', category: 'อุปกรณ์คอมพิวเตอร์', locationId: loc6.id, status: 'ปกติ', price: 42000 },
    { assetCode: 'COM-69-006', name: 'โน้ตบุ๊ค HP ProBook 450', category: 'อุปกรณ์คอมพิวเตอร์', locationId: loc1.id, status: 'ชำรุด', price: 32000 },
    { assetCode: 'PRT-69-001', name: 'เครื่องพิมพ์ HP LaserJet Pro M404', category: 'เครื่องพิมพ์', locationId: loc3.id, status: 'ปกติ', price: 18000 },
    { assetCode: 'PRT-69-002', name: 'เครื่องพิมพ์ Canon imageCLASS MF743', category: 'เครื่องพิมพ์', locationId: loc9.id, status: 'ปกติ', price: 25000 },
    { assetCode: 'PRT-69-003', name: 'เครื่องพิมพ์ Brother HL-L2350DW', category: 'เครื่องพิมพ์', locationId: loc10.id, status: 'ปกติ', price: 8000 },
    { assetCode: 'NET-69-001', name: 'อัปเทตเตอร์ Cisco Catalyst 9200', category: 'อุปกรณ์เครือข่าย', locationId: loc8.id, status: 'ปกติ', price: 85000 },
    { assetCode: 'NET-69-002', name: 'เร้าเตอร์ TP-Link Archer AX6000', category: 'อุปกรณ์เครือข่าย', locationId: loc1.id, status: 'ปกติ', price: 5500 },
    { assetCode: 'PRJ-69-001', name: 'โปรเจกเตอร์ Epson EB-L260F', category: 'เครื่องฉาย', locationId: loc7.id, status: 'ปกติ', price: 45000 },
    { assetCode: 'SCN-69-001', name: 'เครื่องสแกน Fujitsu ScanSnap iX1600', category: 'เครื่องสแกน', locationId: loc4.id, status: 'ปกติ', price: 22000 },
    { assetCode: 'MON-69-001', name: 'จอภาพ LG 27UK850-W 4K', category: 'จอภาพ', locationId: loc10.id, status: 'ปกติ', price: 15000 },
    { assetCode: 'SVR-69-001', name: 'เซิร์ฟเวอร์ Dell PowerEdge R750', category: 'เซิร์ฟเวอร์', locationId: loc8.id, status: 'ปกติ', price: 250000 },
  ]

  for (const asset of assets) {
    await db.asset.create({ data: asset })
    console.log(`  ✅ ${asset.assetCode} - ${asset.name}`)
  }

  // ดึงข้อมูลครุภัณฑ์สำหรับแจ้งซ่อม
  const serverAsset = await db.asset.findFirst({ where: { assetCode: 'COM-69-001' } })
  const printerAsset = await db.asset.findFirst({ where: { assetCode: 'PRT-69-001' } })
  const notebookAsset = await db.asset.findFirst({ where: { assetCode: 'COM-69-005' } })
  const routerAsset = await db.asset.findFirst({ where: { assetCode: 'NET-69-002' } })
  const projectorAsset = await db.asset.findFirst({ where: { assetCode: 'PRJ-69-001' } })
  const scannerAsset = await db.asset.findFirst({ where: { assetCode: 'SCN-69-001' } })

  // สร้างแจ้งซ่อมตัวอย่าง 6 รายการ ครอบคลุมทุกสถานะ

  // 1. pending — เพิ่งแจ้ง ยังไม่ได้รับเข้าซ่อม
  if (printerAsset) {
    await db.repairTicket.create({
      data: {
        ticketNo: 'RPR-260725-001',
        assetId: printerAsset.id,
        assetName: printerAsset.name,
        problemDetails: 'กระดาษตัน แม้เปิดปิดเครื่องใหม่แล้ว ใช้งานไม่ได้เลย',
        reporterName: 'สุภาพร รักงาน',
        status: 'pending',
      },
    })
    console.log('  ✅ RPR-260725-001 [pending]')
  }

  // 2. accepted — รับเข้าซ่อมแล้ว มีข้อมูลผู้รับ
  if (serverAsset) {
    await db.repairTicket.create({
      data: {
        ticketNo: 'RPR-260720-001',
        assetId: serverAsset.id,
        assetName: serverAsset.name,
        problemDetails: 'เปิดเครื่องไม่ติด ไฟกระพริบที่ปุ่ม power',
        reporterName: 'สมชาย ใจดี',
        senderSignature: 'data:image/png;base64,fake_signature_data_1',
        status: 'accepted',
        receivedBy: 'วิชัย ซ่อมดี',
        receivedAt: new Date('2025-07-20T10:30:00.000Z'),
        receiverSignature: 'data:image/png;base64,fake_signature_data_2',
      },
    })
    console.log('  ✅ RPR-260720-001 [accepted]')
  }

  // 3. in_progress — กำลังซ่อม มีราคาค่าซ่อมแล้ว
  if (notebookAsset) {
    await db.repairTicket.create({
      data: {
        ticketNo: 'RPR-260718-001',
        assetId: notebookAsset.id,
        assetName: notebookAsset.name,
        problemDetails: 'จอภาพเบลอ มีจุดสว่างผิดปกติหลายจุด',
        reporterName: 'ธนา พิมพ์ดี',
        senderSignature: 'data:image/png;base64,fake_signature_data_3',
        status: 'in_progress',
        receivedBy: 'วิชัย ซ่อมดี',
        receivedAt: new Date('2025-07-18T09:00:00.000Z'),
        receiverSignature: 'data:image/png;base64,fake_signature_data_4',
        repairCost: 4500.00,
        laborCost: 1500.00,
        totalCost: 6000.00,
        costStatus: 'approved',
      },
    })
    console.log('  ✅ RPR-260718-001 [in_progress]')
  }

  // 4. returned — ซ่อมเสร็จ ส่งคืนแล้ว ข้อมูลครบ
  if (routerAsset) {
    await db.repairTicket.create({
      data: {
        ticketNo: 'RPR-260715-001',
        assetId: routerAsset.id,
        assetName: routerAsset.name,
        problemDetails: 'สัญญาณ Wi-Fi ไม่เสถียร หลุดบ่อย',
        reporterName: 'ประยุทธ์ รักเทคโนโลยี',
        senderSignature: 'data:image/png;base64,fake_signature_data_5',
        status: 'returned',
        receivedBy: 'วิชัย ซ่อมดี',
        receivedAt: new Date('2025-07-15T14:00:00.000Z'),
        receiverSignature: 'data:image/png;base64,fake_signature_data_6',
        repairCost: 800.00,
        laborCost: 500.00,
        totalCost: 1300.00,
        costStatus: 'approved',
        returnMethod: 'ส่งมอบถึงห้อง',
        returnedBy: 'วิชัย ซ่อมดี',
        returnedAt: new Date('2025-07-17T11:00:00.000Z'),
        returnSenderSignature: 'data:image/png;base64,fake_signature_data_7',
        returnReceiverSignature: 'data:image/png;base64,fake_signature_data_8',
      },
    })
    console.log('  ✅ RPR-260715-001 [returned]')
  }

  // 5. closed — ปิดงานแล้ว ข้อมูลครบทุกฟิลด์
  if (projectorAsset) {
    await db.repairTicket.create({
      data: {
        ticketNo: 'RPR-260710-001',
        assetId: projectorAsset.id,
        assetName: projectorAsset.name,
        problemDetails: 'ภาพเบลอ สีเพี้ยน ตัวเลือนไม่ทำงาน',
        reporterName: 'วรรณา สอนดี',
        senderSignature: 'data:image/png;base64,fake_signature_data_9',
        status: 'closed',
        receivedBy: 'วิชัย ซ่อมดี',
        receivedAt: new Date('2025-07-10T08:30:00.000Z'),
        receiverSignature: 'data:image/png;base64,fake_signature_data_10',
        repairCost: 12000.00,
        laborCost: 3000.00,
        totalCost: 15000.00,
        costStatus: 'paid',
        returnMethod: 'ส่งมอบถึงห้อง',
        returnedBy: 'วิชัย ซ่อมดี',
        returnedAt: new Date('2025-07-14T16:00:00.000Z'),
        returnSenderSignature: 'data:image/png;base64,fake_signature_data_11',
        returnReceiverSignature: 'data:image/png;base64,fake_signature_data_12',
      },
    })
    console.log('  ✅ RPR-260710-001 [closed]')
  }

  // 6. cancelled — ยกเลิก เนื่องจากไม่คุ้มค่ากับการซ่อม
  if (scannerAsset) {
    await db.repairTicket.create({
      data: {
        ticketNo: 'RPR-260712-001',
        assetId: scannerAsset.id,
        assetName: scannerAsset.name,
        problemDetails: 'กระดาษฉีกขณะสแกน แทร็คปิดไม่สนิท',
        reporterName: 'สมหญิง รักการ์ด',
        status: 'cancelled',
        cancelReason: 'อะแดปเตอร์หมดสต็อก ยี่ห้อหยุดผลิตรุ่นนี้แล้ว ค่าอะไหล่เกินกว่าราคาซื้อเครื่องใหม่ (ราคาซ่อมประมาณ 15,000 บาท เทียบกับราคาเครื่องใหม่ 12,000 บาท) จึงไม่คุ้มค่ากับการซ่อม',
      },
    })
    console.log('  ✅ RPR-260712-001 [cancelled]')
  }

  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
