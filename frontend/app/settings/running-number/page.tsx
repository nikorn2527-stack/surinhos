'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RunningNumberSettings() {
  const router = useRouter();
  const [prefix, setPrefix] = useState('');
  const [digitLength, setDigitLength] = useState(7);
  const [lastNumber, setLastNumber] = useState(0);
  const [resetNumber, setResetNumber] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // --- อัปเดตให้ค้นหาจากทั้ง localStorage และ sessionStorage ---
    const permsString = localStorage.getItem('permissions') || sessionStorage.getItem('permissions') || '[]';
    const userPerms = JSON.parse(permsString);
    
    if (!userPerms.includes('manage_roles')) {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      router.push('/');
      return;
    }

    fetch('http://192.168.1.120:5000/api/settings/running-number')
      .then((res) => res.json())
      .then((data) => {
        setPrefix(data.asset_prefix || 'SR-');
        setDigitLength(Number(data.asset_digit_length) || 7);
        setLastNumber(Number(data.asset_last_number) || 0);
        setIsLoading(false);
      });
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirm('ยืนยันการบันทึกการตั้งค่ารูปแบบเลขที่?')) {
      try {
        const res = await fetch('http://192.168.1.120:5000/api/settings/running-number', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prefix, digit_length: digitLength, reset_number: resetNumber })
        });
        if (res.ok) {
          alert('บันทึกสำเร็จ');
          window.location.reload();
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการบันทึก');
      }
    }
  };

  if (isLoading) return <div className="text-center mt-20"><span className="loading loading-spinner text-primary"></span></div>;

  const nextNumber = resetNumber ? 1 : lastNumber + 1;
  const exampleCode = `${prefix}${String(nextNumber).padStart(digitLength, '0')}`;

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">ตั้งค่าเลขที่ทั้งหมด (Running Number)</h1>
            <p className="text-gray-500">กำหนดรูปแบบรหัสครุภัณฑ์อัตโนมัติ</p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="form-control">
                  <label className="label"><span className="label-text font-bold">อักษรนำหน้า (Prefix)</span></label>
                  <input 
                    type="text" 
                    className="input input-bordered w-full" 
                    value={prefix} 
                    onChange={(e) => setPrefix(e.target.value)} 
                    placeholder="เช่น SR- หรือ IT-" 
                  />
                  <label className="label"><span className="label-text-alt text-gray-400">รองรับทั้งภาษาไทยและอังกฤษ</span></label>
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text font-bold">จำนวนหลักของตัวเลข</span></label>
                  <input 
                    type="number" 
                    min="3" max="10"
                    className="input input-bordered w-full" 
                    value={digitLength} 
                    onChange={(e) => setDigitLength(Number(e.target.value))} 
                  />
                   <label className="label"><span className="label-text-alt text-gray-400">แนะนำ 5 - 7 หลัก</span></label>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col items-center justify-center">
                <p className="text-sm text-blue-600 font-semibold mb-2">ตัวอย่างหมายเลขครุภัณฑ์ถัดไปที่จะได้</p>
                <div className="text-3xl font-mono font-bold text-blue-900 bg-white px-6 py-2 rounded-lg shadow-sm border border-blue-200">
                  {exampleCode}
                </div>
              </div>

              <div className="form-control mt-4">
                <label className="label cursor-pointer justify-start gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
                  <input 
                    type="checkbox" 
                    className="checkbox checkbox-error" 
                    checked={resetNumber}
                    onChange={(e) => setResetNumber(e.target.checked)}
                  />
                  <div>
                    <span className="label-text font-bold text-red-700 block">รีเซ็ตหมายเลขรันใหม่ (เริ่มนับ 1 ใหม่)</span>
                    <span className="text-xs text-red-500">หมายเหตุ: ใช้เฉพาะเมื่อขึ้นปีงบประมาณใหม่ หรือต้องการล้างระบบ</span>
                  </div>
                </label>
              </div>

              <div className="card-actions justify-end pt-4 border-t">
                <button type="submit" className="btn btn-primary text-white px-8">💾 บันทึกการตั้งค่า</button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}