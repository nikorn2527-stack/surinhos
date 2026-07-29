-- =============================================================
-- Migration: เพิ่ม field ใหม่ในตาราง repair_tickets
-- สำหรับระบบแจ้งซ่อมที่สมบูรณ์ขึ้น
-- Run: mysql -u root -p surinhos_asset < database/migrate_repair_enhanced.sql
-- =============================================================

-- 1. เพิ่ม field รูปภาพ
ALTER TABLE repair_tickets
  ADD COLUMN IF NOT EXISTS photos LONGTEXT DEFAULT NULL COMMENT 'JSON array ของ base64 data URLs รูปประกอบการแจ้งซ่อม';

-- 2. เพิ่ม field เสนอราคาซ่อม
ALTER TABLE repair_tickets
  ADD COLUMN IF NOT EXISTS repair_cost DECIMAL(10,2) DEFAULT NULL COMMENT 'ค่าอะไหล่ (บาท)',
  ADD COLUMN IF NOT EXISTS labor_cost DECIMAL(10,2) DEFAULT NULL COMMENT 'ค่าแรงงาน (บาท)',
  ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT NULL COMMENT 'รวมค่าใช้จ่ายทั้งหมด (บาท)',
  ADD COLUMN IF NOT EXISTS cost_status VARCHAR(20) DEFAULT NULL COMMENT 'สถานะอนุมัติค่าใช้จ่าย: pending/approved/rejected';

-- 3. เพิ่ม field ยกเลิก
ALTER TABLE repair_tickets
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT DEFAULT NULL COMMENT 'เหตุผลการยกเลิก';

-- 4. เพิ่ม field ตีแทงจำหน่าย
ALTER TABLE repair_tickets
  ADD COLUMN IF NOT EXISTS disposal_status VARCHAR(30) DEFAULT NULL COMMENT 'สถานะจำหน่าย: pending_review/approved/disposed',
  ADD COLUMN IF NOT EXISTS disposal_reason TEXT DEFAULT NULL COMMENT 'เหตุผลที่ต้องจำหน่าย',
  ADD COLUMN IF NOT EXISTS disposal_method VARCHAR(50) DEFAULT NULL COMMENT 'วิธีจำหน่าย: จำหน่าย/ชำระ, ทำลาย, บริจาค',
  ADD COLUMN IF NOT EXISTS disposal_value DECIMAL(10,2) DEFAULT NULL COMMENT 'ราคาประเมิน/ราคาชำระ (บาท)',
  ADD COLUMN IF NOT EXISTS disposal_approved_by VARCHAR(100) DEFAULT NULL COMMENT 'ผู้อนุมัติจำหน่าย',
  ADD COLUMN IF NOT EXISTS disposal_approved_at DATETIME DEFAULT NULL COMMENT 'วันอนุมัติจำหน่าย',
  ADD COLUMN IF NOT EXISTS disposal_com_ref VARCHAR(100) DEFAULT NULL COMMENT 'เลขที่หนังสือคณะกรรมการ (ครม.)';

-- 5. เพิ่ม ENUM สถานะใหม่: cancelled, disposed
-- ต้อง drop enum แล้วสร้างใหม่เพื่อเพิ่มค่า
ALTER TABLE repair_tickets
  MODIFY COLUMN status ENUM('pending', 'accepted', 'in_progress', 'returned', 'closed', 'cancelled', 'disposed') DEFAULT 'pending';
