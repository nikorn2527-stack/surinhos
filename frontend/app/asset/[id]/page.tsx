'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

export default function AssetDetail() {
  const params = useParams();
  const router = useRouter();
  const [asset, setAsset] = useState<any>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch(`http://192.168.1.120:5000/api/assets/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setAsset(data);
        setStatus(data.status);
      });
  }, [params.id]);

  const handleUpdateStatus = async () => {
    await fetch(`http://192.168.1.120:5000/api/assets/${params.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    alert('อัปเดตสถานะเรียบร้อยแล้ว!');
    router.push('/');
  };

  if (!asset) return <div className="p-8 text-center">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-4xl mx-auto flex gap-6">
        
        {/* แผงควบคุม อัปเดตสถานะ */}
        <div className="card bg-base-100 shadow-xl flex-1">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">ข้อมูลครุภัณฑ์</h2>
            <div className="space-y-2 mb-6 text-lg">
              <p><b>รหัส:</b> {asset.asset_code}</p>
              <p><b>ชื่อ:</b> {asset.name}</p>
              <p><b>หมวดหมู่:</b> {asset.category}</p>
              <p><b>ราคา:</b> ฿{Number(asset.price).toLocaleString('th-TH')}</p>
            </div>
            
            <div className="form-control mb-4">
              <label className="label"><b>เปลี่ยนสถานะครุภัณฑ์</b></label>
              <select className="select select-bordered w-full" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="ปกติ">ปกติ (พร้อมใช้งาน)</option>
                <option value="ส่งซ่อม">ส่งซ่อม</option>
                <option value="ชำรุด">ชำรุด</option>
                <option value="แทงจำหน่าย">แทงจำหน่าย</option>
              </select>
            </div>
            <button onClick={handleUpdateStatus} className="btn btn-primary w-full">บันทึกสถานะ</button>
          </div>
        </div>

        {/* ป้าย QR Code สำหรับพิมพ์แปะอุปกรณ์ */}
        <div className="card bg-base-100 shadow-xl flex-none w-80">
          <div className="card-body items-center text-center">
            <h2 className="card-title mb-2">ป้ายสแกนครุภัณฑ์</h2>
            
            {/* กรอบที่จะนำไปพิมพ์ */}
            <div className="border-2 border-dashed border-gray-400 p-6 rounded-lg bg-white w-full">
              <h3 className="font-bold text-sm text-gray-800 uppercase tracking-wide">Pacific Plus IT Limited Partnership</h3>
              <p className="text-xs text-gray-600 mb-4">โทร: 042 222 456</p>
              
              <div className="bg-white p-2 inline-block rounded">
                <QRCodeSVG 
                  value={`http://localhost:3000/asset/${params.id}`} 
                  size={150} 
                  level="H"
                />
              </div>
              
              <div className="mt-4 text-left text-sm text-gray-800">
                <p className="font-mono bg-gray-100 p-1 rounded font-bold">{asset.asset_code}</p>
                <p className="mt-1 line-clamp-2 leading-tight">{asset.name}</p>
              </div>
            </div>

            <button onClick={() => window.print()} className="btn btn-outline mt-4 w-full">🖨️ พิมพ์ป้าย QR</button>
          </div>
        </div>

      </div>
    </div>
  );
}