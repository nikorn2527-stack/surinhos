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

-- ลองเพิ่มข้อมูลจำลอง (Mock Data) เข้าไปทดสอบ
INSERT INTO locations (building_name, room_name) VALUES ('อาคารอำนวยการ', 'ห้องไอที ชั้น 2');
INSERT INTO assets (asset_code, name, category, location_id, status, price) 
VALUES ('COM-69-001', 'คอมพิวเตอร์แม่ข่าย (Server)', 'อุปกรณ์คอมพิวเตอร์', 1, 'ปกติ', 150000.00);