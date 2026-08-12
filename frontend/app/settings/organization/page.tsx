'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function OrganizationSettings() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. ตัวแปรเก็บข้อมูลหน่วยงาน
  const [formData, setFormData] = useState({
    logo: '',
    prefix: 'บริษัท',
    orgName: '',
    address: '',
    subdistrict: '',
    district: '',
    province: '',
    zipcode: '',
    phone: '',
    extension: '',
    email: '',
    taxId: ''
  });

  // 💡 2. เปลี่ยนมาดึงข้อมูลเก่าจาก Database (API) เมื่อโหลดหน้าเว็บ
  useEffect(() => {
    fetch('http://192.168.1.120:5000/api/settings/organization')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setFormData(data);
          // อัปเดต LocalStorage ไว้ด้วยเผื่อหน้าอื่นดึงไปใช้ไวๆ
          localStorage.setItem('orgSettings', JSON.stringify(data));
        } else {
          // ถ้ายังไม่มีข้อมูลใน DB ให้ตั้งค่าเบอร์โทรศัพท์เริ่มต้น
          setFormData(prev => ({ ...prev, phone: '042 222 456' }));
        }
      })
      .catch(err => console.error("Error fetching org settings:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 3. ฟังก์ชันแปลงไฟล์รูปภาพโลโก้ให้เป็น Base64
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ตรวจสอบขนาดไฟล์ไม่ให้เกิน 2MB 
      if (file.size > 2 * 1024 * 1024) {
        alert('ขนาดไฟล์โลโก้ใหญ่เกินไป กรุณาใช้ไฟล์ขนาดไม่เกิน 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 💡 4. เปลี่ยนมาบันทึกข้อมูลลง Database ผ่าน API
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const res = await fetch('http://192.168.1.120:5000/api/settings/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // เซฟลง LocalStorage สำรองไว้ด้วย เพื่อให้หน้า Dashboard ดึงไปแสดงผลได้ทันที
        localStorage.setItem('orgSettings', JSON.stringify(formData)); 
        
        alert('✅ ' + data.message);
        router.push('/');
      } else {
        alert('❌ ' + data.error);
      }
    } catch (error) {
      alert('❌ ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex justify-center items-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* หัวกระดาษ */}
        <div className="flex items-center gap-5 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">ตั้งค่าหน่วยงาน</h1>
            <p className="text-gray-500 mt-1 text-sm">จัดการชื่อ ที่อยู่ โลโก้ และข้อมูลการติดต่อสำหรับออกเอกสาร</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* ================= ส่วนที่ 1: ข้อมูลองค์กรเบื้องต้น ================= */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
              <span className="text-2xl">🏢</span> ข้อมูลองค์กรเบื้องต้น
            </h3>
            
            {/* โซนอัปโหลดโลโก้ */}
            <div className="flex flex-col md:flex-row gap-8 mb-8 items-start">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-indigo-400 transition-all overflow-hidden shrink-0 group relative bg-gray-50/50"
              >
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/jpg" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleLogoUpload} 
                />
                {formData.logo ? (
                  <>
                    <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                    <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white font-semibold text-sm">
                      เปลี่ยนโลโก้
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <span className="text-4xl">🖼️</span>
                    <p className="text-xs text-gray-500 font-semibold mt-2">อัปโหลดโลโก้</p>
                    <p className="text-[10px] text-gray-400">(ปรับเป็น 512x512 อัตโนมัติ)</p>
                  </div>
                )}
              </div>
              <div className="flex-1 mt-2">
                <h4 className="font-bold text-gray-800 text-lg">โลโก้หน่วยงาน</h4>
                <p className="text-gray-500 text-sm mt-1">โลโก้นี้จะถูกนำไปใช้บนสติ๊กเกอร์และรายงานต่างๆ</p>
                <p className="text-gray-500 text-sm">รองรับไฟล์ .PNG, .JPG</p>
                {formData.logo && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); setFormData(prev => ({...prev, logo: ''}))}} className="btn btn-xs btn-error text-white mt-3">
                    ลบรูปภาพ
                  </button>
                )}
              </div>
            </div>

            {/* ข้อมูลชื่อ */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="form-control col-span-1">
                <label className="label font-semibold text-gray-700 pb-1">คำนำหน้า</label>
                <select name="prefix" value={formData.prefix} onChange={handleChange} className="select select-bordered bg-gray-50 hover:bg-white focus:bg-white w-full border-gray-200">
                  <option value="บริษัท">บริษัท</option>
                  <option value="ห้างหุ้นส่วนจำกัด">ห้างหุ้นส่วนจำกัด</option>
                  <option value="สำนักงาน">สำนักงาน</option>
                  <option value="กระทรวง">กระทรวง</option>
                  <option value="กรม">กรม</option>
                  <option value="อื่นๆ">อื่นๆ (ไม่ระบุ)</option>
                </select>
              </div>
              <div className="form-control col-span-1 md:col-span-3">
                <label className="label font-semibold text-gray-700 pb-1">ชื่อหน่วยงาน</label>
                <input type="text" name="orgName" value={formData.orgName} onChange={handleChange} placeholder="เช่น Pacific Plus IT" className="input input-bordered bg-gray-50 hover:bg-white focus:bg-white w-full border-gray-200" required />
              </div>
            </div>

            {/* ข้อมูลที่อยู่ */}
            <div className="form-control mb-6">
              <label className="label font-semibold text-gray-700 pb-1">ที่อยู่จดทะเบียน / สถานที่ตั้ง</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="ระบุ บ้านเลขที่, หมู่, ซอย, ถนน..." className="input input-bordered bg-gray-50 hover:bg-white focus:bg-white w-full border-gray-200" />
            </div>

            {/* ตำบล อำเภอ จังหวัด รหัสไปรษณีย์ */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="form-control">
                <label className="label font-semibold text-gray-700 pb-1">ตำบล / แขวง</label>
                <input type="text" name="subdistrict" value={formData.subdistrict} onChange={handleChange} placeholder="ตำบล" className="input input-bordered bg-gray-50 hover:bg-white focus:bg-white w-full border-gray-200" />
              </div>
              <div className="form-control">
                <label className="label font-semibold text-gray-700 pb-1">อำเภอ / เขต</label>
                <input type="text" name="district" value={formData.district} onChange={handleChange} placeholder="อำเภอ" className="input input-bordered bg-gray-50 hover:bg-white focus:bg-white w-full border-gray-200" />
              </div>
              <div className="form-control">
                <label className="label font-semibold text-gray-700 pb-1">จังหวัด</label>
                <input type="text" name="province" value={formData.province} onChange={handleChange} placeholder="จังหวัด" className="input input-bordered bg-gray-50 hover:bg-white focus:bg-white w-full border-gray-200" />
              </div>
              <div className="form-control">
                <label className="label font-semibold text-gray-700 pb-1">รหัสไปรษณีย์</label>
                <input type="text" name="zipcode" value={formData.zipcode} onChange={handleChange} placeholder="เช่น 10000" className="input input-bordered bg-gray-50 hover:bg-white focus:bg-white w-full border-gray-200" />
              </div>
            </div>
          </div>

          {/* ================= ส่วนที่ 2: ข้อมูลการติดต่อ ================= */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
              <span className="text-2xl">📞</span> ข้อมูลการติดต่อ และภาษี
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="form-control">
                <label className="label font-semibold text-gray-700 pb-1">เบอร์โทรศัพท์ติดต่อ</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="เช่น 02-123-4567" className="input input-bordered bg-gray-50 hover:bg-white focus:bg-white w-full border-gray-200" />
              </div>
              <div className="form-control">
                <label className="label font-semibold text-gray-700 pb-1">เบอร์ต่อภายใน (ถ้ามี)</label>
                <input type="text" name="extension" value={formData.extension} onChange={handleChange} placeholder="เช่น 101" className="input input-bordered bg-gray-50 hover:bg-white focus:bg-white w-full border-gray-200" />
              </div>
              <div className="form-control">
                <label className="label font-semibold text-gray-700 pb-1">อีเมล (Email)</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="contact@company.com" className="input input-bordered bg-gray-50 hover:bg-white focus:bg-white w-full border-gray-200" />
              </div>
            </div>
            
            <div className="form-control mt-6 max-w-md">
              <label className="label font-semibold text-gray-700 pb-1">เลขประจำตัวผู้เสียภาษี (13 หลัก)</label>
              <input 
                type="text" 
                name="taxId" 
                value={formData.taxId || ''} 
                onChange={handleChange} 
                maxLength={13}
                placeholder="เช่น 0123456789123" 
                className="input input-bordered bg-gray-50 hover:bg-white focus:bg-white w-full tracking-widest font-mono border-gray-200 text-lg" 
              />
            </div>
          </div>

          {/* แถบปุ่มบันทึก */}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={() => router.push('/')} className="btn btn-ghost text-gray-500 font-semibold px-6 hover:bg-gray-200">
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary px-10 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all" disabled={isSaving}>
              {isSaving ? <span className="loading loading-spinner"></span> : '💾 บันทึกการตั้งค่า'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}