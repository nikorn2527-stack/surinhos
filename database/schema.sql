-- สร้างฐานข้อมูล
CREATE DATABASE IF NOT EXISTS surinhos_asset CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE surinhos_asset;

-- สร้างตารางสถานที่ (สร้างก่อนเพราะต้องถูกอ้างอิง)
CREATE TABLE locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    building_name VARCHAR(100) NOT NULL,
    room_name VARCHAR(100) NOT NULL
);

-- สร้างตารางครุภัณฑ์
CREATE TABLE assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    location_id INT,
    status VARCHAR(50) DEFAULT 'ปกติ',
    acquired_date DATE,
    price DECIMAL(10,2),
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
);

-- ================= ตารางแจ้งซ่อม (Repair Tickets) =================
CREATE TABLE IF NOT EXISTS repair_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_no VARCHAR(20) NOT NULL UNIQUE COMMENT 'เลขที่ใบแจ้งซ่อม เช่น RPR-260728-001',
    asset_id INT DEFAULT NULL COMMENT 'ID ครุภัณฑ์ (ถ้ามี)',
    asset_name VARCHAR(255) NOT NULL COMMENT 'ชื่ออุปกรณ์ / สถานที่',
    problem_details TEXT COMMENT 'รายละเอียดปัญหา',
    reporter_name VARCHAR(100) COMMENT 'ชื่อผู้แจ้ง',
    status ENUM('pending', 'accepted', 'in_progress', 'returned', 'closed') DEFAULT 'pending',
    
    -- ข้อมูลรับเรื่อง
    received_by VARCHAR(100) DEFAULT NULL COMMENT 'ชื่อช่างผู้รับเรื่อง',
    received_at DATETIME DEFAULT NULL,
    sender_signature LONGTEXT DEFAULT NULL COMMENT 'ลายเซ็นผู้แจ้ง (Base64)',
    receiver_signature LONGTEXT DEFAULT NULL COMMENT 'ลายเซ็นช่าง (Base64)',
    
    -- ข้อมูลส่งคืน
    return_method VARCHAR(50) DEFAULT NULL COMMENT 'วิธีส่งคืน: หน่วยงานมารับเอง / ช่างไปส่งคืน',
    returned_by VARCHAR(100) DEFAULT NULL COMMENT 'ผู้ส่งคืน/ผู้รับคืน',
    returned_at DATETIME DEFAULT NULL,
    return_sender_signature LONGTEXT DEFAULT NULL COMMENT 'ลายเซ็นผู้ส่งคืน (Base64)',
    return_receiver_signature LONGTEXT DEFAULT NULL COMMENT 'ลายเซ็นผู้รับคืน (Base64)',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ลองเพิ่มข้อมูลจำลอง (Mock Data) เข้าไปทดสอบ
INSERT INTO locations (building_name, room_name) VALUES ('อาคารอำนวยการ', 'ห้องไอที ชั้น 2');
INSERT INTO assets (asset_code, name, category, location_id, status, price) 
VALUES ('COM-69-001', 'คอมพิวเตอร์แม่ข่าย (Server)', 'อุปกรณ์คอมพิวเตอร์', 1, 'ปกติ', 150000.00);