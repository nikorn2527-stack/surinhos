"use client";
import React, { useState, useEffect } from 'react';
import SignaturePad from '../../components/SignaturePad'; // ใช้ Path ที่คุณแก้แล้วผ่าน

export default function RepairPage() {
    const [repairs, setRepairs] = useState([]);
    
    // State สำหรับฟอร์มแจ้งซ่อมใหม่
    const [showNewRepairForm, setShowNewRepairForm] = useState(false);
    const [newRepair, setNewRepair] = useState({
        asset_name: '',
        problem_details: '',
        reporter_name: ''
    });

    // State สำหรับลายเซ็นรับเรื่อง
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [technicianName, setTechnicianName] = useState('');

    // ดึงข้อมูลแจ้งซ่อมทั้งหมดจาก API
    const fetchRepairs = async () => {
        try {
            // ⚠️ เปลี่ยน YOUR_TOKEN_HERE เป็น Token จริงของคุณด้วยนะครับ
            const res = await fetch('http://localhost:5000/api/repairs', {
                headers: { 'Authorization': `Bearer YOUR_TOKEN_HERE` } 
            });
            if (res.ok) {
                const data = await res.json();
                setRepairs(data);
            }
        } catch (error) {
            console.error("Error fetching repairs:", error);
        }
    };

    useEffect(() => {
        fetchRepairs();
    }, []);

    // ฟังก์ชันสำหรับส่งข้อมูลแจ้งซ่อมใหม่
    const handleSubmitRepair = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/repairs', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer YOUR_TOKEN_HERE` 
                },
                body: JSON.stringify(newRepair)
            });

            if (res.ok) {
                alert("สร้างใบแจ้งซ่อมสำเร็จ!");
                setShowNewRepairForm(false);
                setNewRepair({ asset_name: '', problem_details: '', reporter_name: '' });
                fetchRepairs(); // โหลดข้อมูลใหม่เพื่อแสดงในรายการ
            } else {
                alert("เกิดข้อผิดพลาดในการแจ้งซ่อม");
            }
        } catch (error) {
            console.error("Error submitting repair:", error);
        }
    };

    // ฟังก์ชันเมื่อช่างกดยืนยันลายเซ็น
    const handleAcceptRepair = async (base64Signature) => {
        if (!technicianName) {
            alert("กรุณากรอกชื่อช่างผู้รับเรื่อง");
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/repairs/${selectedTicketId}/accept`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer YOUR_TOKEN_HERE` 
                },
                body: JSON.stringify({
                    received_by: technicianName,
                    receiver_signature: base64Signature,
                    sender_signature: null
                })
            });

            if (res.ok) {
                alert("บันทึกการรับเรื่องและลายเซ็นสำเร็จ!");
                setShowSignatureModal(false);
                setTechnicianName('');
                fetchRepairs(); 
            }
        } catch (error) {
            console.error("Error accepting repair:", error);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>ระบบแจ้งซ่อม (Repair Tracking)</h1>
                <button 
                    onClick={() => setShowNewRepairForm(true)}
                    style={{ padding: '10px 15px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    + แจ้งซ่อมใหม่
                </button>
            </div>
            
            {/* Modal สำหรับกรอกฟอร์มแจ้งซ่อมใหม่ */}
            {showNewRepairForm && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <form onSubmit={handleSubmitRepair} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>ฟอร์มแจ้งซ่อมอุปกรณ์</h2>
                        
                        <input 
                            type="text" required placeholder="ชื่ออุปกรณ์ / สถานที่..." 
                            value={newRepair.asset_name} onChange={(e) => setNewRepair({...newRepair, asset_name: e.target.value})}
                            style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                        <textarea 
                            required placeholder="รายละเอียดปัญหา..." rows="3"
                            value={newRepair.problem_details} onChange={(e) => setNewRepair({...newRepair, problem_details: e.target.value})}
                            style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                        <input 
                            type="text" required placeholder="ชื่อผู้แจ้งซ่อม..." 
                            value={newRepair.reporter_name} onChange={(e) => setNewRepair({...newRepair, reporter_name: e.target.value})}
                            style={{ width: '100%', padding: '8px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>บันทึกแจ้งซ่อม</button>
                            <button type="button" onClick={() => setShowNewRepairForm(false)} style={{ flex: 1, padding: '10px', backgroundColor: '#f3f4f6', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>ยกเลิก</button>
                        </div>
                    </form>
                </div>
            )}

            {/* แสดงรายการแจ้งซ่อม */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {repairs.length === 0 ? <p>ยังไม่มีรายการแจ้งซ่อม...</p> : repairs.map((ticket) => (
                    <div key={ticket.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <h3 style={{ margin: 0, fontWeight: 'bold' }}>{ticket.ticket_no}</h3>
                            <span style={{ backgroundColor: '#e5e7eb', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{ticket.status}</span>
                        </div>
                        <p style={{ margin: '8px 0' }}><strong>อุปกรณ์:</strong> {ticket.asset_name}</p>
                        <p style={{ margin: '8px 0' }}><strong>ปัญหา:</strong> {ticket.problem_details}</p>
                        <p style={{ margin: '8px 0', fontSize: '14px', color: '#666' }}>ผู้แจ้ง: {ticket.reporter_name}</p>
                        
                        {ticket.status === 'pending' && (
                            <button 
                                onClick={() => {
                                    setSelectedTicketId(ticket.id);
                                    setShowSignatureModal(true);
                                }}
                                style={{ marginTop: '10px', padding: '8px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                ช่างกดรับเรื่อง (เซ็นชื่อ)
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal สำหรับเซ็นชื่อ */}
            {showSignatureModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>เซ็นรับอุปกรณ์ (ช่างรับเรื่อง)</h2>
                        
                        <input 
                            type="text" 
                            placeholder="ชื่อช่างผู้รับเรื่อง..." 
                            value={technicianName}
                            onChange={(e) => setTechnicianName(e.target.value)}
                            style={{ width: '100%', padding: '8px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />

                        {/* เรียกใช้ Component ลายเซ็น */}
                        <SignaturePad 
                            title="ลายเซ็นช่าง" 
                            onSave={handleAcceptRepair} 
                            onClear={() => console.log("ล้างลายเซ็นแล้ว")} 
                        />
                        
                        <button 
                            onClick={() => setShowSignatureModal(false)}
                            style={{ marginTop: '15px', width: '100%', padding: '8px', backgroundColor: '#f3f4f6', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            ยกเลิก
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}