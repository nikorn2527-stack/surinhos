import { db } from '../src/lib/db'

async function main() {
  console.log('🌱 Seeding assets...')

  // Delete existing
  await db.repair.deleteMany()
  await db.asset.deleteMany()

  const assets = [
    { assetNo: 'INV-2024-001', name: 'คอมพิวเตอร์ Dell OptiPlex 7090', category: 'คอมพิวเตอร์', brand: 'Dell', model: 'OptiPlex 7090', serialNo: 'DL7090X-20240001', location: 'ห้อง 101', department: 'แผนกบัญชี', status: 'active' },
    { assetNo: 'INV-2024-002', name: 'เครื่องพิมพ์ HP LaserJet Pro M404', category: 'เครื่องพิมพ์', brand: 'HP', model: 'LaserJet Pro M404', serialNo: 'HPM404-20240002', location: 'ห้อง 102', department: 'แผนกบัญชี', status: 'active' },
    { assetNo: 'INV-2024-003', name: 'คอมพิวเตอร์ Lenovo ThinkCentre M90q', category: 'คอมพิวเตอร์', brand: 'Lenovo', model: 'ThinkCentre M90q', serialNo: 'LN90Q-20240003', location: 'ห้อง 201', department: 'แผนกบุคคล', status: 'active' },
    { assetNo: 'INV-2024-004', name: 'โน้ตบุ๊ค ASUS ExpertBook B9', category: 'คอมพิวเตอร์', brand: 'ASUS', model: 'ExpertBook B9', serialNo: 'ASB9-20240004', location: 'ห้อง 202', department: 'แผนกบุคคล', status: 'active' },
    { assetNo: 'INV-2024-005', name: 'เครื่องสแกนเอกสาร Fujitsu ScanSnap iX1600', category: 'เครื่องสแกน', brand: 'Fujitsu', model: 'ScanSnap iX1600', serialNo: 'FJ1600-20240005', location: 'ห้อง 103', department: 'แผนกวิจัยและพัฒนา', status: 'active' },
    { assetNo: 'INV-2024-006', name: 'เซิร์ฟเวอร์ Dell PowerEdge R750', category: 'เซิร์ฟเวอร์', brand: 'Dell', model: 'PowerEdge R750', serialNo: 'DLR750-20240006', location: 'ห้องเซิร์ฟเวอร์', department: 'แผนกระบบสารสนเทศ', status: 'active' },
    { assetNo: 'INV-2024-007', name: 'อัปเทตเตอร์ Cisco Catalyst 9200', category: 'อุปกรณ์เครือข่าย', brand: 'Cisco', model: 'Catalyst 9200', serialNo: 'CS9200-20240007', location: 'ห้องเซิร์ฟเวอร์', department: 'แผนกระบบสารสนเทศ', status: 'active' },
    { assetNo: 'INV-2024-008', name: 'โปรเจกเตอร์ Epson EB-L260F', category: 'เครื่องฉาย', brand: 'Epson', model: 'EB-L260F', serialNo: 'EP260F-20240008', location: 'ห้องประชุม A', department: 'สำนักบริหาร', status: 'active' },
    { assetNo: 'INV-2024-009', name: 'เครื่องพิมพ์ Canon imageCLASS MF743Cdw', category: 'เครื่องพิมพ์', brand: 'Canon', model: 'imageCLASS MF743Cdw', serialNo: 'CN743C-20240009', location: 'ห้อง 105', department: 'แผนกจัดซื้อ', status: 'active' },
    { assetNo: 'INV-2024-010', name: 'จอภาพ LG 27UK850-W', category: 'จอภาพ', brand: 'LG', model: '27UK850-W', serialNo: 'LG27UK-20240010', location: 'ห้อง 301', department: 'แผนกการตลาด', status: 'active' },
    { assetNo: 'INV-2024-011', name: 'คอมพิวเตอร์ HP ProDesk 400 G7', category: 'คอมพิวเตอร์', brand: 'HP', model: 'ProDesk 400 G7', serialNo: 'HP400G7-20240011', location: 'ห้อง 302', department: 'แผนกการตลาด', status: 'active' },
    { assetNo: 'INV-2024-012', name: 'เร้าเตอร์ TP-Link Archer AX6000', category: 'อุปกรณ์เครือข่าย', brand: 'TP-Link', model: 'Archer AX6000', serialNo: 'TPL6000-20240012', location: 'ชั้น 3', department: 'แผนกระบบสารสนเทศ', status: 'active' },
    { assetNo: 'INV-2024-013', name: 'เครื่องถ่ายเอกสาร Ricoh MP C3004', category: 'เครื่องถ่ายเอกสาร', brand: 'Ricoh', model: 'MP C3004', serialNo: 'RC3004-20240013', location: 'ห้องถ่ายเอกสาร', department: 'สำนักบริหาร', status: 'active' },
    { assetNo: 'INV-2024-014', name: 'โน้ตบุ๊ค Acer TravelMate P2', category: 'คอมพิวเตอร์', brand: 'Acer', model: 'TravelMate P2', serialNo: 'ACTP2-20240014', location: 'ห้อง 401', department: 'แผนกกฎหมาย', status: 'active' },
    { assetNo: 'INV-2024-015', name: 'เครื่องพิมพ์ Brother HL-L2350DW', category: 'เครื่องพิมพ์', brand: 'Brother', model: 'HL-L2350DW', serialNo: 'BR2350-20240015', location: 'ห้อง 402', department: 'แผนกกฎหมาย', status: 'inactive' },
  ]

  for (const asset of assets) {
    await db.asset.create({ data: asset })
    console.log(`  ✅ ${asset.assetNo} - ${asset.name}`)
  }

  // Create some sample repairs
  const sampleRepairs = [
    {
      ticketNo: 'RPR-2025-001',
      assetId: (await db.asset.findFirst({ where: { assetNo: 'INV-2024-001' } }))!.id,
      problemCategory: 'ฮาร์ดแวร์',
      description: 'เปิดเครื่องไม่ติด ไฟกระพริบที่ปุ่ม power ไม่สามารถบูตเข้าระบบได้',
      urgency: 'ด่วน',
      reporterName: 'สมชาย ใจดี',
      reporterPhone: '081-234-5678',
      reporterDept: 'แผนกบัญชี',
      status: 'in_progress',
      notes: 'นัดเข้าซ่อมวันที่ 20 ก.ค.',
    },
    {
      ticketNo: 'RPR-2025-002',
      assetId: (await db.asset.findFirst({ where: { assetNo: 'INV-2024-002' } }))!.id,
      problemCategory: 'ฮาร์ดแวร์',
      description: 'กระดาษตัน เปิดปิดเครื่องแล้วยังมีปัญหาเดิม กระดาษติดในเลเซอร์',
      urgency: 'ปกติ',
      reporterName: 'สุภาพร รักงาน',
      reporterPhone: '082-345-6789',
      reporterDept: 'แผนกบัญชี',
      status: 'pending',
    },
  ]

  for (const repair of sampleRepairs) {
    await db.repair.create({ data: repair })
    console.log(`  ✅ ${repair.ticketNo}`)
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
