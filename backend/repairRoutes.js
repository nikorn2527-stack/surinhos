// ไฟล์: repairRoutes.js — Enhanced Repair Tracking System
// สถานะ 7 ขั้น: pending → accepted → in_progress → returned → closed | cancelled | disposed
const express = require('express');
const router = express.Router();

module.exports = (db, verifyToken) => {

    // ==================== HELPERS ====================

    // สร้างเลข Ticket (RPR-YYMMDD-NNN)
    const generateTicketNo = (callback) => {
        const today = new Date();
        const yy = String(today.getFullYear()).slice(-2);
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const dateStr = `${yy}${mm}${dd}`;
        const searchPattern = `RPR-${dateStr}-%`;

        db.query("SELECT COUNT(*) as count FROM repair_tickets WHERE ticket_no LIKE ?", [searchPattern], (err, countResult) => {
            if (err) return callback(err);
            const nextSeq = String(countResult[0].count + 1).padStart(3, '0');
            callback(null, `RPR-${dateStr}-${nextSeq}`);
        });
    };

    // ดึง ticket พร้อม asset info (ใช้ซ้ำ)
    const getTicketWithAsset = (ticketId, callback) => {
        const sql = `
            SELECT rt.*,
                   a.asset_code, a.name AS asset_full_name, a.category AS asset_category,
                   a.building, a.floor, a.department
            FROM repair_tickets rt
            LEFT JOIN assets a ON rt.asset_id = a.id
            WHERE rt.id = ?
        `;
        db.query(sql, [ticketId], (err, results) => {
            if (err) return callback(err);
            if (results.length === 0) return callback(null, null);
            callback(null, results[0]);
        });
    };

    // Format response ให้เหมือน repair-tracking branch
    const formatTicket = (row) => {
        if (!row) return null;
        return {
            id: row.id,
            ticketNo: row.ticket_no,
            assetId: row.asset_id,
            assetName: row.asset_name,
            problemDetails: row.problem_details,
            reporterName: row.reporter_name,
            status: row.status,
            receivedBy: row.received_by,
            receivedAt: row.received_at,
            senderSignature: row.sender_signature,
            receiverSignature: row.receiver_signature,
            returnMethod: row.return_method,
            returnedBy: row.returned_by,
            returnedAt: row.returned_at,
            returnSenderSignature: row.return_sender_signature,
            returnReceiverSignature: row.return_receiver_signature,
            photos: row.photos,
            repairCost: row.repair_cost,
            laborCost: row.labor_cost,
            totalCost: row.total_cost,
            costStatus: row.cost_status,
            cancelReason: row.cancel_reason,
            disposalStatus: row.disposal_status,
            disposalReason: row.disposal_reason,
            disposalMethod: row.disposal_method,
            disposalValue: row.disposal_value,
            disposalApprovedBy: row.disposal_approved_by,
            disposalApprovedAt: row.disposal_approved_at,
            disposalComRef: row.disposal_com_ref,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            asset: row.asset_code ? {
                assetCode: row.asset_code,
                name: row.asset_full_name,
                category: row.asset_category,
                location: row.building ? {
                    buildingName: row.building,
                    roomName: `${row.floor ? 'ชั้น ' + row.floor : ''} ${row.department || ''}`.trim()
                } : null
            } : null
        };
    };

    // ==================== 1. ดึงรายการแจ้งซ่อมทั้งหมด ====================
    router.get('/', verifyToken, (req, res) => {
        const sql = `
            SELECT rt.*,
                   a.asset_code, a.name AS asset_full_name, a.category AS asset_category,
                   a.building, a.floor, a.department
            FROM repair_tickets rt
            LEFT JOIN assets a ON rt.asset_id = a.id
            ORDER BY rt.id DESC
        `;
        db.query(sql, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results.map(formatTicket));
        });
    });

    // ==================== 2. ดึงข้อมูลแจ้งซ่อม 1 รายการ ====================
    router.get('/:id', verifyToken, (req, res) => {
        getTicketWithAsset(req.params.id, (err, ticket) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!ticket) return res.status(404).json({ message: 'ไม่พบข้อมูลแจ้งซ่อม' });
            res.json(formatTicket(ticket));
        });
    });

    // ==================== 3. สร้างใบแจ้งซ่อมใหม่ (POST) → pending ====================
    router.post('/', verifyToken, (req, res) => {
        const { asset_id, asset_name, problem_details, reporter_name, photos } = req.body;

        if (!asset_name || !reporter_name) {
            return res.status(400).json({ error: 'กรุณากรอกชื่ออุปกรณ์และชื่อผู้แจ้ง' });
        }

        generateTicketNo((err, ticket_no) => {
            if (err) return res.status(500).json({ error: err.message });

            const sql = `INSERT INTO repair_tickets 
                (ticket_no, asset_id, asset_name, problem_details, reporter_name, photos, status) 
                VALUES (?, ?, ?, ?, ?, ?, 'pending')`;

            db.query(sql, [ticket_no, asset_id || null, asset_name, problem_details, reporter_name, photos || null], (insertErr, result) => {
                if (insertErr) return res.status(500).json({ error: insertErr.message });

                getTicketWithAsset(result.insertId, (e, ticket) => {
                    if (e) return res.status(500).json({ error: e.message });
                    res.status(201).json(formatTicket(ticket));
                });
            });
        });
    });

    // ==================== 4. รับเรื่อง (pending → accepted) ====================
    router.put('/:id/accept', verifyToken, (req, res) => {
        const { received_by, receiver_signature } = req.body;

        if (!received_by) {
            return res.status(400).json({ error: 'กรุณาระบุชื่อผู้รับเรื่อง' });
        }

        getTicketWithAsset(req.params.id, (err, ticket) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!ticket) return res.status(404).json({ error: 'ไม่พบใบแจ้งซ่อม' });
            if (ticket.status !== 'pending') {
                return res.status(409).json({ error: `ไม่สามารถรับเรื่องได้ สถานะปัจจุบันคือ "${ticket.status}"` });
            }

            const sql = `UPDATE repair_tickets SET 
                status = 'accepted', received_by = ?, received_at = NOW(),
                receiver_signature = ? WHERE id = ?`;

            db.query(sql, [received_by, receiver_signature || null, req.params.id], (updateErr) => {
                if (updateErr) return res.status(500).json({ error: updateErr.message });

                getTicketWithAsset(req.params.id, (e, updated) => {
                    if (e) return res.status(500).json({ error: e.message });
                    res.json(formatTicket(updated));
                });
            });
        });
    });

    // ==================== 5. เริ่มซ่อม (accepted → in_progress) ====================
    router.put('/:id/progress', verifyToken, (req, res) => {
        getTicketWithAsset(req.params.id, (err, ticket) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!ticket) return res.status(404).json({ error: 'ไม่พบใบแจ้งซ่อม' });
            if (ticket.status !== 'accepted') {
                return res.status(409).json({ error: `ไม่สามารถเริ่มซ่อมได้ สถานะปัจจุบันคือ "${ticket.status}"` });
            }

            db.query("UPDATE repair_tickets SET status = 'in_progress' WHERE id = ?", [req.params.id], (updateErr) => {
                if (updateErr) return res.status(500).json({ error: updateErr.message });

                getTicketWithAsset(req.params.id, (e, updated) => {
                    if (e) return res.status(500).json({ error: e.message });
                    res.json(formatTicket(updated));
                });
            });
        });
    });

    // ==================== 6. เสนอราคาซ่อม (in_progress) ====================
    router.put('/:id/estimate', verifyToken, (req, res) => {
        const { repair_cost, labor_cost, cost_status } = req.body;

        if (repair_cost == null || labor_cost == null || !cost_status) {
            return res.status(400).json({ error: 'กรุณาระบุค่าอะไหล่ ค่าแรง และสถานะอนุมัติให้ครบ' });
        }

        const validStatuses = ['pending', 'approved', 'rejected'];
        if (!validStatuses.includes(cost_status)) {
            return res.status(400).json({ error: `cost_status ต้องเป็น: ${validStatuses.join(', ')}` });
        }

        getTicketWithAsset(req.params.id, (err, ticket) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!ticket) return res.status(404).json({ error: 'ไม่พบใบแจ้งซ่อม' });
            if (ticket.status !== 'in_progress') {
                return res.status(409).json({ error: `ไม่สามารถเสนอราคาได้ สถานะปัจจุบันคือ "${ticket.status}"` });
            }

            const rc = Number(repair_cost);
            const lc = Number(labor_cost);
            const tc = rc + lc;

            // ถ้าไม่อนุมัติ ให้ยกเลิกใบแจ้งซ่อม
            let extraFields = '';
            let extraParams = [];
            if (cost_status === 'rejected') {
                extraFields = ", status = 'cancelled', cancel_reason = 'เสนอราคาไม่อนุมัติ'";
            }

            const sql = `UPDATE repair_tickets SET 
                repair_cost = ?, labor_cost = ?, total_cost = ?, cost_status = ?${extraFields} WHERE id = ?`;

            db.query(sql, [rc, lc, tc, cost_status, req.params.id], (updateErr) => {
                if (updateErr) return res.status(500).json({ error: updateErr.message });

                getTicketWithAsset(req.params.id, (e, updated) => {
                    if (e) return res.status(500).json({ error: e.message });
                    res.json(formatTicket(updated));
                });
            });
        });
    });

    // ==================== 7. ส่งคืน (in_progress → returned) ====================
    router.put('/:id/return', verifyToken, (req, res) => {
        const { return_method, returned_by, return_sender_signature, return_receiver_signature } = req.body;

        if (!return_method || !returned_by) {
            return res.status(400).json({ error: 'กรุณาระบุวิธีส่งคืนและชื่อผู้ส่งคืน' });
        }

        getTicketWithAsset(req.params.id, (err, ticket) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!ticket) return res.status(404).json({ error: 'ไม่พบใบแจ้งซ่อม' });
            if (ticket.status !== 'in_progress') {
                return res.status(409).json({ error: `ไม่สามารถส่งคืนได้ สถานะปัจจุบันคือ "${ticket.status}"` });
            }

            const sql = `UPDATE repair_tickets SET 
                status = 'returned', return_method = ?, returned_by = ?, returned_at = NOW(),
                return_sender_signature = ?, return_receiver_signature = ? WHERE id = ?`;

            db.query(sql, [return_method, returned_by, return_sender_signature || null, return_receiver_signature || null, req.params.id], (updateErr) => {
                if (updateErr) return res.status(500).json({ error: updateErr.message });

                getTicketWithAsset(req.params.id, (e, updated) => {
                    if (e) return res.status(500).json({ error: e.message });
                    res.json(formatTicket(updated));
                });
            });
        });
    });

    // ==================== 8. ปิดงาน (returned → closed) ====================
    router.put('/:id/close', verifyToken, (req, res) => {
        getTicketWithAsset(req.params.id, (err, ticket) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!ticket) return res.status(404).json({ error: 'ไม่พบใบแจ้งซ่อม' });
            if (ticket.status !== 'returned') {
                return res.status(409).json({ error: `ไม่สามารถปิดงานได้ สถานะปัจจุบันคือ "${ticket.status}"` });
            }

            db.query("UPDATE repair_tickets SET status = 'closed' WHERE id = ?", [req.params.id], (updateErr) => {
                if (updateErr) return res.status(500).json({ error: updateErr.message });

                getTicketWithAsset(req.params.id, (e, updated) => {
                    if (e) return res.status(500).json({ error: e.message });
                    res.json(formatTicket(updated));
                });
            });
        });
    });

    // ==================== 9. ยกเลิก (pending/accepted/in_progress → cancelled) ====================
    router.put('/:id/cancel', verifyToken, (req, res) => {
        const { cancel_reason } = req.body;

        if (!cancel_reason) {
            return res.status(400).json({ error: 'กรุณาระบุเหตุผลการยกเลิก' });
        }

        const cancellable = ['pending', 'accepted', 'in_progress'];

        getTicketWithAsset(req.params.id, (err, ticket) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!ticket) return res.status(404).json({ error: 'ไม่พบใบแจ้งซ่อม' });
            if (!cancellable.includes(ticket.status)) {
                return res.status(409).json({ error: `ไม่สามารถยกเลิกได้ สถานะปัจจุบันคือ "${ticket.status}"` });
            }

            const sql = "UPDATE repair_tickets SET status = 'cancelled', cancel_reason = ? WHERE id = ?";

            db.query(sql, [cancel_reason, req.params.id], (updateErr) => {
                if (updateErr) return res.status(500).json({ error: updateErr.message });

                getTicketWithAsset(req.params.id, (e, updated) => {
                    if (e) return res.status(500).json({ error: e.message });
                    res.json(formatTicket(updated));
                });
            });
        });
    });

    // ==================== 10. ตีแทงจำหน่าย (pending/accepted/in_progress → disposed) ====================
    router.put('/:id/disposal', verifyToken, (req, res) => {
        const { disposal_reason, disposal_method, disposal_value, disposal_approved_by, disposal_com_ref } = req.body;

        if (!disposal_reason || !disposal_method) {
            return res.status(400).json({ error: 'กรุณาระบุเหตุผลและวิธีจำหน่าย' });
        }

        const validMethods = ['จำหน่าย/ชำระ', 'ทำลาย', 'บริจาค'];
        if (!validMethods.includes(disposal_method)) {
            return res.status(400).json({ error: `วิธีจำหน่ายต้องเป็น: ${validMethods.join(', ')}` });
        }

        const disposableStatuses = ['pending', 'accepted', 'in_progress'];

        getTicketWithAsset(req.params.id, (err, ticket) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!ticket) return res.status(404).json({ error: 'ไม่พบใบแจ้งซ่อม' });
            if (!disposableStatuses.includes(ticket.status)) {
                return res.status(409).json({ error: `ไม่สามารถตีแทงจำหน่ายได้ สถานะปัจจุบันคือ "${ticket.status}"` });
            }

            const sql = `UPDATE repair_tickets SET 
                status = 'disposed', disposal_status = 'pending_review',
                disposal_reason = ?, disposal_method = ?, disposal_value = ?,
                disposal_approved_by = ?, disposal_com_ref = ? WHERE id = ?`;

            db.query(sql, [disposal_reason, disposal_method, disposal_value || null, disposal_approved_by || null, disposal_com_ref || null, req.params.id], (updateErr) => {
                if (updateErr) return res.status(500).json({ error: updateErr.message });

                getTicketWithAsset(req.params.id, (e, updated) => {
                    if (e) return res.status(500).json({ error: e.message });
                    res.json(formatTicket(updated));
                });
            });
        });
    });

    // ==================== 11. อัปเดตสถานะจำหน่าย (disposed → approved/disposed) ====================
    router.patch('/:id/disposal', verifyToken, (req, res) => {
        const { disposal_status } = req.body;

        const validStatuses = ['pending_review', 'approved', 'disposed'];
        if (!disposal_status || !validStatuses.includes(disposal_status)) {
            return res.status(400).json({ error: `สถานะต้องเป็น: ${validStatuses.join(', ')}` });
        }

        getTicketWithAsset(req.params.id, (err, ticket) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!ticket) return res.status(404).json({ error: 'ไม่พบใบแจ้งซ่อม' });
            if (ticket.status !== 'disposed') {
                return res.status(409).json({ error: 'ใบแจ้งซ่อมนี้ไม่ได้อยู่ในสถานะตีแทงจำหน่าย' });
            }

            const sql = "UPDATE repair_tickets SET disposal_status = ?, disposal_approved_at = NOW() WHERE id = ?";

            db.query(sql, [disposal_status, req.params.id], (updateErr) => {
                if (updateErr) return res.status(500).json({ error: updateErr.message });

                // ถ้าจำหน่ายแล้ว อัปเดตสถานะครุภัณฑ์ด้วย
                if (disposal_status === 'disposed' && ticket.asset_id) {
                    db.query("UPDATE assets SET status = 'จำหน่ายแล้ว' WHERE id = ?", [ticket.asset_id]);
                }

                getTicketWithAsset(req.params.id, (e, updated) => {
                    if (e) return res.status(500).json({ error: e.message });
                    res.json(formatTicket(updated));
                });
            });
        });
    });

    return router;
};
