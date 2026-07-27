// ไฟล์: repairRoutes.js
const express = require('express');
const router = express.Router();

// รับค่า db และ verifyToken มาจาก server.js เพื่อไม่ให้กระทบของเดิม
module.exports = (db, verifyToken) => {

    // 1. ดึงรายการแจ้งซ่อมทั้งหมด (GET /api/repairs)
    router.get('/', verifyToken, (req, res) => {
        db.query('SELECT * FROM repair_tickets ORDER BY id DESC', (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });

    // 2. ดึงข้อมูลแจ้งซ่อม 1 รายการ สำหรับดูรายละเอียดหรือปริ้น (GET /api/repairs/:id)
    router.get('/:id', verifyToken, (req, res) => {
        db.query('SELECT * FROM repair_tickets WHERE id = ?', [req.params.id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(404).json({ message: 'ไม่พบข้อมูลแจ้งซ่อม' });
            res.json(results[0]);
        });
    });

    // 3. สร้างใบแจ้งซ่อมใหม่ (POST /api/repairs) - สถานะ: pending
    router.post('/', verifyToken, (req, res) => {
        const { asset_id, asset_name, problem_details, reporter_name } = req.body;

        // สร้างเลข Ticket (ตัวอย่าง: RPR-YYMMDD-001)
        const today = new Date();
        const dateStr = today.toISOString().slice(2, 10).replace(/-/g, ''); // จะได้แบบ 260727
        const searchPattern = `RPR-${dateStr}-%`;

        db.query("SELECT COUNT(*) as count FROM repair_tickets WHERE ticket_no LIKE ?", [searchPattern], (err, countResult) => {
            if (err) return res.status(500).json({ error: err.message });
            
            const nextSeq = String(countResult[0].count + 1).padStart(3, '0');
            const ticket_no = `RPR-${dateStr}-${nextSeq}`;

            const sql = `INSERT INTO repair_tickets (ticket_no, asset_id, asset_name, problem_details, reporter_name, status) 
                         VALUES (?, ?, ?, ?, ?, 'pending')`;
            
            db.query(sql, [ticket_no, asset_id || null, asset_name, problem_details, reporter_name], (insertErr, result) => {
                if (insertErr) return res.status(500).json({ error: insertErr.message });
                res.status(201).json({ message: 'แจ้งซ่อมสำเร็จ', ticket_no: ticket_no, id: result.insertId });
            });
        });
    });

    // 4. ช่างกดรับเรื่อง และ เซ็นรับ (PUT /api/repairs/:id/accept) - สถานะ: accepted
    router.put('/:id/accept', verifyToken, (req, res) => {
        const { received_by, sender_signature, receiver_signature } = req.body;
        const sql = `UPDATE repair_tickets SET 
                     status = 'accepted', received_by = ?, received_at = NOW(), 
                     sender_signature = ?, receiver_signature = ? WHERE id = ?`;
        
        db.query(sql, [received_by, sender_signature, receiver_signature, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'รับเรื่องและบันทึกลายเซ็นสำเร็จ' });
        });
    });

    // 5. อัปเดตสถานะเป็นกำลังซ่อม (PUT /api/repairs/:id/in-progress) - สถานะ: in_progress
    router.put('/:id/in-progress', verifyToken, (req, res) => {
        db.query("UPDATE repair_tickets SET status = 'in_progress' WHERE id = ?", [req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'อัปเดตสถานะเป็นกำลังซ่อม' });
        });
    });

    // 6. ซ่อมเสร็จ ส่งคืน และ เซ็นรับคืน (PUT /api/repairs/:id/return) - สถานะ: returned
    router.put('/:id/return', verifyToken, (req, res) => {
        const { return_method, returned_by, return_sender_signature, return_receiver_signature } = req.body;
        const sql = `UPDATE repair_tickets SET 
                     status = 'returned', return_method = ?, returned_by = ?, returned_at = NOW(),
                     return_sender_signature = ?, return_receiver_signature = ? WHERE id = ?`;
        
        db.query(sql, [return_method, returned_by || null, return_sender_signature, return_receiver_signature, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'บันทึกการส่งคืนและลายเซ็นสำเร็จ' });
        });
    });

    // 7. ปิดงานซ่อม (PUT /api/repairs/:id/close) - สถานะ: closed
    router.put('/:id/close', verifyToken, (req, res) => {
        db.query("UPDATE repair_tickets SET status = 'closed' WHERE id = ?", [req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'ปิดงานซ่อมสำเร็จ' });
        });
    });

    return router;
};