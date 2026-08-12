'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function ViewAsset() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const { token, hasPermission } = useAuth();

  const [asset, setAsset] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !token) return;

    const fetchAsset = async () => {
      try {
        const res = await fetch(`http://192.168.1.120:5000/api/assets/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setAsset(data);
          if (data.images && data.images.length > 0) {
            setActiveImage(data.images[0].image_data || data.images[0]);
          }
        } else {
          alert('ไม่พบข้อมูลครุภัณฑ์');
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching asset:', error);
        alert('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAsset();
  }, [id, router, token]);

  const formatThaiDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // ================= 💡 ฟังก์ชันคำนวณค่าเสื่อมราคา (แบบรายวัน ตามมาตรฐานบัญชี) =================
  const calculateDepreciation = () => {
    if (!asset.price || !asset.acquired_date || !asset.lifespan_years) return null;

    const cost = Number(asset.price);
    const lifeYears = Number(asset.lifespan_years);
    const salvageValue = 1; // ราคาซากมาตรฐาน 1 บาท

    const acquiredDate = new Date(asset.acquired_date);
    const today = new Date();
    
    // คำนวณวันสิ้นสุดอายุการใช้งาน
    const endOfLifeDate = new Date(acquiredDate);
    endOfLifeDate.setFullYear(endOfLifeDate.getFullYear() + lifeYears);

    // จำนวนวันทั้งหมดตามอายุการใช้งาน
    const totalDays = (endOfLifeDate.getTime() - acquiredDate.getTime()) / (1000 * 60 * 60 * 24);
    // จำนวนวันที่ใช้งานมาแล้วจนถึงปัจจุบัน
    const daysUsed = Math.max(0, (today.getTime() - acquiredDate.getTime()) / (1000 * 60 * 60 * 24));

    let accumulated = 0;
    let netBookValue = cost;
    let depPerYear = (cost - salvageValue) / lifeYears;

    if (daysUsed >= totalDays) {
      // กรณีหมดอายุการใช้งานแล้ว
      accumulated = cost - salvageValue;
      netBookValue = salvageValue; // เหลือ 1 บาท
    } else {
      // กรณีอยู่ระหว่างการใช้งาน (คิดค่าเสื่อมแบบรายวัน)
      const dailyDepreciation = (cost - salvageValue) / totalDays;
      accumulated = dailyDepreciation * daysUsed;
      netBookValue = cost - accumulated;
    }

    return {
      accumulated: accumulated,
      netBookValue: netBookValue,
      depPerYear: depPerYear,
      isExpired: daysUsed >= totalDays
    };
  };

  const depData = asset ? calculateDepreciation() : null;
  // =========================================================================

  if (isLoading) return <div className="text-center mt-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  if (!asset) return null;

  let statusBadge = "badge-ghost";
  if (asset.status === 'ใช้งานปกติ') statusBadge = "badge-success text-white";
  if (asset.status === 'ชำรุดรอซ่อม') statusBadge = "badge-warning text-yellow-900";
  if (asset.status === 'เสื่อมสภาพ/รอจำหน่าย') statusBadge = "badge-error text-white";
  if (asset.status === 'แทงจำหน่ายแล้ว') statusBadge = "badge-error text-white";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans">
      <div className="">
        
        {/* Header & รวมปุ่มจัดการ */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">รายละเอียดครุภัณฑ์</h1>
              <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <span>หมายเลขควบคุม: {asset.asset_code}</span>
                <span className={`badge ${statusBadge} badge-sm`}>{asset.status}</span>
              </div>
            </div>
          </div>
          
          {/* กลุ่มปุ่มที่ย้ายมาจากหน้าหลัก */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {hasPermission('manage_qr') && (
              <a href={`/sticker/${asset.id}`} target="_blank" className="btn btn-outline border-gray-300 text-pink-600 hover:bg-pink-50 hover:border-pink-500 flex-1 md:flex-none shadow-sm bg-white">
                🏷️ สติ๊กเกอร์
              </a>
            )}
            {hasPermission('print_asset_form') && (
              <a href={`/print/${asset.id}`} target="_blank" className="btn btn-info text-white flex-1 md:flex-none shadow-sm">
                🖨️ พิมพ์ สพ.4
              </a>
            )}
            {hasPermission('edit_asset') && (
              <a href={`/edit/${asset.id}`} className="btn btn-warning text-white flex-1 md:flex-none shadow-sm">
                ✏️ แก้ไขข้อมูล
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* คอลัมน์ซ้าย: แกลเลอรีรูปภาพ */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card bg-white shadow-sm border border-gray-100 p-4">
              <div className="aspect-square w-full rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                {activeImage ? (
                  <img src={activeImage} alt="Main Asset" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-400 flex flex-col items-center">
                    <span className="text-5xl mb-2">📷</span>
                    <span>ไม่มีรูปภาพประกอบ</span>
                  </div>
                )}
              </div>
              
              {asset.images && asset.images.length > 0 && (
                <div className="flex gap-4 mt-4 overflow-x-auto p-2">
                  {asset.images.map((imgObj: any, index: number) => {
                    const imgSrc = imgObj.image_data || imgObj;
                    return (
                      <button 
                        key={index} 
                        onClick={() => setActiveImage(imgSrc)}
                        className={`w-16 h-16 rounded-lg shrink-0 transition-all ${
                          activeImage === imgSrc 
                            ? 'ring-2 ring-primary ring-offset-2 shadow-md scale-105' 
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={imgSrc} alt={`thumb-${index}`} className="w-full h-full object-cover rounded-lg" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* คอลัมน์ขวา: ข้อมูลรายละเอียด */}
          <div className="lg:col-span-2 space-y-6">
            {/* กล่อง 1: ข้อมูลหลัก */}
            <div className="card bg-white shadow-sm border border-gray-100">
              <div className="card-body p-6">
                <h2 className="text-xl font-bold text-primary border-b pb-2 mb-4 flex items-center gap-2">📦 ข้อมูลหลัก</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  <div><div className="text-sm text-gray-500 font-semibold mb-1">ชื่อรายการ</div><div className="text-lg font-bold text-gray-900">{asset.name || '-'}</div></div>
                  <div><div className="text-sm text-gray-500 font-semibold mb-1">หมวดหมู่</div><div className="text-gray-800">{asset.category || '-'}</div></div>
                  <div><div className="text-sm text-gray-500 font-semibold mb-1">หมายเลขครุภัณฑ์ 1</div><div className="text-teal-700 font-bold tracking-wide">{asset.asset_number_1 || '-'}</div></div>
                  <div><div className="text-sm text-gray-500 font-semibold mb-1">หมายเลขครุภัณฑ์เดิม</div><div className="text-gray-800">{asset.asset_number_2 || '-'}</div></div>
                  <div><div className="text-sm text-gray-500 font-semibold mb-1">ยี่ห้อ / รุ่น / ขนาด</div><div className="text-gray-800">{asset.brand || '-'}</div></div>
                  <div><div className="text-sm text-gray-500 font-semibold mb-1">Serial Number (S/N)</div><div className="text-gray-800 font-mono">{asset.serial_number || '-'}</div></div>
                  <div><div className="text-sm text-gray-500 font-semibold mb-1">จำนวน</div><div className="text-gray-800">{asset.quantity} {asset.unit}</div></div>
                </div>
              </div>
            </div>

            {/* กล่อง 2: การได้มาและการรับประกัน */}
            <div className="card bg-white shadow-sm border border-gray-100">
              <div className="card-body p-6">
                <h2 className="text-xl font-bold text-secondary border-b pb-2 mb-4 flex items-center gap-2">📄 การได้มาและมูลค่า</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  <div><div className="text-sm text-gray-500 font-semibold mb-1">วันที่ได้มา</div><div className="text-gray-800 font-medium">{formatThaiDate(asset.acquired_date)}</div></div>
                  <div><div className="text-sm text-gray-500 font-semibold mb-1">วิธีการที่ได้มา</div><div className="text-gray-800">{asset.acquired_method || '-'}</div></div>
                  <div><div className="text-sm text-gray-500 font-semibold mb-1">ประเภทเงิน</div><div className="text-gray-800">{asset.funding_type || '-'}</div></div>
                  <div><div className="text-sm text-gray-500 font-semibold mb-1">ราคาต่อหน่วย</div><div className="text-green-600 font-bold text-lg">฿{Number(asset.price || 0).toLocaleString('th-TH', {minimumFractionDigits: 2})}</div></div>
                  <div>
                    <div className="text-sm text-gray-500 font-semibold mb-1">เลขที่ใบตรวจรับ / PO / GFMIS</div>
                    <div className="text-gray-800 text-sm">DOC: {asset.document_no || '-'}<br/>PO: {asset.po_number || '-'}<br/>GFMIS: {asset.gfmis || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 font-semibold mb-1">การรับประกัน</div>
                    <div className="text-gray-800">อายุการใช้งาน: <span className="font-bold text-primary">{asset.lifespan_years}</span> ปี<br/>สิ้นสุดประกัน: <span className="font-bold text-error">{formatThaiDate(asset.warranty_end)}</span></div>
                  </div>
                </div>

                {/* 💡 แผงแสดงค่าเสื่อมราคา */}
                {depData && (
                  <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-800 font-bold mb-3 flex items-center gap-2">
                      📉 สรุปมูลค่าทางบัญชี (ค่าเสื่อมราคาแบบเส้นตรง)
                      {depData.isExpired && <span className="badge badge-error badge-sm text-white">หมดอายุการใช้งาน</span>}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="text-xs text-gray-500 font-semibold mb-1">ค่าเสื่อมราคาต่อปี</div>
                        <div className="text-gray-700 font-medium">฿{depData.depPerYear.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                        <div className="text-xs text-red-600 font-semibold mb-1">ค่าเสื่อมราคาสะสมถึงปัจจุบัน</div>
                        <div className="text-red-700 font-bold">฿{depData.accumulated.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200 shadow-sm">
                        <div className="text-xs text-green-700 font-bold mb-1">มูลค่าสุทธิคงเหลือ (Net Book Value)</div>
                        <div className="text-green-700 font-black text-xl">฿{depData.netBookValue.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      </div>
                    </div>
                  </div>
                )}
                {/* สิ้นสุดแผงแสดงค่าเสื่อมราคา */}

              </div>
            </div>

            {/* กล่อง 3: สถานที่ตั้งและผู้ขาย */}
            <div className="card bg-white shadow-sm border border-gray-100">
              <div className="card-body p-6">
                <h2 className="text-xl font-bold text-info border-b pb-2 mb-4 flex items-center gap-2">🏢 สถานที่ตั้ง และ ผู้ขาย</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <div className="text-sm text-blue-800 font-bold mb-2 flex items-center gap-1">📍 สถานที่ตั้ง</div>
                    <div className="text-gray-700 text-sm space-y-1">
                      <p><span className="font-semibold text-gray-500 w-16 inline-block">อาคาร:</span> {asset.building || '-'}</p>
                      <p><span className="font-semibold text-gray-500 w-16 inline-block">ชั้น:</span> {asset.floor || '-'}</p>
                      <p><span className="font-semibold text-gray-500 w-16 inline-block">แผนก:</span> <span className="font-bold">{asset.department || '-'}</span></p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="text-sm text-gray-800 font-bold mb-2 flex items-center gap-1">🤝 ผู้ขาย/ผู้บริจาค</div>
                    <div className="text-gray-700 text-sm space-y-1">
                      <p><span className="font-bold">{asset.vendor || '-'}</span></p>
                      <p><span className="font-semibold text-gray-500">โทร:</span> {asset.vendor_phone || '-'}</p>
                      <p className="truncate" title={asset.vendor_address}><span className="font-semibold text-gray-500">ที่อยู่:</span> {asset.vendor_address || '-'}</p>
                    </div>
                  </div>
                </div>
                
                {asset.remarks && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-500 font-semibold mb-1">หมายเหตุเพิ่มเติม</div>
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-gray-700 whitespace-pre-wrap">
                      {asset.remarks}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}