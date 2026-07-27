'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function PrintAssetRegister() {
  const params = useParams();
  const id = params.id;
  const [asset, setAsset] = useState<any>(null);
  const [org, setOrg] = useState<any>({ prefix: '', orgName: '', logo: '' }); // 💡 เพิ่ม State สำหรับหน่วยงาน
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 💡 1. ดึงข้อมูลหน่วยงาน
    fetch('http://192.168.1.120:5000/api/settings/organization')
      .then(res => res.json())
      .then(data => {
        if (data) setOrg(data);
      })
      .catch(err => console.error('Error fetching org:', err));

    // 2. ดึงข้อมูลครุภัณฑ์
    fetch(`http://192.168.1.120:5000/api/assets/${id}`)
      .then(res => res.json())
      .then(data => {
        setAsset(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching asset:', err);
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) return <div className="text-center mt-20">กำลังเตรียมเอกสาร...</div>;
  if (!asset) return <div className="text-center mt-20">ไม่พบข้อมูลครุภัณฑ์</div>;

  // คำนวณค่าเสื่อมราคา
  const price = Number(asset.price) || 0;
  const quantity = Number(asset.quantity) || 1;
  const totalValue = price * quantity;
  const lifespan = Number(asset.lifespan_years) || 1;
  
  const yearlyDepreciation = price / lifespan;
  const monthlyDepreciation = yearlyDepreciation / 12;
  const netValue = price - yearlyDepreciation; // สมมติฐานสำหรับปีแรก

  // แปลงวันที่ให้อ่านง่าย (เช่น 22 เม.ย. 2569)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // ดึงปีงบประมาณจากหมายเลขครุภัณฑ์ (เช่น ลงท้ายด้วย /69 -> 2569)
  let fiscalYear = '-';
  if (asset.asset_number_1 && asset.asset_number_1.includes('/')) {
    const parts = asset.asset_number_1.split('/');
    fiscalYear = "25" + parts[parts.length - 1];
  } else if (asset.acquired_date) {
    fiscalYear = (new Date(asset.acquired_date).getFullYear() + 543).toString();
  }

  return (
    <div className="bg-gray-200 min-h-screen py-8 print:py-0 flex justify-center text-black">
      
      {/* ปุ่มสั่งพิมพ์ (จะถูกซ่อนเมื่ออยู่ในโหมดพิมพ์) */}
      <div className="fixed top-4 right-4 print:hidden z-50">
        <button 
          onClick={() => window.print()} 
          className="btn btn-primary shadow-lg text-white px-8 rounded-full"
        >
          🖨️ สั่งพิมพ์เอกสาร
        </button>
      </div>

      {/* หน้ากระดาษ A4 แนวนอน */}
      <div className="bg-white w-[297mm] min-h-[210mm] p-[15mm] shadow-lg print:shadow-none font-sans relative">
        
        {/* 💡 หัวเอกสาร (เพิ่มโลโก้) */}
        <div className="flex flex-col items-center mb-6 text-center">
          {org.logo && <img src={org.logo} alt="Logo" className="w-20 h-20 object-contain mb-3" />}
          <h1 className="text-xl font-bold">ทะเบียนคุมทรัพย์สิน</h1>
        </div>

        {/* 💡 ส่วนราชการ / หน่วยงาน (มุมขวาบน - ดึงชื่อองค์กรมาใส่) */}
        <div className="flex justify-end mb-6 text-[14px]">
          <div className="w-[45%]">
            <div className="grid grid-cols-[100px_1fr] gap-2 mb-2">
              <span className="font-bold">ส่วนราชการ</span>
              <span>{org.orgName ? `${org.prefix} ${org.orgName}` : (asset.organization || '-')}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <span className="font-bold">หน่วยงาน</span>
              <span>{asset.department || '-'}</span>
            </div>
          </div>
        </div>

        {/* ข้อมูลรายละเอียด (จัด Layout ตามต้นฉบับ 100%) */}
        <div className="text-[14px] leading-relaxed">
          
          {/* บรรทัดที่ 1-4 : แบ่ง 2 คอลัมน์ */}
          <div className="grid grid-cols-2 gap-y-4 mb-4">
            <div><span className="font-bold mr-2">ประเภท</span>{asset.category || '-'}</div>
            <div><span className="font-bold mr-2">รหัส</span>{asset.asset_number_1 || '-'}</div>
            
            <div><span className="font-bold mr-2">ลักษณะ/คุณสมบัติ</span>{asset.name || '-'}</div>
            <div><span className="font-bold mr-2">รุ่น/แบบ</span>{asset.brand || '-'}</div>
            
            <div><span className="font-bold mr-2">สถานที่ตั้ง/หน่วยงานรับผิดชอบ</span>{asset.department || '-'}</div>
            <div><span className="font-bold mr-2">ชื่อผู้ขาย/ผู้รับจ้าง/ผู้บริจาค</span>{asset.vendor || '-'}</div>
            
            <div><span className="font-bold mr-2">ที่อยู่</span>{asset.vendor_address || '-'}</div>
            <div className="pl-[25%]"><span className="font-bold mr-2">โทร.</span>{asset.vendor_phone || '-'}</div>
          </div>

          {/* บรรทัดที่ 5 : แบ่ง 4 คอลัมน์ */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr] gap-4 mb-4">
            <div><span className="font-bold mr-2">เลขที่ GFMIS</span>{asset.gfmis || '-'}</div>
            <div><span className="font-bold mr-2">เลขที่ PO</span>{asset.po_number || '-'}</div>
            <div><span className="font-bold mr-2">S/N :</span>{asset.serial_number || '-'}</div>
            <div className="text-right pr-4"><span className="font-bold mr-2">สิ้นสุดประกัน :</span>{formatDate(asset.warranty_end)}</div>
          </div>

          {/* บรรทัดที่ 6 : แบ่ง 3 คอลัมน์ */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div><span className="font-bold mr-2">ปีงบที่ได้มา</span>{fiscalYear}</div>
            <div><span className="font-bold mr-2">ประเภทเงิน</span>{asset.funding_type || '-'}</div>
            <div><span className="font-bold mr-2">วิธีการได้มา</span>{asset.acquired_method || '-'}</div>
          </div>
          
        </div>

        {/* ตารางข้อมูล (ตัดแถวว่างออก แสดงผลเฉพาะข้อมูลที่มี) */}
        <table className="w-full border-collapse border border-black text-[12px] text-center mt-2">
          <thead>
            <tr>
              <th className="border border-black p-2 font-bold font-sans">วันเดือนปี</th>
              <th className="border border-black p-2 font-bold font-sans">ที่เอกสาร</th>
              <th className="border border-black p-2 font-bold font-sans w-1/5">รายการ</th>
              <th className="border border-black p-2 font-bold font-sans">จำนวน<br/>หน่วย</th>
              <th className="border border-black p-2 font-bold font-sans">ราคาต่อ<br/>หน่วย</th>
              <th className="border border-black p-2 font-bold font-sans">มูลค่ารวม</th>
              <th className="border border-black p-2 font-bold font-sans">อายุใช้<br/>งาน</th>
              <th className="border border-black p-2 font-bold font-sans">อัตราค่าเสื่อมราคา<br/>/ประจำเดือน</th>
              <th className="border border-black p-2 font-bold font-sans">ค่าเสื่อมราคา<br/>ประจำปี</th>
              <th className="border border-black p-2 font-bold font-sans">ค่าเสื่อมราคา<br/>สะสม</th>
              <th className="border border-black p-2 font-bold font-sans">มูลค่าสุทธิ</th>
              <th className="border border-black p-2 font-bold font-sans">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-2 align-top">{formatDate(asset.acquired_date)}</td>
              <td className="border border-black p-2 align-top">{asset.document_no || '-'}</td>
              <td className="border border-black p-2 text-left align-top">{asset.name}</td>
              <td className="border border-black p-2 align-top">{quantity}</td>
              <td className="border border-black p-2 text-right align-top">{price.toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
              <td className="border border-black p-2 text-right align-top">{totalValue.toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
              <td className="border border-black p-2 align-top">{asset.lifespan_years}</td>
              <td className="border border-black p-2 text-right align-top">{monthlyDepreciation.toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
              <td className="border border-black p-2 text-right align-top">{yearlyDepreciation.toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
              <td className="border border-black p-2 text-right align-top">{yearlyDepreciation.toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
              <td className="border border-black p-2 text-right align-top">{netValue.toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
              <td className="border border-black p-2 align-top">{asset.remarks || ''}</td>
            </tr>
          </tbody>
        </table>

      </div>

      {/* ตั้งค่าหน้ากระดาษเป็นแนวนอนสำหรับพิมพ์ */}
      <style jsx global>{`
        @media print {
          @page { 
            size: A4 landscape; 
            margin: 0; 
          }
          body { 
            -webkit-print-color-adjust: exact; 
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}