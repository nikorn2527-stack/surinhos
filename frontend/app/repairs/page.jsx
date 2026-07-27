"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SignaturePad from '../../components/SignaturePad';

// ================= Helper: ดึง Token จาก localStorage/sessionStorage =================
const getToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || sessionStorage.getItem('token');
};

const API_BASE = 'http://192.168.1.120:5000';

// ================= Helper: สี/ป้ายสถานะ =================
const statusConfig = {
    pending:    { label: 'รอรับเรื่อง',   color: '#f59e0b', bg: '#fef3c7' },
    accepted:   { label: 'รับเรื่องแล้ว', color: '#3b82f6', bg: '#dbeafe' },
    in_progress:{ label: 'กำลังซ่อม',    color: '#8b5cf6', bg: '#ede9fe' },
    returned:   { label: 'ส่งคืนแล้ว',   color: '#10b981', bg: '#d1fae5' },
    closed:     { label: 'ปิดงาน',       color: '#6b7280', bg: '#f3f4f6' },
};

const StatusBadge = ({ status }) => {
    const cfg = statusConfig[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' };
    return (
        <span style={{
            backgroundColor: cfg.bg, color: cfg.color,
            padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
            border: `1px solid ${cfg.color}30`
        }}>
            {cfg.label}
        </span>
    );
};

export default function RepairPage() {
    const router = useRouter();
    const [repairs, setRepairs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // ================= State สำหรับฟอร์มแจ้งซ่อมใหม่ =================
    const [showNewRepairForm, setShowNewRepairForm] = useState(false);
    const [newRepair, setNewRepair] = useState({
        asset_name: '',
        problem_details: '',
        reporter_name: ''
    });

    // ================= State สำหรับ Modal ต่างๆ =================
    const [showAcceptModal, setShowAcceptModal] = useState(false);    // รับเรื่อง
    const [showReturnModal, setShowReturnModal] = useState(false);    // ส่งคืน
    const [showPrintModal, setShowPrintModal] = useState(false);      // ปริ้น
    const [selectedTicket, setSelectedTicket] = useState(null);       // รายการที่เลือก
    const [selectedTicketId, setSelectedTicketId] = useState(null);

    // ================= State สำหรับรับเรื่อง (Accept) =================
    const [technicianName, setTechnicianName] = useState('');

    // ================= State สำหรับส่งคืน (Return) =================
    const [returnMethod, setReturnMethod] = useState('self_pickup');  // self_pickup | delivery
    const [returnPersonName, setReturnPersonName] = useState('');

    // ================= State สำหรับปริ้น =================
    const [printTicket, setPrintTicket] = useState(null);

    // ================= ดึง Token จากระบบ =================
    const getAuthHeaders = () => {
        const token = getToken();
        if (!token) {
            router.push('/login');
            return null;
        }
        return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    };

    // ================= ดึงข้อมูลแจ้งซ่อมทั้งหมด =================
    const fetchRepairs = async () => {
        const headers = getAuthHeaders();
        if (!headers) return;

        try {
            const res = await fetch(`${API_BASE}/api/repairs`, { headers });
            if (res.status === 401 || res.status === 403) {
                router.push('/login');
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setRepairs(data);
            }
        } catch (error) {
            console.error("Error fetching repairs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const token = getToken();
        if (!token) {
            router.push('/login');
            return;
        }
        fetchRepairs();
    }, []);

    // ================= 1. แจ้งซ่อมใหม่ (POST) =================
    const handleSubmitRepair = async (e) => {
        e.preventDefault();
        const headers = getAuthHeaders();
        if (!headers) return;

        try {
            const res = await fetch(`${API_BASE}/api/repairs`, {
                method: 'POST',
                headers,
                body: JSON.stringify(newRepair)
            });

            if (res.ok) {
                alert("✅ สร้างใบแจ้งซ่อมสำเร็จ!");
                setShowNewRepairForm(false);
                setNewRepair({ asset_name: '', problem_details: '', reporter_name: '' });
                fetchRepairs();
            } else {
                const errData = await res.json();
                alert("❌ เกิดข้อผิดพลาด: " + (errData.error || 'ไม่ทราบสาเหตุ'));
            }
        } catch (error) {
            console.error("Error submitting repair:", error);
            alert("❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
        }
    };

    // ================= 2. รับเรื่อง + เซ็นชื่อ (PUT /accept) =================
    const handleAcceptRepair = async (base64Signature) => {
        if (!technicianName.trim()) {
            alert("⚠️ กรุณากรอกชื่อช่างผู้รับเรื่อง");
            return;
        }

        const headers = getAuthHeaders();
        if (!headers) return;

        try {
            const res = await fetch(`${API_BASE}/api/repairs/${selectedTicketId}/accept`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    received_by: technicianName,
                    receiver_signature: base64Signature,
                    sender_signature: null
                })
            });

            if (res.ok) {
                alert("✅ บันทึกการรับเรื่องและลายเซ็นสำเร็จ!");
                setShowAcceptModal(false);
                setTechnicianName('');
                fetchRepairs();
            } else {
                const errData = await res.json();
                alert("❌ เกิดข้อผิดพลาด: " + (errData.error || 'ไม่ทราบสาเหตุ'));
            }
        } catch (error) {
            console.error("Error accepting repair:", error);
        }
    };

    // ================= 3. เริ่มซ่อม (PUT /in-progress) =================
    const handleStartRepair = async (ticketId) => {
        if (!confirm("ยืนยันเริ่มซ่อมอุปกรณ์นี้?")) return;

        const headers = getAuthHeaders();
        if (!headers) return;

        try {
            const res = await fetch(`${API_BASE}/api/repairs/${ticketId}/in-progress`, {
                method: 'PUT',
                headers
            });

            if (res.ok) {
                alert("✅ อัปเดตสถานะเป็น 'กำลังซ่อม' เรียบร้อย!");
                fetchRepairs();
            }
        } catch (error) {
            console.error("Error starting repair:", error);
        }
    };

    // ================= 4. ส่งคืนอุปกรณ์ (PUT /return) =================
    const handleReturnRepair = async (base64Signature) => {
        if (!returnPersonName.trim()) {
            alert("⚠️ กรุณากรอกชื่อผู้ส่งคืน/ผู้รับคืน");
            return;
        }

        const headers = getAuthHeaders();
        if (!headers) return;

        try {
            const res = await fetch(`${API_BASE}/api/repairs/${selectedTicketId}/return`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    return_method: returnMethod === 'self_pickup' ? 'หน่วยงานมารับเอง' : 'ช่างไปส่งคืน',
                    returned_by: returnPersonName,
                    return_sender_signature: base64Signature,
                    return_receiver_signature: base64Signature
                })
            });

            if (res.ok) {
                alert("✅ บันทึกการส่งคืนและลายเซ็นสำเร็จ!");
                setShowReturnModal(false);
                setReturnPersonName('');
                setReturnMethod('self_pickup');
                fetchRepairs();
            } else {
                const errData = await res.json();
                alert("❌ เกิดข้อผิดพลาด: " + (errData.error || 'ไม่ทราบสาเหตุ'));
            }
        } catch (error) {
            console.error("Error returning repair:", error);
        }
    };

    // ================= 5. ปิดงาน (PUT /close) =================
    const handleCloseRepair = async (ticketId) => {
        if (!confirm("ยืนยันปิดงานซ่อมนี้?")) return;

        const headers = getAuthHeaders();
        if (!headers) return;

        try {
            const res = await fetch(`${API_BASE}/api/repairs/${ticketId}/close`, {
                method: 'PUT',
                headers
            });

            if (res.ok) {
                alert("✅ ปิดงานซ่อมสำเร็จ!");
                fetchRepairs();
            }
        } catch (error) {
            console.error("Error closing repair:", error);
        }
    };

    // ================= 6. ปริ้นเอกสาร (Print) =================
    const handleOpenPrint = async (ticketId) => {
        const headers = getAuthHeaders();
        if (!headers) return;

        try {
            const res = await fetch(`${API_BASE}/api/repairs/${ticketId}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setPrintTicket(data);
                setShowPrintModal(true);
            }
        } catch (error) {
            console.error("Error fetching ticket for print:", error);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // ================= Helper: แสดงปุ่มตามสถานะ =================
    const renderActionButtons = (ticket) => {
        switch (ticket.status) {
            case 'pending':
                return (
                    <button
                        onClick={() => {
                            setSelectedTicketId(ticket.id);
                            setShowAcceptModal(true);
                        }}
                        style={{ padding: '8px 14px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                    >
                        🔧 ช่างกดรับเรื่อง (เซ็นชื่อ)
                    </button>
                );

            case 'accepted':
                return (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <button
                            onClick={() => handleStartRepair(ticket.id)}
                            style={{ padding: '8px 14px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            🔨 เริ่มซ่อม
                        </button>
                        <button
                            onClick={() => handleOpenPrint(ticket.id)}
                            style={{ padding: '8px 14px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            🖨️ พิมพ์
                        </button>
                    </div>
                );

            case 'in_progress':
                return (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <button
                            onClick={() => {
                                setSelectedTicketId(ticket.id);
                                setShowReturnModal(true);
                            }}
                            style={{ padding: '8px 14px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            📦 ส่งคืนอุปกรณ์ (เซ็นชื่อ)
                        </button>
                        <button
                            onClick={() => handleOpenPrint(ticket.id)}
                            style={{ padding: '8px 14px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            🖨️ พิมพ์
                        </button>
                    </div>
                );

            case 'returned':
                return (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <button
                            onClick={() => handleCloseRepair(ticket.id)}
                            style={{ padding: '8px 14px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            ✅ ปิดงาน
                        </button>
                        <button
                            onClick={() => handleOpenPrint(ticket.id)}
                            style={{ padding: '8px 14px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            🖨️ พิมพ์
                        </button>
                    </div>
                );

            case 'closed':
                return (
                    <button
                        onClick={() => handleOpenPrint(ticket.id)}
                        style={{ marginTop: '10px', padding: '8px 14px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                    >
                        🖨️ พิมพ์เอกสาร
                    </button>
                );

            default:
                return null;
        }
    };

    // ================= RENDER =================
    return (
        <>
            {/* ================= CSS สำหรับ Print ================= */}
            <style jsx global>{`
                @media print {
                    /* ซ่อนทุกอย่าง ยกเว้นส่วนปริ้น */
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 20px;
                    }
                    .no-print { display: none !important; }
                }

                .print-area {
                    font-family: 'Sarabun', sans-serif;
                }
                .print-area table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .print-area table th,
                .print-area table td {
                    border: 1px solid #333;
                    padding: 8px 12px;
                    text-align: left;
                }
                .print-area table th {
                    background-color: #f0f0f0;
                    font-weight: bold;
                }
                .signature-img {
                    max-width: 200px;
                    max-height: 80px;
                    border: 1px solid #ccc;
                }
            `}</style>

            <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>

                {/* ================= ส่วนหัว ================= */}
                <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>🔧 ระบบแจ้งซ่อม (Repair Tracking)</h1>
                    <button
                        onClick={() => setShowNewRepairForm(true)}
                        style={{ padding: '10px 15px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        + แจ้งซ่อมใหม่
                    </button>
                </div>

                {/* ================= Loading ================= */}
                {isLoading && <p style={{ textAlign: 'center', color: '#888' }}>⏳ กำลังโหลดข้อมูล...</p>}

                {/* ================= รายการแจ้งซ่อม ================= */}
                <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {!isLoading && repairs.length === 0 && (
                        <p style={{ textAlign: 'center', color: '#888', padding: '40px' }}>📋 ยังไม่มีรายการแจ้งซ่อม</p>
                    )}

                    {repairs.map((ticket) => (
                        <div key={ticket.id} style={{ border: '1px solid #e5e7eb', padding: '18px', borderRadius: '10px', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '16px' }}>{ticket.ticket_no}</h3>
                                <StatusBadge status={ticket.status} />
                            </div>

                            <p style={{ margin: '10px 0 4px' }}><strong>📦 อุปกรณ์:</strong> {ticket.asset_name}</p>
                            <p style={{ margin: '4px 0' }}><strong>⚠️ ปัญหา:</strong> {ticket.problem_details}</p>
                            <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>👤 ผู้แจ้ง: {ticket.reporter_name}</p>

                            {/* แสดงข้อมูลเพิ่มเติมตามสถานะ */}
                            {ticket.received_by && (
                                <p style={{ margin: '4px 0', fontSize: '14px', color: '#3b82f6' }}>🔧 ช่างรับเรื่อง: {ticket.received_by}</p>
                            )}
                            {ticket.returned_by && (
                                <p style={{ margin: '4px 0', fontSize: '14px', color: '#10b981' }}>📦 ผู้ส่งคืน: {ticket.returned_by} ({ticket.return_method})</p>
                            )}

                            {/* ปุ่มดำเนินการตามสถานะ */}
                            {renderActionButtons(ticket)}
                        </div>
                    ))}
                </div>

                {/* ============================================================= */}
                {/* ================= MODAL: แจ้งซ่อมใหม่ ================= */}
                {/* ============================================================= */}
                {showNewRepairForm && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <form onSubmit={handleSubmitRepair} style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', width: '90%', maxWidth: '500px' }}>
                            <h2 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>📝 ฟอร์มแจ้งซ่อมอุปกรณ์</h2>

                            <label style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px', display: 'block' }}>ชื่ออุปกรณ์ / สถานที่</label>
                            <input
                                type="text" required placeholder="เช่น คอมพิวเตอร์ห้อง 301..."
                                value={newRepair.asset_name} onChange={(e) => setNewRepair({...newRepair, asset_name: e.target.value})}
                                style={{ width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }}
                            />

                            <label style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px', display: 'block' }}>รายละเอียดปัญหา</label>
                            <textarea
                                required placeholder="อธิบายปัญหาที่พบ..." rows="3"
                                value={newRepair.problem_details} onChange={(e) => setNewRepair({...newRepair, problem_details: e.target.value})}
                                style={{ width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box', resize: 'vertical' }}
                            />

                            <label style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px', display: 'block' }}>ชื่อผู้แจ้งซ่อม</label>
                            <input
                                type="text" required placeholder="ชื่อ-นามสกุล..."
                                value={newRepair.reporter_name} onChange={(e) => setNewRepair({...newRepair, reporter_name: e.target.value})}
                                style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }}
                            />

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>💾 บันทึกแจ้งซ่อม</button>
                                <button type="button" onClick={() => setShowNewRepairForm(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#f3f4f6', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer' }}>ยกเลิก</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ============================================================= */}
                {/* ================= MODAL: รับเรื่อง + เซ็นชื่อ ================= */}
                {/* ============================================================= */}
                {showAcceptModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <h2 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>🔧 รับเรื่องแจ้งซ่อม</h2>

                            <label style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px', display: 'block' }}>ชื่อช่างผู้รับเรื่อง</label>
                            <input
                                type="text"
                                placeholder="กรอกชื่อช่าง..."
                                value={technicianName}
                                onChange={(e) => setTechnicianName(e.target.value)}
                                style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }}
                            />

                            <SignaturePad
                                title="ลายเซ็นช่างผู้รับเรื่อง"
                                onSave={handleAcceptRepair}
                                onClear={() => console.log("ล้างลายเซ็นแล้ว")}
                            />

                            <button
                                onClick={() => { setShowAcceptModal(false); setTechnicianName(''); }}
                                style={{ marginTop: '15px', width: '100%', padding: '10px', backgroundColor: '#f3f4f6', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer' }}
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                )}

                {/* ============================================================= */}
                {/* ================= MODAL: ส่งคืนอุปกรณ์ ================= */}
                {/* ============================================================= */}
                {showReturnModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <h2 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>📦 ส่งคืนอุปกรณ์</h2>

                            {/* เลือกวิธีส่งคืน */}
                            <label style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', display: 'block' }}>วิธีการส่งคืน</label>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                <button
                                    type="button"
                                    onClick={() => setReturnMethod('self_pickup')}
                                    style={{
                                        flex: 1, padding: '12px',
                                        backgroundColor: returnMethod === 'self_pickup' ? '#3b82f6' : '#f3f4f6',
                                        color: returnMethod === 'self_pickup' ? 'white' : '#333',
                                        border: returnMethod === 'self_pickup' ? '2px solid #3b82f6' : '1px solid #ccc',
                                        borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                                    }}
                                >
                                    🏢 หน่วยงานมารับเอง
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setReturnMethod('delivery')}
                                    style={{
                                        flex: 1, padding: '12px',
                                        backgroundColor: returnMethod === 'delivery' ? '#3b82f6' : '#f3f4f6',
                                        color: returnMethod === 'delivery' ? 'white' : '#333',
                                        border: returnMethod === 'delivery' ? '2px solid #3b82f6' : '1px solid #ccc',
                                        borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                                    }}
                                >
                                    🚗 ช่างไปส่งคืน
                                </button>
                            </div>

                            {/* ชื่อผู้ส่งคืน/ผู้รับคืน */}
                            <label style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px', display: 'block' }}>
                                {returnMethod === 'self_pickup' ? 'ชื่อผู้มารับคืน' : 'ชื่อช่างผู้ส่งคืน'}
                            </label>
                            <input
                                type="text"
                                placeholder={returnMethod === 'self_pickup' ? 'ชื่อผู้มารับคืน...' : 'ชื่อช่างผู้ส่งคืน...'}
                                value={returnPersonName}
                                onChange={(e) => setReturnPersonName(e.target.value)}
                                style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }}
                            />

                            {/* ลายเซ็น */}
                            <SignaturePad
                                title={returnMethod === 'self_pickup' ? 'ลายเซ็นผู้รับคืน' : 'ลายเซ็นช่างผู้ส่งคืน'}
                                onSave={handleReturnRepair}
                                onClear={() => console.log("ล้างลายเซ็นแล้ว")}
                            />

                            <button
                                onClick={() => { setShowReturnModal(false); setReturnPersonName(''); setReturnMethod('self_pickup'); }}
                                style={{ marginTop: '15px', width: '100%', padding: '10px', backgroundColor: '#f3f4f6', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer' }}
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                )}

                {/* ============================================================= */}
                {/* ================= MODAL: ปริ้นเอกสาร ================= */}
                {/* ============================================================= */}
                {showPrintModal && printTicket && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>

                            {/* ปุ่มปิด/ปริ้น (ซ่อนตอนพิมพ์) */}
                            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>🖨️ เอกสารแจ้งซ่อม</h2>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={handlePrint} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                        🖨️ พิมพ์
                                    </button>
                                    <button onClick={() => { setShowPrintModal(false); setPrintTicket(null); }} style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer' }}>
                                        ✖ ปิด
                                    </button>
                                </div>
                            </div>

                            {/* ================= เนื้อหาเอกสาร (ส่วนที่จะถูกพิมพ์) ================= */}
                            <div className="print-area">
                                <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #333', paddingBottom: '15px' }}>
                                    <h1 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '5px' }}>ใบแจ้งซ่อมอุปกรณ์</h1>
                                    <p style={{ fontSize: '16px', color: '#555' }}>Repair Ticket</p>
                                </div>

                                <table>
                                    <tbody>
                                        <tr>
                                            <th style={{ width: '30%' }}>เลขที่ใบแจ้งซ่อม</th>
                                            <td style={{ fontWeight: 'bold', fontSize: '16px' }}>{printTicket.ticket_no}</td>
                                        </tr>
                                        <tr>
                                            <th>สถานะ</th>
                                            <td><StatusBadge status={printTicket.status} /></td>
                                        </tr>
                                        <tr>
                                            <th>ชื่ออุปกรณ์</th>
                                            <td>{printTicket.asset_name}</td>
                                        </tr>
                                        <tr>
                                            <th>รายละเอียดปัญหา</th>
                                            <td>{printTicket.problem_details}</td>
                                        </tr>
                                        <tr>
                                            <th>ผู้แจ้งซ่อม</th>
                                            <td>{printTicket.reporter_name}</td>
                                        </tr>
                                        <tr>
                                            <th>วันที่แจ้ง</th>
                                            <td>{printTicket.created_at ? new Date(printTicket.created_at).toLocaleString('th-TH') : '-'}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* ส่วนรับเรื่อง (แสดงเมื่อสถานะ >= accepted) */}
                                {['accepted', 'in_progress', 'returned', 'closed'].includes(printTicket.status) && (
                                    <div style={{ marginTop: '20px' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
                                            🔧 ส่วนรับเรื่อง
                                        </h3>
                                        <table>
                                            <tbody>
                                                <tr>
                                                    <th style={{ width: '30%' }}>ช่างผู้รับเรื่อง</th>
                                                    <td>{printTicket.received_by || '-'}</td>
                                                </tr>
                                                <tr>
                                                    <th>วันที่รับเรื่อง</th>
                                                    <td>{printTicket.received_at ? new Date(printTicket.received_at).toLocaleString('th-TH') : '-'}</td>
                                                </tr>
                                                <tr>
                                                    <th>ลายเซ็นผู้แจ้ง</th>
                                                    <td>
                                                        {printTicket.sender_signature ? (
                                                            <img src={printTicket.sender_signature} alt="ลายเซ็นผู้แจ้ง" className="signature-img" />
                                                        ) : <span style={{ color: '#999' }}>- ไม่มี -</span>}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <th>ลายเซ็นช่าง</th>
                                                    <td>
                                                        {printTicket.receiver_signature ? (
                                                            <img src={printTicket.receiver_signature} alt="ลายเซ็นช่าง" className="signature-img" />
                                                        ) : <span style={{ color: '#999' }}>- ไม่มี -</span>}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* ส่วนส่งคืน (แสดงเมื่อสถานะ >= returned) */}
                                {['returned', 'closed'].includes(printTicket.status) && (
                                    <div style={{ marginTop: '20px' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
                                            📦 ส่วนส่งคืน
                                        </h3>
                                        <table>
                                            <tbody>
                                                <tr>
                                                    <th style={{ width: '30%' }}>วิธีการส่งคืน</th>
                                                    <td>{printTicket.return_method || '-'}</td>
                                                </tr>
                                                <tr>
                                                    <th>ผู้ส่งคืน/ผู้รับคืน</th>
                                                    <td>{printTicket.returned_by || '-'}</td>
                                                </tr>
                                                <tr>
                                                    <th>วันที่ส่งคืน</th>
                                                    <td>{printTicket.returned_at ? new Date(printTicket.returned_at).toLocaleString('th-TH') : '-'}</td>
                                                </tr>
                                                <tr>
                                                    <th>ลายเซ็นผู้ส่ง</th>
                                                    <td>
                                                        {printTicket.return_sender_signature ? (
                                                            <img src={printTicket.return_sender_signature} alt="ลายเซ็นผู้ส่ง" className="signature-img" />
                                                        ) : <span style={{ color: '#999' }}>- ไม่มี -</span>}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <th>ลายเซ็นผู้รับ</th>
                                                    <td>
                                                        {printTicket.return_receiver_signature ? (
                                                            <img src={printTicket.return_receiver_signature} alt="ลายเซ็นผู้รับ" className="signature-img" />
                                                        ) : <span style={{ color: '#999' }}>- ไม่มี -</span>}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* ลงท้ายเอกสาร */}
                                <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
                                    <div style={{ textAlign: 'center', width: '45%' }}>
                                        <p>ลงชื่อผู้แจ้ง ____________________</p>
                                        <p style={{ marginTop: '5px', fontSize: '13px', color: '#666' }}>( {printTicket.reporter_name} )</p>
                                    </div>
                                    <div style={{ textAlign: 'center', width: '45%' }}>
                                        <p>ลงชื่อผู้รับเรื่อง ____________________</p>
                                        <p style={{ marginTop: '5px', fontSize: '13px', color: '#666' }}>( {printTicket.received_by || '........................'} )</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
