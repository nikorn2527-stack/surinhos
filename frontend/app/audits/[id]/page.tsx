'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Html5QrcodeScanner } from 'html5-qrcode'; 

export default function AuditDetail() {
  const router = useRouter();
  const params = useParams();
  const auditId = params.id;

  const [auditInfo, setAuditInfo] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [org, setOrg] = useState({ prefix: '', orgName: '', logo: '' });
  const [isLoading, setIsLoading] = useState(true);
  
  const [scanInput, setScanInput] = useState('');
  const scanInputRef = useRef<HTMLInputElement>(null);

  // สวิตช์เปิด/ปิดกล้อง
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const itemsRef = useRef(items);
  const isClosedRef = useRef(false);

  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { isClosedRef.current = auditInfo?.status === 'ปิดยอดแล้ว'; }, [auditInfo]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [orgRes, infoRes, itemsRes] = await Promise.all([
        fetch('http://192.168.1.120:5000/api/settings/organization', { headers }),
        fetch(`http://192.168.1.120:5000/api/audits/info/${auditId}`, { headers }),
        fetch(`http://192.168.1.120:5000/api/audits/${auditId}`, { headers })
      ]);

      const orgData = await orgRes.json();
      const infoData = await infoRes.json();
      const itemsData = await itemsRes.json();

      if (orgData && !orgData.error) setOrg(orgData);
      if (infoData && !infoData.error) setAuditInfo(infoData);
      if (Array.isArray(itemsData)) setItems(itemsData);

    } catch (error) {
      console.error('Error fetching audit details:', error);
    } finally {
      setIsLoading(false);
      if (scanInputRef.current) scanInputRef.current.focus();
    }
  };

  useEffect(() => {
    fetchData();
  }, [auditId]);

  const isClosed = auditInfo?.status === 'ปิดยอดแล้ว';

  // ================= 📷 ฟังก์ชันบังคับขอสิทธิ์เข้าถึงกล้อง (เพิ่มใหม่) ================= //
  const requestCameraPermission = async () => {
    try {
      // คำสั่งนี้จะบังคับให้เบราว์เซอร์เด้ง Popup ขออนุญาต
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      alert('✅ ได้รับสิทธิ์เข้าถึงกล้องแล้ว! สามารถกดปุ่ม "เปิดกล้องสแกน" ได้เลยครับ');
      // เมื่อได้สิทธิ์แล้ว ให้ปิดสตรีมกล้องชั่วคราวก่อน เพื่อไม่ให้ค้าง
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error('Camera permission denied:', err);
      alert('❌ ไม่สามารถเข้าถึงกล้องได้\nกรุณาไปที่ "การตั้งค่า (Settings)" ของเบราว์เซอร์ และอนุญาตให้เว็บไซต์นี้เข้าถึงกล้องครับ');
    }
  };

  // ================= 📷 ระบบกล้องมือถือสแกน QR Code ================= //
  useEffect(() => {
    if (isCameraOpen) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      let lastScanned = '';
      let lastScanTime = 0;

      scanner.render(
        (decodedText) => {
          const now = Date.now();
          // ป้องกันสแกนเบิ้ลซ้ำใน 3 วินาที
          if (decodedText === lastScanned && now - lastScanTime < 3000) return; 
          lastScanned = decodedText;
          lastScanTime = now;

          if (isClosedRef.current) return;

          const code = decodedText.trim();
          const matchedItem = itemsRef.current.find(
            (item) => item.asset_code === code || item.asset_number_1 === code
          );

          if (matchedItem) {
            if (matchedItem.check_status === 'พบเครื่อง') {
              new Audio('https://www.myinstants.com/media/sounds/error.mp3').play().catch(() => {});
              alert(`⚠️ สแกนซ้ำ! เครื่อง ${matchedItem.name} ถูกนับไปแล้ว`);
            } else {
              updateItemStatus(matchedItem.audit_detail_id, 'พบเครื่อง');
              new Audio('https://www.myinstants.com/media/sounds/success-bell.mp3').play().catch(() => {});
            }
          } else {
            new Audio('https://www.myinstants.com/media/sounds/error.mp3').play().catch(() => {});
            alert(`❌ ไม่พบรหัส ${code} ในรอบตรวจนับนี้`);
          }
        },
        (error) => {}
      );

      return () => {
        scanner.clear().catch(e => console.error("Failed to clear scanner", e));
      };
    }
  }, [isCameraOpen]);

  // ================= ระบบพิมพ์รหัสด้วยคีย์บอร์ด / ปืนยิง ================= //
  const handleKeyboardScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isClosed) return; 

    const code = scanInput.trim();
    if (!code) return;

    const matchedItem = items.find((item) => item.asset_code === code || item.asset_number_1 === code);

    if (matchedItem) {
      if (matchedItem.check_status === 'พบเครื่อง') {
        new Audio('https://www.myinstants.com/media/sounds/error.mp3').play().catch(() => {});
        alert(`⚠️ สแกนซ้ำ! เครื่อง ${matchedItem.name} ถูกนับไปแล้ว`);
      } else {
        await updateItemStatus(matchedItem.audit_detail_id, 'พบเครื่อง');
        new Audio('https://www.myinstants.com/media/sounds/success-bell.mp3').play().catch(() => {});
      }
    } else {
      new Audio('https://www.myinstants.com/media/sounds/error.mp3').play().catch(() => {});
      alert(`❌ ไม่พบรหัส ${code} ในรอบตรวจนับนี้`);
    }

    setScanInput('');
    if (scanInputRef.current) scanInputRef.current.focus();
  };

  const updateItemStatus = async (detailId: number, newStatus: string) => {
    if (isClosedRef.current) return; 

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`http://192.168.1.120:5000/api/audits/details/${detailId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ check_status: newStatus, notes: '' })
      });

      const data = await res.json(); 

      if (res.ok) {
        setItems(prevItems => prevItems.map(item => 
          item.audit_detail_id === detailId 
            ? { ...item, check_status: newStatus, scanned_at: newStatus === 'พบเครื่อง' ? new Date().toISOString() : null } 
            : item
        ));

        if (data.autoClosed) {
          setTimeout(() => {
            alert('🎉 ยอดเยี่ยม! ตรวจนับครบ 100% แล้ว ระบบปิดยอดให้อัตโนมัติ');
            setIsCameraOpen(false); 
            fetchData(); 
          }, 500);
        }
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleCloseAudit = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการปิดรอบการตรวจนับนี้?\nเมื่อปิดแล้วจะไม่สามารถแก้ไขสถานะได้อีก')) return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`http://192.168.1.120:5000/api/audits/${auditId}/close`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('ปิดยอดการตรวจนับเรียบร้อยแล้ว');
        setIsCameraOpen(false);
        fetchData(); 
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการปิดรอบ');
    }
  };

  // ================= ฟังก์ชันออกรายงาน PDF ================= //
  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('กรุณาอนุญาต Pop-ups สำหรับเว็บไซต์นี้เพื่อพิมพ์ PDF');

    const html = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <title>รายงานผลการตรวจนับครุภัณฑ์ - ${auditInfo?.title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Sarabun', sans-serif; padding: 30px; color: #333; }
          .header-container { text-align: center; margin-bottom: 25px; }
          .logo { width: 90px; height: 90px; object-fit: contain; margin-bottom: 10px; }
          h2 { margin: 0 0 5px 0; font-size: 26px; color: #1e3a8a; }
          .subtitle { font-size: 16px; color: #555; margin-bottom: 5px; }
          .summary-box { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin-bottom: 20px; border-radius: 8px; }
          .summary-item { text-align: center; font-size: 14px; }
          .summary-value { font-size: 20px; font-weight: bold; margin-top: 5px; }
          .text-green { color: #15803d; } .text-red { color: #b91c1c; } .text-orange { color: #c2410c; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          th { background-color: #f1f5f9; font-weight: 600; text-align: center; }
          tr:nth-child(even) { background-color: #fcfcfc; }
          .text-center { text-align: center; }
          @media print { @page { margin: 1cm; size: A4 portrait; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header-container">
          ${org.logo ? `<img src="${org.logo}" class="logo" alt="Logo" />` : ''}
          <h2>${org.prefix || ''} ${org.orgName || 'รายงานผลการตรวจนับ'}</h2>
          <div class="subtitle"><strong>หัวข้อการตรวจนับ:</strong> ${auditInfo?.title}</div>
          <div class="subtitle">
            <strong>หมวดหมู่เป้าหมาย:</strong> ${auditInfo?.target_category || 'ทั้งหมด'} | 
            <strong>ประเภท:</strong> ${auditInfo?.audit_type}
          </div>
        </div>

        <div class="summary-box">
          <div class="summary-item">เป้าหมายทั้งหมด<div class="summary-value">${items.length} ชิ้น</div></div>
          <div class="summary-item text-green">พบเครื่อง / ยืนยันแล้ว<div class="summary-value">${items.filter(i => i.check_status === 'พบเครื่อง').length} ชิ้น</div></div>
          <div class="summary-item text-red">สูญหาย<div class="summary-value">${items.filter(i => i.check_status === 'สูญหาย').length} ชิ้น</div></div>
          <div class="summary-item text-orange">ชำรุด<div class="summary-value">${items.filter(i => i.check_status === 'ชำรุด').length} ชิ้น</div></div>
        </div>

        <table>
          <thead>
            <tr>
              <th width="8%">ลำดับ</th>
              <th width="20%">หมายเลขควบคุม</th>
              <th width="35%">ชื่อรายการครุภัณฑ์</th>
              <th width="20%">อัปเดตล่าสุด</th>
              <th width="17%">สถานะการตรวจนับ</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, index) => {
              let statusColor = "#333";
              let statusText = item.check_status;
              if (item.check_status === 'พบเครื่อง') { statusColor = "#15803d"; statusText = "พบเครื่อง ✅"; }
              if (item.check_status === 'สูญหาย') { statusColor = "#b91c1c"; statusText = "สูญหาย ❌"; }
              if (item.check_status === 'ชำรุด') { statusColor = "#c2410c"; statusText = "ชำรุด ⚠️"; }
              if (item.check_status === 'รอตรวจสอบ') { statusColor = "#a16207"; }

              return `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td><strong>${item.asset_code}</strong><br><span style="font-size:11px; color:#777;">${item.asset_number_1 || ''}</span></td>
                  <td>${item.name}</td>
                  <td class="text-center">${item.scanned_at ? new Date(item.scanned_at).toLocaleString('th-TH') : '-'}</td>
                  <td class="text-center" style="color: ${statusColor}; font-weight: bold;">${statusText}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div style="margin-top: 40px; display: flex; justify-content: space-around;">
          <div style="text-align: center;">
            <br><br>
            <p>ลงชื่อ..........................................................ผู้ตรวจนับ</p>
            <p>(..........................................................)</p>
            <p>วันที่........./........./.........</p>
          </div>
          <div style="text-align: center;">
            <br><br>
            <p>ลงชื่อ..........................................................ผู้รับรอง</p>
            <p>(..........................................................)</p>
            <p>วันที่........./........./.........</p>
          </div>
        </div>

        <script>
          window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 800); };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const total = items.length;
  const found = items.filter(i => i.check_status === 'พบเครื่อง').length;
  const missing = items.filter(i => i.check_status === 'สูญหาย').length;
  const broken = items.filter(i => i.check_status === 'ชำรุด').length;
  const pending = items.filter(i => i.check_status === 'รอตรวจสอบ').length;

  if (isLoading) return <div className="min-h-screen flex justify-center items-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

  return (
    <div className="min-h-screen bg-gray-100 p-3 md:p-10 font-sans pb-24">
      <div className="">
        
        {/* หัวกระดาษ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/audits')} className="btn btn-circle btn-ghost bg-gray-50 shadow-sm border border-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                {isClosed ? 'รายงานผลการตรวจนับ' : 'กำลังตรวจนับครุภัณฑ์'}
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">{auditInfo?.title} (รหัส: #{auditId})</p>
            </div>
          </div>

          {isClosed ? (
            <button onClick={exportToPDF} className="btn btn-primary text-white shadow-md w-full md:w-auto">
              🖨️ พิมพ์รายงาน PDF
            </button>
          ) : (
            <button onClick={handleCloseAudit} className="btn btn-error text-white shadow-md w-full md:w-auto">
              🔒 ปิดยอดการตรวจนับ
            </button>
          )}
        </div>

        {/* แผงควบคุมการสแกน (แสดงเฉพาะเมื่อยังไม่ปิดยอด) */}
        {!isClosed && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4">
            <form onSubmit={handleKeyboardScan} className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-xl opacity-50">⌨️</span>
              </div>
              <input 
                ref={scanInputRef}
                type="text" 
                className="input input-bordered input-lg w-full pl-12 bg-indigo-50/50 border-indigo-200 focus:border-indigo-500 font-medium"
                placeholder="สแกนด้วยปืนยิง หรือพิมพ์รหัส..."
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
              />
            </form>
            
            {/* 💡 ปุ่มสำหรับขอสิทธิ์เข้าถึงกล้อง (เพิ่มใหม่) */}
            <button 
              type="button"
              onClick={requestCameraPermission}
              className="btn btn-lg btn-outline btn-info shadow-md w-full md:w-auto"
            >
              🔐 ขอสิทธิ์เข้าถึงกล้อง
            </button>

            <button 
              type="button"
              onClick={() => setIsCameraOpen(!isCameraOpen)} 
              className={`btn btn-lg ${isCameraOpen ? 'btn-error' : 'btn-primary'} text-white shadow-md w-full md:w-auto`}
            >
              {isCameraOpen ? '❌ ปิดกล้อง' : '📷 เปิดกล้องมือถือสแกน'}
            </button>
          </div>
        )}

        {/* จอแสดงกล้องสแกน */}
        {isCameraOpen && !isClosed && (
          <div className="bg-black p-4 rounded-2xl shadow-2xl mb-6 flex flex-col items-center border-4 border-primary relative overflow-hidden animate-fade-in">
            <h3 className="text-white font-bold mb-3 text-center">📱 เล็งกล้องไปที่ QR Code ของครุภัณฑ์</h3>
            <div id="qr-reader" className="w-full max-w-sm bg-white rounded-xl overflow-hidden shadow-inner"></div>
            <p className="text-gray-400 text-xs mt-4">ระบบจะตรวจจับและบันทึกอัตโนมัติ (มีเสียงแจ้งเตือน)</p>
          </div>
        )}

        {/* แผงสรุปตัวเลข (Dashboard) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
            <div className="text-xs font-bold text-gray-500 mb-1">ทั้งหมด</div>
            <div className="text-2xl font-black text-gray-800">{total}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-xl shadow-sm border border-green-200 text-center">
            <div className="text-xs font-bold text-green-700 mb-1">พบเครื่องแล้ว</div>
            <div className="text-2xl font-black text-green-700">{found}</div>
          </div>
          {(!isClosed || pending > 0) && (
            <div className="bg-yellow-50 p-4 rounded-xl shadow-sm border border-yellow-200 text-center">
              <div className="text-xs font-bold text-yellow-700 mb-1">รอตรวจสอบ</div>
              <div className="text-2xl font-black text-yellow-700">{pending}</div>
            </div>
          )}
          <div className="bg-red-50 p-4 rounded-xl shadow-sm border border-red-200 text-center">
            <div className="text-xs font-bold text-red-700 mb-1">สูญหาย</div>
            <div className="text-2xl font-black text-red-700">{missing}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-xl shadow-sm border border-orange-200 text-center">
            <div className="text-xs font-bold text-orange-700 mb-1">ชำรุด</div>
            <div className="text-2xl font-black text-orange-700">{broken}</div>
          </div>
        </div>

        {/* ================= 📱 แบบแสดงผลบนมือถือ (Card Layout) ================= */}
        <div className="block md:hidden space-y-4">
          {items.map((item) => (
            <div key={item.audit_detail_id} className={`bg-white p-4 rounded-xl shadow-sm border ${item.check_status === 'พบเครื่อง' ? 'border-green-300 bg-green-50/30' : 'border-gray-200'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-gray-900 text-lg leading-tight">{item.asset_code}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.name}</div>
                </div>
                {isClosed ? (
                  <div className={`badge badge-sm font-bold ${item.check_status === 'พบเครื่อง' ? 'badge-success text-white' : item.check_status === 'รอตรวจสอบ' ? 'badge-ghost' : 'badge-error text-white'}`}>
                    {item.check_status}
                  </div>
                ) : (
                  <select 
                    className={`select select-sm select-bordered font-bold text-xs ${item.check_status === 'พบเครื่อง' ? 'text-green-700 border-green-500' : ''}`}
                    value={item.check_status}
                    onChange={(e) => updateItemStatus(item.audit_detail_id, e.target.value)}
                  >
                    <option value="รอตรวจสอบ">รอตรวจสอบ</option>
                    <option value="พบเครื่อง">พบเครื่อง ✅</option>
                    <option value="สูญหาย">สูญหาย ❌</option>
                    <option value="ชำรุด">ชำรุด ⚠️</option>
                  </select>
                )}
              </div>
              <div className="flex justify-between items-center text-[11px] text-gray-400 border-t border-gray-100 pt-2">
                <span>รหัสเดิม: {item.asset_number_1 || '-'}</span>
                {item.scanned_at ? (
                  <span className="text-green-600 font-medium">🕒 อัปเดตเมื่อ {new Date(item.scanned_at).toLocaleTimeString('th-TH')}</span>
                ) : (
                  <span>ยังไม่ได้อัปเดต</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ================= 💻 แบบแสดงผลบน PC/Tablet (Table Layout) ================= */}
        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="table w-full">
            <thead className="bg-gray-50 text-gray-700 text-sm border-b border-gray-200">
              <tr>
                <th className="py-4 pl-6 text-left">รหัส / หมายเลข</th>
                <th className="py-4 text-left">รายการครุภัณฑ์</th>
                <th className="py-4 text-left">หมวดหมู่</th>
                <th className="py-4 text-center">อัปเดตล่าสุด</th>
                <th className="py-4 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.audit_detail_id} className={`border-b border-gray-100 transition-colors ${item.check_status === 'พบเครื่อง' ? 'bg-green-50/20' : 'hover:bg-blue-50/10'}`}>
                  <td className="py-4 pl-6">
                    <div className="font-bold text-gray-900">{item.asset_code}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.asset_number_1 || '-'}</div>
                  </td>
                  <td className="py-4 text-gray-800 font-medium">{item.name}</td>
                  <td className="py-4 text-gray-500 text-sm">{item.category}</td>
                  <td className="py-4 text-center text-xs text-gray-500">
                    {item.scanned_at ? new Date(item.scanned_at).toLocaleTimeString('th-TH') : '-'}
                  </td>
                  <td className="py-4 text-center">
                    {isClosed ? (
                      <div className={`badge font-bold px-3 py-3 ${item.check_status === 'พบเครื่อง' ? 'badge-success text-white' : item.check_status === 'รอตรวจสอบ' ? 'badge-ghost' : 'badge-error text-white'}`}>
                        {item.check_status} {item.check_status === 'พบเครื่อง' && '✅'}
                      </div>
                    ) : (
                      <select 
                        className={`select select-bordered font-bold ${item.check_status === 'พบเครื่อง' ? 'border-green-500 text-green-700 bg-green-50' : 'bg-white'}`}
                        value={item.check_status}
                        onChange={(e) => updateItemStatus(item.audit_detail_id, e.target.value)}
                      >
                        <option value="รอตรวจสอบ">รอตรวจสอบ</option>
                        <option value="พบเครื่อง">พบเครื่อง ✅</option>
                        <option value="สูญหาย">สูญหาย ❌</option>
                        <option value="ชำรุด">ชำรุด ⚠️</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}