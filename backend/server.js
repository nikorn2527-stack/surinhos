const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer'); 
const xlsx = require('xlsx'); 
const fs = require('fs');

const app = express();
app.use(cors());

// ขยายขนาด limit ของ JSON สำหรับรองรับการส่งรูปภาพ Base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const SECRET_KEY = 'pacific_plus_it_secret_key_2026';

// ================= 💡 1. ด่านตรวจความปลอดภัย & ป้องกัน Login ซ้อน ================= //
const verifyToken = (req, res, next) => {
    // รับ Token จาก Header ที่ Frontend ส่งมา
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ', forceLogout: true });

    // ตรวจสอบความถูกต้องและวันหมดอายุของ Token
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'เซสชันหมดอายุ', forceLogout: true });

        // ตรวจสอบกับฐานข้อมูลว่า Token ตรงกับของล่าสุดหรือไม่ (ป้องกัน Login ซ้อน)
        db.query('SELECT current_token FROM users WHERE id = ?', [decoded.id], (dbErr, results) => {
            if (dbErr || results.length === 0) return res.status(500).json({ error: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });

            const latestToken = results[0].current_token;
            if (latestToken !== token) {
                return res.status(401).json({ error: 'มีการเข้าสู่ระบบจากอุปกรณ์อื่น ระบบจะนำคุณออก', forceLogout: true });
            }

            req.user = decoded; // ให้ข้อมูล user แนบไปกับ request เพื่อให้ API อื่นๆ นำไปใช้ต่อได้
            next(); // ผ่านด่านได้
        });
    });
};

// ตั้งค่าอัปโหลดไฟล์ชั่วคราว
const upload = multer({ dest: 'uploads/' });

// ตั้งค่าเชื่อมต่อฐานข้อมูล
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'surinhos_asset'
});

db.connect((err) => {
    if (err) throw err;
    console.log('MySQL Connected...');
});

// ================= API สำหรับตั้งค่าหน่วยงาน (Organization Settings) ================= //
app.get('/api/settings/organization', (req, res) => {
    db.query('SELECT * FROM organization_settings WHERE id = 1', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length > 0) {
            const data = results[0];
            res.json({
                logo: data.logo || '',
                prefix: data.prefix || 'บริษัท',
                orgName: data.org_name || '',
                address: data.address || '',
                subdistrict: data.subdistrict || '',
                district: data.district || '',
                province: data.province || '',
                zipcode: data.zipcode || '',
                phone: data.phone || '',
                extension: data.extension || '',
                email: data.email || '',
                taxId: data.tax_id || ''
            });
        } else {
            res.json(null);
        }
    });
});

app.post('/api/settings/organization', (req, res) => {
    const { 
        logo, prefix, orgName, address, subdistrict, 
        district, province, zipcode, phone, extension, email, taxId 
    } = req.body;

    db.query('SELECT id FROM organization_settings WHERE id = 1', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length > 0) {
            const sql = `
                UPDATE organization_settings SET 
                    logo = ?, prefix = ?, org_name = ?, address = ?, subdistrict = ?, 
                    district = ?, province = ?, zipcode = ?, phone = ?, extension = ?, 
                    email = ?, tax_id = ? 
                WHERE id = 1
            `;
            db.query(sql, [logo, prefix, orgName, address, subdistrict, district, province, zipcode, phone, extension, email, taxId], (updateErr) => {
                if (updateErr) return res.status(500).json({ error: updateErr.message });
                res.json({ message: 'บันทึกข้อมูลหน่วยงานเรียบร้อยแล้ว' });
            });
        } else {
            const sql = `
                INSERT INTO organization_settings 
                (id, logo, prefix, org_name, address, subdistrict, district, province, zipcode, phone, extension, email, tax_id) 
                VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            db.query(sql, [logo, prefix, orgName, address, subdistrict, district, province, zipcode, phone, extension, email, taxId], (insertErr) => {
                if (insertErr) return res.status(500).json({ error: insertErr.message });
                res.json({ message: 'บันทึกข้อมูลหน่วยงานเรียบร้อยแล้ว' });
            });
        }
    });
});

// ================= API สำหรับจัดการผู้ใช้งาน (Users & Roles) ================= //
app.get('/api/roles', (req, res) => {
    db.query('SELECT * FROM roles ORDER BY id ASC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/users', verifyToken, (req, res) => {
    const sql = `
        SELECT u.id, u.username, u.name, u.role_id, r.name AS role_name 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        ORDER BY u.id DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/users', (req, res) => {
    const { username, password, name, role_id } = req.body;
    db.query('SELECT id FROM users WHERE username = ?', [username], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) return res.status(400).json({ error: 'ชื่อผู้ใช้งาน (Username) นี้มีในระบบแล้ว' });

        db.query('INSERT INTO users (username, password, name, role_id) VALUES (?, ?, ?, ?)', 
        [username, password, name, role_id], (insertErr) => {
            if (insertErr) return res.status(500).json({ error: insertErr.message });
            res.json({ message: 'เพิ่มผู้ใช้งานสำเร็จ' });
        });
    });
});

app.put('/api/users/:id', (req, res) => {
    const { username, password, name, role_id } = req.body;
    if (password) {
        db.query('UPDATE users SET username = ?, password = ?, name = ?, role_id = ? WHERE id = ?', 
        [username, password, name, role_id, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'อัปเดตข้อมูลสำเร็จ' });
        });
    } else {
        db.query('UPDATE users SET username = ?, name = ?, role_id = ? WHERE id = ?', 
        [username, name, role_id, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'อัปเดตข้อมูลสำเร็จ' });
        });
    }
});

app.delete('/api/users/:id', (req, res) => {
    db.query('DELETE FROM users WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'ลบผู้ใช้งานสำเร็จ' });
    });
});

// ================= API สำหรับนำเข้าข้อมูลจาก Excel ================= //
app.post('/api/assets/import', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'ไม่พบไฟล์' });

    try {
        const workbook = xlsx.readFile(req.file.path, { cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (data.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'ไม่พบข้อมูลในไฟล์ Excel' });
        }

        const formatSafeDate = (dateVal) => {
            if (!dateVal) return null;
            try {
                if (typeof dateVal === 'number') {
                    const date = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
                    if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
                }
                const d = new Date(dateVal);
                if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
                return null;
            } catch (e) {
                return null;
            }
        };

        db.query("SELECT * FROM system_settings WHERE setting_key IN ('asset_prefix', 'asset_digit_length', 'asset_last_number')", (err, results) => {
            if (err) {
                fs.unlinkSync(req.file.path);
                return res.status(500).json({ error: err.message });
            }

            let config = {};
            if (results && results.length > 0) {
                results.forEach(r => config[r.setting_key] = r.setting_value);
            }

            let prefix = config.asset_prefix || 'SR-';
            let digitLength = parseInt(config.asset_digit_length || 7);
            let lastNumber = parseInt(config.asset_last_number || 0);
            
            let currentLastNumber = lastNumber; 

            const values = data.map((row) => {
                let assetCode = row['หมายเลขควบคุม'];
                if (!assetCode || assetCode.toString().trim() === '') {
                    currentLastNumber += 1;
                    let paddedNumber = String(currentLastNumber).padStart(digitLength, '0');
                    assetCode = `${prefix}${paddedNumber}`;
                }

                return [
                    assetCode,
                    row['หมายเลขครุภัณฑ์ 1'] || null,
                    row['หมายเลขครุภัณฑ์ 2'] || null,
                    row['รายการ'] || 'ไม่มีชื่อรายการ',
                    row['ยี่ห้อ'] || null,
                    row['Serial Number'] || null,
                    row['ประเภทครุภัณฑ์'] || 'อื่นๆ',
                    parseFloat(row['ราคา']) || 0,
                    formatSafeDate(row['วันที่ได้มา']), 
                    row['วิธีการได้มา'] || null,
                    row['ผู้ขาย'] || null,
                    parseInt(row['อายุการใช้งาน']) || 5,
                    row['สถานที่ตั้ง'] || null,
                    'ใช้งานปกติ', 
                    1 
                ];
            });

            const sql = `
                INSERT INTO assets (
                    asset_code, asset_number_1, asset_number_2, name, brand, serial_number, 
                    category, price, acquired_date, acquired_method, vendor, 
                    lifespan_years, department, status, location_id
                ) VALUES ?
            `;

            db.query(sql, [values], (insertErr, result) => {
                fs.unlinkSync(req.file.path); 
                if (insertErr) return res.status(500).json({ error: insertErr.message });

                if (currentLastNumber > lastNumber) {
                    db.query("UPDATE system_settings SET setting_value = ? WHERE setting_key = 'asset_last_number'", [currentLastNumber.toString()]);
                }
                res.json({ message: `นำเข้าข้อมูลและสร้างหมายเลขควบคุมอัตโนมัติเรียบร้อยแล้ว จำนวน ${result.affectedRows} รายการ` });
            });
        });
    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: 'รูปแบบไฟล์ไม่ถูกต้อง หรือเกิดข้อผิดพลาด: ' + error.message });
    }
});

// ================= API สำหรับ ครุภัณฑ์ (Assets) ================= //
app.get('/api/assets', verifyToken, (req, res) => {
    db.query('SELECT * FROM assets ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 💡 สร้างครุภัณฑ์ใหม่ (รองรับการเซฟรูปภาพสูงสุด 5 รูป)
app.post('/api/assets', (req, res) => {
    const { 
        asset_code, asset_number_1, asset_number_2, name, brand, serial_number, category, 
        quantity, unit, remarks, acquired_date, acquired_method, funding_type, 
        document_no, po_number, gfmis, price, lifespan_years, warranty_end, 
        vendor, vendor_address, vendor_phone, building, floor, department, status, images // 💡 รับตัวแปร images มาด้วย
    } = req.body;

    const sql = `
        INSERT INTO assets (
            asset_code, asset_number_1, asset_number_2, name, brand, serial_number, category, 
            quantity, unit, remarks, acquired_date, acquired_method, funding_type, 
            document_no, po_number, gfmis, price, lifespan_years, warranty_end, 
            vendor, vendor_address, vendor_phone, building, floor, department, status, location_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `;
    
    const formattedWarrantyEnd = warranty_end ? warranty_end : null;

    db.query(sql, [
        asset_code, asset_number_1, asset_number_2, name, brand, serial_number, category, 
        quantity || 1, unit || 'เครื่อง', remarks || null, acquired_date, acquired_method, funding_type || 'เงินงบประมาณ', 
        document_no || null, po_number || null, gfmis || null, price || 0, lifespan_years || 5, formattedWarrantyEnd, 
        vendor || null, vendor_address || null, vendor_phone || null, building || null, floor || null, department, status || 'ใช้งานปกติ'
    ], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const newAssetId = result.insertId;
        db.query("UPDATE system_settings SET setting_value = setting_value + 1 WHERE setting_key = 'asset_last_number'");

        // 💡 บันทึกรูปภาพลงตาราง asset_images
        if (images && Array.isArray(images) && images.length > 0) {
            const imageValues = images.slice(0, 5).map(img => [newAssetId, img]);
            db.query('INSERT INTO asset_images (asset_id, image_data) VALUES ?', [imageValues], (imgErr) => {
                // ถ้ามี Error ตอนเซฟรูป ให้เด้งบอกหน้าเว็บ
                if (imgErr) return res.status(500).json({ error: 'บันทึกข้อมูลหลักสำเร็จ แต่บันทึกรูปภาพล้มเหลว: ' + imgErr.message });
                res.json({ message: 'บันทึกข้อมูลและรูปภาพสำเร็จ', id: newAssetId });
            });
        } else {
            res.json({ message: 'บันทึกข้อมูลสำเร็จ', id: newAssetId });
        }
    });
});

app.get('/api/assets/next-code', (req, res) => {
    db.query("SELECT * FROM system_settings WHERE setting_key IN ('asset_prefix', 'asset_digit_length', 'asset_last_number')", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        let config = {};
        if (results && results.length > 0) {
            results.forEach(r => config[r.setting_key] = r.setting_value);
        }

        let prefix = config.asset_prefix || 'SR-';
        let digitLength = parseInt(config.asset_digit_length || 7);
        let lastNumber = parseInt(config.asset_last_number || 0);

        let nextNumber = lastNumber + 1;
        let paddedNumber = String(nextNumber).padStart(digitLength, '0');
        
        res.json({ next_code: `${prefix}${paddedNumber}` });
    });
});

app.get('/api/assets/next-category-code', (req, res) => {
    const { prefix } = req.query; 
    if (!prefix) return res.status(400).json({ error: 'ไม่ได้ระบุหมวดหมู่' });

    const today = new Date();
    let thaiYear = today.getFullYear() + 543;
    if (today.getMonth() >= 9) { 
        thaiYear += 1;
    }
    const shortYear = String(thaiYear).slice(-2); 

    const sql = `SELECT asset_number_1 FROM assets WHERE asset_number_1 LIKE ? ORDER BY id DESC LIMIT 1`;
    
    db.query(sql, [`${prefix}-%`], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        let nextSeq = 1;

        if (results.length > 0 && results[0].asset_number_1) {
            const parts = results[0].asset_number_1.split('-');
            if (parts.length >= 3) {
                const seqAndYear = parts[2]; 
                const [seqStr, yearStr] = seqAndYear.split('/');
                
                if (yearStr === shortYear) {
                    const seqNum = parseInt(seqStr, 10);
                    if (!isNaN(seqNum)) nextSeq = seqNum + 1;
                }
            }
        }

        const paddedSeq = String(nextSeq).padStart(4, '0');
        const runningNum = `${paddedSeq}/${shortYear}`;
        
        res.json({ runningNum });
    });
});

// 💡 ดึงข้อมูลครุภัณฑ์ 1 รายการ (พร้อมแนบรูปภาพไปด้วยสำหรับหน้า Edit)
app.get('/api/assets/:id', (req, res) => {
    db.query('SELECT * FROM assets WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'ไม่พบข้อมูล' });
        
        const asset = results[0];
        // 💡 ดึงรูปภาพจากตาราง asset_images
        db.query('SELECT id, image_data FROM asset_images WHERE asset_id = ? ORDER BY id ASC', [asset.id], (imgErr, imgResults) => {
            if (imgErr) return res.status(500).json({ error: imgErr.message });
            asset.images = imgResults || [];
            res.json(asset);
        });
    });
});

// 💡 แก้ไขครุภัณฑ์ (อัปเดตข้อมูล และแก้ไขรูปภาพ)
app.put('/api/assets/:id', (req, res) => {
    const { 
        asset_code, asset_number_1, asset_number_2, name, brand, serial_number, category, 
        quantity, unit, remarks, acquired_date, acquired_method, funding_type, 
        document_no, po_number, gfmis, price, lifespan_years, warranty_end, 
        vendor, vendor_address, vendor_phone, building, floor, department, status, images // 💡 รับตัวแปร images
    } = req.body;

    const sql = `
        UPDATE assets SET 
            asset_code = ?, asset_number_1 = ?, asset_number_2 = ?, name = ?, brand = ?, serial_number = ?, 
            category = ?, quantity = ?, unit = ?, remarks = ?, acquired_date = ?, acquired_method = ?, 
            funding_type = ?, document_no = ?, po_number = ?, gfmis = ?, price = ?, lifespan_years = ?, 
            warranty_end = ?, vendor = ?, vendor_address = ?, vendor_phone = ?, building = ?, floor = ?, department = ?, status = ? 
        WHERE id = ?
    `;
    
    const formattedWarrantyEnd = warranty_end ? warranty_end : null;

    db.query(sql, [
        asset_code, asset_number_1, asset_number_2, name, brand, serial_number, 
        category, quantity || 1, unit || 'เครื่อง', remarks || null, acquired_date, acquired_method, 
        funding_type || 'เงินงบประมาณ', document_no || null, po_number || null, gfmis || null, price || 0, lifespan_years || 5, 
        formattedWarrantyEnd, vendor || null, vendor_address || null, vendor_phone || null, building || null, floor || null, department, status, 
        req.params.id
    ], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // 💡 ถ้ามีการส่งรูปภาพอัปเดตมา ให้ลบรูปเก่าทิ้งให้หมด แล้วใส่รูปใหม่เข้าไปแทน
        if (images && Array.isArray(images)) {
            db.query('DELETE FROM asset_images WHERE asset_id = ?', [req.params.id], (delErr) => {
                if (images.length > 0) {
                    const imageBase64Array = images.map(img => typeof img === 'string' ? img : img.image_data);
                    const imageValues = imageBase64Array.slice(0, 5).map(img => [req.params.id, img]);
                    db.query('INSERT INTO asset_images (asset_id, image_data) VALUES ?', [imageValues], (imgErr) => {
                        // ถ้ามี Error ตอนเซฟรูป ให้เด้งบอกหน้าเว็บ
                        if (imgErr) return res.status(500).json({ error: 'อัปเดตข้อมูลหลักสำเร็จ แต่อัปเดตรูปภาพล้มเหลว: ' + imgErr.message });
                        return res.json({ message: 'อัปเดตข้อมูลและรูปภาพสำเร็จ' });
                    });
                } else {
                    return res.json({ message: 'อัปเดตข้อมูลสำเร็จ (ไม่มีรูป)' });
                }
            });
        } else {
            res.json({ message: 'อัปเดตข้อมูลสำเร็จ' });
        }
    });
});

app.put('/api/assets/:id/status', (req, res) => {
    const { status } = req.body;
    db.query('UPDATE assets SET status = ? WHERE id = ?', [status, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'อัปเดตสถานะสำเร็จ' });
    });
});

app.delete('/api/assets/:id', (req, res) => {
    db.query('DELETE FROM assets WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'ลบข้อมูลสำเร็จ' });
    });
});
// ================= จบ API สำหรับ ครุภัณฑ์ ================= //

// ================= API สำหรับ ล็อกอิน และ สิทธิ์ ================= //
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const sql = `
        SELECT u.id, u.username, u.name, u.role_id, r.name AS role_name 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE u.username = ? AND u.password = ?
    `;
    db.query(sql, [username, password], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length > 0) {
            const user = results[0];
            db.query('SELECT permission_key FROM role_permissions WHERE role_id = ?', [user.role_id], (pErr, pResults) => {
                if (pErr) return res.status(500).json({ error: pErr.message });
                const permissions = pResults.map(p => p.permission_key);
                
                // สร้าง Token ใหม่
                const token = jwt.sign({ id: user.id, username: user.username, role_id: user.role_id, permissions }, SECRET_KEY, { expiresIn: '8h' });
                
                // บันทึก Token ล่าสุดลงในฐานข้อมูล เพื่อใช้เปรียบเทียบตอนมีคน Login ซ้อน
                db.query('UPDATE users SET current_token = ? WHERE id = ?', [token, user.id], (updateErr) => {
                    if (updateErr) return res.status(500).json({ error: updateErr.message });
                    
                    res.json({ message: 'เข้าสู่ระบบสำเร็จ', token, user: { name: user.name, role_name: user.role_name, permissions } });
                });
            });
        } else {
            res.status(401).json({ error: 'ชื่อผู้ใช้ หรือ รหัสผ่านไม่ถูกต้อง' });
        }
    });
});

app.get('/api/roles/permissions', (req, res) => {
    const sql = `SELECT r.id AS role_id, r.name AS role_name, rp.permission_key FROM roles r LEFT JOIN role_permissions rp ON r.id = rp.role_id`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const rolesMap = {};
        results.forEach(row => {
            if (!rolesMap[row.role_id]) rolesMap[row.role_id] = { id: row.role_id, name: row.role_name, permissions: [] };
            if (row.permission_key) rolesMap[row.role_id].permissions.push(row.permission_key);
        });
        res.json(Object.values(rolesMap));
    });
});

app.post('/api/roles/permissions', (req, res) => {
    const { role_id, permissions } = req.body;
    db.query('DELETE FROM role_permissions WHERE role_id = ?', [role_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!permissions || permissions.length === 0) return res.json({ message: 'อัปเดตสิทธิ์สำเร็จ' });
        
        const values = permissions.map(p => [role_id, p]);
        db.query('INSERT INTO role_permissions (role_id, permission_key) VALUES ?', [values], (iErr) => {
            if (iErr) return res.status(500).json({ error: iErr.message });
            res.json({ message: 'อัปเดตสิทธิ์สำเร็จ' });
        });
    });
});

// ================= API สำหรับ ตั้งค่าระบบเลขที่ ================= //
app.get('/api/settings/running-number', (req, res) => {
    db.query("SELECT * FROM system_settings WHERE setting_key IN ('asset_prefix', 'asset_digit_length', 'asset_last_number')", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        let config = {};
        results.forEach(r => config[r.setting_key] = r.setting_value);
        res.json(config);
    });
});

app.post('/api/settings/running-number', (req, res) => {
    const { prefix, digit_length, reset_number } = req.body;
    db.query("UPDATE system_settings SET setting_value = ? WHERE setting_key = 'asset_prefix'", [prefix]);
    db.query("UPDATE system_settings SET setting_value = ? WHERE setting_key = 'asset_digit_length'", [digit_length]);
    
    if (reset_number) {
        db.query("UPDATE system_settings SET setting_value = '0' WHERE setting_key = 'asset_last_number'");
    }
    res.json({ message: 'บันทึกการตั้งค่าเลขที่สำเร็จ' });
});

// ================= API สำหรับเช็กข้อมูลซ้ำ ================= //
app.get('/api/assets/check-duplicate', (req, res) => {
    const { asset_number_1 } = req.query;
    if (!asset_number_1) return res.status(400).json({ error: 'กรุณาระบุหมายเลขครุภัณฑ์' });
    db.query('SELECT id FROM assets WHERE asset_number_1 = ? LIMIT 1', [asset_number_1], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) res.json({ isDuplicate: true });
        else res.json({ isDuplicate: false });
    });
});

// ================= API สำหรับดึงข้อมูลหมวดหมู่ ================= //
app.get('/api/categories', (req, res) => {
    db.query('SELECT id, name FROM asset_categories ORDER BY id ASC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/subcategories/:categoryId', (req, res) => {
    db.query('SELECT id, name FROM asset_subcategories WHERE category_id = ? ORDER BY id ASC', [req.params.categoryId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ================= API สำหรับจัดการข้อมูลผู้ขาย (Vendors) ================= //
app.get('/api/vendors', (req, res) => {
    db.query('SELECT * FROM vendors ORDER BY name ASC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});
app.post('/api/vendors', (req, res) => {
    const { name, address, phone } = req.body;
    db.query('INSERT INTO vendors (name, address, phone) VALUES (?, ?, ?)', [name, address, phone], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'เพิ่มข้อมูลสำเร็จ', id: results.insertId });
    });
});
app.put('/api/vendors/:id', (req, res) => {
    const { name, address, phone } = req.body;
    db.query('UPDATE vendors SET name = ?, address = ?, phone = ? WHERE id = ?', [name, address, phone, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'อัปเดตสำเร็จ' });
    });
});
app.delete('/api/vendors/:id', (req, res) => {
    db.query('DELETE FROM vendors WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'ลบสำเร็จ' });
    });
});

// ================= API สำหรับจัดการสถานที่ตั้ง (Locations) ================= //
app.get('/api/locations', (req, res) => {
    const sql = 'SELECT * FROM locations ORDER BY building, floor, department ASC';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/locations', (req, res) => {
    const { building, floor, department } = req.body;
    const sql = 'INSERT INTO locations (building, floor, department) VALUES (?, ?, ?)';
    db.query(sql, [building, floor, department], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'เพิ่มสถานที่ตั้งสำเร็จ', id: results.insertId });
    });
});

app.put('/api/locations/:id', (req, res) => {
    const { building, floor, department } = req.body;
    const sql = 'UPDATE locations SET building = ?, floor = ?, department = ? WHERE id = ?';
    db.query(sql, [building, floor, department, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'อัปเดตสถานที่ตั้งสำเร็จ' });
    });
});

app.delete('/api/locations/:id', (req, res) => {
    const sql = 'DELETE FROM locations WHERE id = ?';
    db.query(sql, [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'ลบสถานที่ตั้งสำเร็จ' });
    });
});

// ============================================================================== //
// ======================== API ระบบตรวจนับครุภัณฑ์ (Audits) ======================== //
// ============================================================================== //

// 1. ดึงข้อมูลประวัติการตรวจนับทั้งหมด
app.get('/api/audits', verifyToken, (req, res) => {
    const sql = 'SELECT * FROM audits ORDER BY created_at DESC';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 💡 2. เปิดรอบการตรวจนับใหม่ (ป้องกันการเปิดรอบหากไม่มีครุภัณฑ์เป้าหมาย)
app.post('/api/audits', verifyToken, (req, res) => {
    const { title, audit_type, target_category, start_date, end_date } = req.body;

    // 1️⃣ ดึงครุภัณฑ์ที่มีสถานะ "ใช้งานปกติ" และตรงตาม "หมวดหมู่" มาเช็คก่อน
    let getAssetsSql = 'SELECT id FROM assets WHERE status = "ใช้งานปกติ"';
    const params = [];
    
    if (target_category && target_category !== 'ทั้งหมด') {
        getAssetsSql += ' AND category = ?';
        params.push(target_category);
    }

    db.query(getAssetsSql, params, (assetErr, assets) => {
        if (assetErr) return res.status(500).json({ error: assetErr.message });

        // 🚨 2️⃣ เช็คว่ามีครุภัณฑ์หรือไม่ ถ้าไม่มีให้เตะกลับทันที ไม่สร้างรอบใหม่!
        if (assets.length === 0) {
            return res.status(400).json({ error: 'ไม่พบรายการครุภัณฑ์ (ที่ใช้งานปกติ) ในหมวดหมู่ที่เลือก ไม่สามารถเปิดรอบตรวจนับได้' });
        }

        // ✅ 3️⃣ ถ้ามีของ ค่อยสร้างรอบการตรวจนับใหม่ในตาราง audits
        const insertAuditSql = 'INSERT INTO audits (title, audit_type, target_category, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, "กำลังตรวจนับ")';
        db.query(insertAuditSql, [title, audit_type, target_category || null, start_date || null, end_date || null], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            const newAuditId = result.insertId;

            // 4️⃣ นำครุภัณฑ์ทั้งหมดใส่ในตาราง audit_details โดยตั้งค่าเริ่มต้นเป็น "รอตรวจสอบ"
            const auditDetailsData = assets.map(asset => [newAuditId, asset.id, 'รอตรวจสอบ']);
            const insertDetailsSql = 'INSERT INTO audit_details (audit_id, asset_id, check_status) VALUES ?';
            
            db.query(insertDetailsSql, [auditDetailsData], (detailErr) => {
                if (detailErr) return res.status(500).json({ error: detailErr.message });
                res.status(201).json({ message: 'เปิดรอบการตรวจนับเรียบร้อยแล้ว', auditId: newAuditId });
            });
        });
    });
});

// 3. ดึงรายการครุภัณฑ์ภายในรอบการตรวจนับนั้นๆ (เพื่อเอาไปแสดงหน้าเว็บและให้สแกน)
app.get('/api/audits/:id', verifyToken, (req, res) => {
    const auditId = req.params.id;
    const sql = `
        SELECT ad.id AS audit_detail_id, ad.check_status, ad.scanned_at, ad.notes,
               a.id AS asset_id, a.asset_code, a.asset_number_1, a.name, a.category, a.location_id
        FROM audit_details ad
        JOIN assets a ON ad.asset_id = a.id
        WHERE ad.audit_id = ?
    `;
    db.query(sql, [auditId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 3.5 ดึงข้อมูลส่วนหัวของรอบการตรวจนับ (เอาไปเช็คว่าปิดยอดหรือยัง)
app.get('/api/audits/info/:id', verifyToken, (req, res) => {
    const auditId = req.params.id;
    db.query('SELECT * FROM audits WHERE id = ?', [auditId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'ไม่พบข้อมูล' });
        res.json(results[0]);
    });
});

// 💡 4. อัปเดตสถานะการตรวจนับของครุภัณฑ์แต่ละชิ้น (พร้อมเช็คว่าถ้าครบ 100% ให้ปิดรอบ Auto)
app.put('/api/audits/details/:id', verifyToken, (req, res) => {
    const detailId = req.params.id;
    const { check_status, notes } = req.body;
    
    // ถ้าสถานะเป็น "พบเครื่อง" ให้บันทึกเวลาที่สแกนด้วย
    const scanned_at = check_status === 'พบเครื่อง' ? new Date() : null;

    const sql = 'UPDATE audit_details SET check_status = ?, notes = ?, scanned_at = ? WHERE id = ?';
    db.query(sql, [check_status, notes, scanned_at, detailId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // เช็คว่าในรอบการตรวจนับนี้ มีรายการที่ยัง "รอตรวจสอบ" เหลืออยู่อีกหรือไม่
        db.query('SELECT audit_id FROM audit_details WHERE id = ?', [detailId], (err2, res2) => {
            if (err2 || res2.length === 0) return res.json({ message: 'อัปเดตสถานะสำเร็จ', autoClosed: false });
            
            const auditId = res2[0].audit_id;
            
            db.query('SELECT COUNT(*) as pendingCount FROM audit_details WHERE audit_id = ? AND check_status = "รอตรวจสอบ"', [auditId], (err3, res3) => {
                if (err3) return res.json({ message: 'อัปเดตสถานะสำเร็จ', autoClosed: false });
                
                const pendingCount = res3[0].pendingCount;
                if (pendingCount === 0) {
                    // ถ้าไม่เหลือรายการรอตรวจสอบแล้ว ให้ปิดยอดอัตโนมัติ
                    db.query('UPDATE audits SET status = "ปิดยอดแล้ว" WHERE id = ?', [auditId], () => {
                        res.json({ message: 'อัปเดตสถานะและปิดยอดอัตโนมัติสำเร็จ', autoClosed: true });
                    });
                } else {
                    res.json({ message: 'อัปเดตสถานะสำเร็จ', autoClosed: false });
                }
            });
        });
    });
});

// 5. ปิดรอบการตรวจนับ
app.put('/api/audits/:id/close', verifyToken, (req, res) => {
    const auditId = req.params.id;
    db.query('UPDATE audits SET status = "ปิดยอดแล้ว" WHERE id = ?', [auditId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'ปิดรอบการตรวจนับสำเร็จ' });
    });
});

// ================= API ระบบแจ้งซ่อม (Repair Tracking) ================= //
const repairRoutes = require('./repairRoutes')(db, verifyToken);
app.use('/api/repairs', repairRoutes);

// ================= เริ่มต้นเซิร์ฟเวอร์ ================= //
app.listen(5000, () => {
    console.log('Server running on http://192.168.1.120:5000');
});