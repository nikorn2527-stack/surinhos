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

  // สร้างแจ้งซ่อมตัวอย่าง 2 รายการ
  const serverAsset = await db.asset.findFirst({ where: { assetCode: 'COM-69-001' } })
  const printerAsset = await db.asset.findFirst({ where: { assetCode: 'PRT-69-001' } })

  if (serverAsset) {
    await db.repairTicket.create({
      data: {
        ticketNo: 'RPR-260727-001',
        assetId: serverAsset.id,
        assetName: serverAsset.name,
        problemDetails: 'เปิดเครื่องไม่ติด ไฟกระพริบที่ปุ่ม power',
        reporterName: 'สมชาย ใจดี',
        status: 'accepted',
      },
    })
    console.log('  ✅ RPR-260727-001')
  }

  if (printerAsset) {
    await db.repairTicket.create({
      data: {
        ticketNo: 'RPR-260728-001',
        assetId: printerAsset.id,
        assetName: printerAsset.name,
        problemDetails: 'กระดาษตัน แม้เปิดปิดเครื่องใหม่แล้ว',
        reporterName: 'สุภาพร รักงาน',
        status: 'pending',
      },
    })
    console.log('  ✅ RPR-260728-001')
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
