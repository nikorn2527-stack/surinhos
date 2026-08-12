'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuditList() {
  const router = useRouter();
  const [audits, setAudits] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State สำหรับ Modal สร้างรอบใหม่
  const [showModal, setShowModal] = useState(false);
  const [newAudit, setNewAudit] = useState({
    title: '',
    audit_type: 'รายเดือน',
    target_category: 'ทั้งหมด',
    start_date: '',
    end_date: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  // ดึงข้อมูลประวัติการตรวจนับ และหมวดหมู่
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [auditRes, catRes] = await Promise.all([
        fetch('http://192.168.1.120:5000/api/audits', { headers }),
        fetch('http://192.168.1.120:5000/api/categories')
      ]);
      
      if (auditRes.status === 401 || auditRes.status === 403) return router.push('/login');

      const auditData = await auditRes.json();
      const catData = await catRes.json();

      if (Array.isArray(auditData)) setAudits(auditData);
      if (Array.isArray(catData)) setCategories(catData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ฟังก์ชันสร้างรอบตรวจนับใหม่
  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAudit.title) return alert('กรุณาระบุชื่อรอบการตรวจนับ');
    
    setIsCreating(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('http://192.168.1.120:5000/api/audits', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAudit)
      });

      const data = await res.json();
      
      if (res.ok) {
        setShowModal(false);
        router.push(`/audits/${data.auditId}`); 
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการเปิดรอบ');
      }
    } catch (error) {
      alert('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans">
      <div className="">
        
        {/* หัวกระดาษ */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-5">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">ระบบตรวจนับครุภัณฑ์ (Audit)</h1>
              <p className="text-gray-500 mt-1 text-sm">จัดการรอบการตรวจเช็คสภาพ และอัปเดตสถานะอุปกรณ์ในระบบ</p>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary px-6 text-white shadow-lg text-lg">
            ➕ เปิดรอบตรวจนับใหม่
          </button>
        </div>

        {/* ตารางแสดงประวัติ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center p-10"><span className="loading loading-spinner loading-lg text-primary"></span></div>
          ) : audits.length === 0 ? (
            <div className="text-center p-16 text-gray-400">
              <span className="text-5xl block mb-4">📋</span>
              <p className="text-lg font-medium">ยังไม่มีประวัติการตรวจนับ</p>
              <p className="text-sm mt-1">กดปุ่ม "เปิดรอบตรวจนับใหม่" เพื่อเริ่มต้น</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="bg-indigo-50 text-indigo-900 text-[15px]">
                  <tr>
                    <th className="py-4 pl-6 text-left">วันที่สร้าง</th>
                    <th className="py-4 text-left">ชื่อรอบการตรวจนับ</th>
                    <th className="py-4 text-left">เงื่อนไข (หมวดหมู่ / วันที่)</th>
                    <th className="py-4 text-center">สถานะ</th>
                    <th className="py-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map((audit) => (
                    <tr key={audit.id} className="hover:bg-blue-50/30 border-b border-gray-100 transition-colors">
                      <td className="py-4 pl-6 text-gray-500 whitespace-nowrap">
                        {new Date(audit.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-4 text-gray-800 font-bold">
                        {audit.title}
                        <div className="text-xs font-normal text-gray-400 mt-1">ประเภท: {audit.audit_type}</div>
                      </td>
                      <td className="py-4 text-sm text-gray-600">
                        <div><span className="font-semibold">หมวด:</span> {audit.target_category || 'ทั้งหมด'}</div>
                        {(audit.start_date && audit.end_date) && (
                          <div className="text-xs text-gray-400 mt-1">
                            📅 {new Date(audit.start_date).toLocaleDateString('th-TH')} - {new Date(audit.end_date).toLocaleDateString('th-TH')}
                          </div>
                        )}
                      </td>
                      <td className="py-4 text-center">
                        <span className={`badge font-bold ${audit.status === 'กำลังตรวจนับ' ? 'badge-warning text-yellow-900' : 'badge-success text-white'}`}>
                          {audit.status}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <button 
                          onClick={() => router.push(`/audits/${audit.id}`)} 
                          className="btn btn-sm btn-outline btn-primary"
                        >
                          {audit.status === 'กำลังตรวจนับ' ? '🔍 เข้าไปตรวจนับ' : '📄 ดูรายงาน'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Modal สำหรับเปิดรอบใหม่ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-indigo-50/50">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">📋 เปิดรอบตรวจนับใหม่</h3>
              <p className="text-sm text-gray-500 mt-1">ระบบจะดึงครุภัณฑ์ที่ "ใช้งานปกติ" มารอให้ตรวจนับอัตโนมัติ</p>
            </div>
            
            <form onSubmit={handleCreateAudit} className="p-6 space-y-4">
              <div className="form-control">
                <label className="label font-bold text-gray-700">ชื่อรอบการตรวจนับ</label>
                <input 
                  type="text" 
                  placeholder="เช่น ตรวจนับอุปกรณ์ IT ประจำเดือน..." 
                  className="input input-bordered w-full"
                  value={newAudit.title}
                  onChange={(e) => setNewAudit({...newAudit, title: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label font-bold text-gray-700">ประเภท</label>
                  <select 
                    className="select select-bordered w-full"
                    value={newAudit.audit_type}
                    onChange={(e) => setNewAudit({...newAudit, audit_type: e.target.value})}
                  >
                    <option value="รายวัน">รายวัน</option>
                    <option value="รายเดือน">รายเดือน</option>
                    <option value="รายปี">รายปี</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label font-bold text-gray-700">หมวดหมู่เป้าหมาย</label>
                  <select 
                    className="select select-bordered w-full"
                    value={newAudit.target_category}
                    onChange={(e) => setNewAudit({...newAudit, target_category: e.target.value})}
                  >
                    <option value="ทั้งหมด">ทั้งหมด</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label font-bold text-gray-700">วันที่เริ่ม (ไม่บังคับ)</label>
                  <input 
                    type="date" 
                    className="input input-bordered w-full text-sm"
                    value={newAudit.start_date}
                    onChange={(e) => setNewAudit({...newAudit, start_date: e.target.value})}
                  />
                </div>
                <div className="form-control">
                  <label className="label font-bold text-gray-700">วันที่สิ้นสุด (ไม่บังคับ)</label>
                  <input 
                    type="date" 
                    className="input input-bordered w-full text-sm"
                    value={newAudit.end_date}
                    onChange={(e) => setNewAudit({...newAudit, end_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary text-white px-8" disabled={isCreating}>
                  {isCreating ? <span className="loading loading-spinner"></span> : 'บันทึกและเริ่มสแกน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}