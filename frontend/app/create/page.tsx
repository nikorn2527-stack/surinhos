'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function CreateAsset() {
  const router = useRouter();
  const { token } = useAuth();
  
  const [assetCode, setAssetCode] = useState('กำลังสร้างรหัส...'); 
  
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [subCategories, setSubCategories] = useState<{id: string, name: string}[]>([]);
  
  const [mainCat, setMainCat] = useState('');
  const [subCat, setSubCat] = useState('');
  const [sequence, setSequence] = useState(''); 
  const [fiscalYear, setFiscalYear] = useState(''); 
  const [assetNumber2, setAssetNumber2] = useState('');
  
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('เครื่อง');
  const [remarks, setRemarks] = useState('');
  
  const [acquiredDate, setAcquiredDate] = useState('');
  const [acquiredMethod, setAcquiredMethod] = useState('ตกลงราคา');
  const [fundingType, setFundingType] = useState('เงินงบประมาณ');
  const [documentNo, setDocumentNo] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [gfmis, setGfmis] = useState('');
  const [price, setPrice] = useState('');
  const [lifespanYears, setLifespanYears] = useState('5');
  const [warrantyEnd, setWarrantyEnd] = useState('');
  
  const [vendor, setVendor] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  
  // สถานที่ตั้ง
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('ใช้งานปกติ');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ================= State สำหรับ รูปภาพ =================
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ================= State สำหรับ Vendors =================
  const [vendorList, setVendorList] = useState<any[]>([]);
  const [selectedVendorOption, setSelectedVendorOption] = useState('');
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editVendorId, setEditVendorId] = useState<number | null>(null);
  const [modalVName, setModalVName] = useState('');
  const [modalVAddress, setModalVAddress] = useState('');
  const [modalVPhone, setModalVPhone] = useState('');

  // ================= State สำหรับ Locations =================
  const [locationList, setLocationList] = useState<any[]>([]);
  const [selectedLocationOption, setSelectedLocationOption] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editLocationId, setEditLocationId] = useState<number | null>(null);
  const [modalBuilding, setModalBuilding] = useState('');
  const [modalFloor, setModalFloor] = useState('');
  const [modalDepartment, setModalDepartment] = useState('');

  const formatThaiDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const fetchVendors = async () => {
    try {
      const res = await fetch('http://192.168.1.120:5000/api/vendors');
      const data = await res.json();
      if (Array.isArray(data)) {
        setVendorList(data);
      } else {
        setVendorList([]);
      }
    } catch (err) {
      setVendorList([]);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await fetch('http://192.168.1.120:5000/api/locations');
      const data = await res.json();
      if (Array.isArray(data)) {
        setLocationList(data);
      } else {
        setLocationList([]);
      }
    } catch (err) {
      setLocationList([]);
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchLocations();
    const fetchCategories = async () => {
      try {
        const res = await fetch('http://192.168.1.120:5000/api/categories');
        const data = await res.json();
        if (Array.isArray(data)) {
          setCategories(data);
          if (data.length > 0) setMainCat(data[0].id);
        }
      } catch (err) {}
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!mainCat) return;
    const fetchSubCategories = async () => {
      try {
        const res = await fetch(`http://192.168.1.120:5000/api/subcategories/${mainCat}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setSubCategories(data);
          if (data.length > 0) {
            setSubCat(data[0].id);
          } else {
            setSubCat('');
          }
        }
      } catch (err) {}
    };
    fetchSubCategories();
  }, [mainCat]);

  useEffect(() => {
    if (!mainCat || !subCat) return;
    const fetchNextCategoryCode = async () => {
      try {
        const prefix = `${mainCat}-${subCat}`;
        const res = await fetch(`http://192.168.1.120:5000/api/assets/next-category-code?prefix=${prefix}`);
        const data = await res.json();
        
        if (data.runningNum) {
          const parts = data.runningNum.split('/');
          if (parts.length === 2) {
            setSequence(parts[0]);
            setFiscalYear(parts[1]);
          } else {
            setSequence(data.runningNum);
          }
        }
      } catch (error) {}
    };
    fetchNextCategoryCode();
  }, [mainCat, subCat]);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    setAcquiredDate(today);

    fetch('http://192.168.1.120:5000/api/assets/next-code')
      .then(res => res.json())
      .then(data => {
        if(data.next_code) setAssetCode(data.next_code); 
      })
      .catch(() => setAssetCode('ไม่สามารถดึงรหัสได้'));
  }, [router, token]);

// ================= ฟังก์ชันจัดการและบีบอัดรูปภาพ (ลดขนาดไฟล์) =================
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      alert('สามารถแนบรูปภาพได้สูงสุด 5 รูปเท่านั้น');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          // สร้าง Canvas เพื่อย่อขนาดรูป
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // กำหนดขนาดสูงสุดที่ 1024px (ขนาดมาตรฐานกำลังดี)
          const MAX_SIZE = 1024;
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // แปลงรูปกลับเป็น Base64 แบบ JPEG พร้อมลดคุณภาพเหลือ 70% (ช่วยลดไฟล์จาก 5MB เหลือไม่ถึง 200KB)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          
          setImages(prev => [...prev, compressedBase64]);
        };
      };
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ================= จัดการ Dropdown ผู้ขาย/สถานที่ =================
  const handleVendorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedVendorOption(val);
    if (val !== 'อื่นๆ') {
      setVendor(val);
      const found = vendorList.find(v => v.name === val);
      if (found) {
        setVendorAddress(found.address || '');
        setVendorPhone(found.phone || '');
      } else {
        setVendorAddress(''); setVendorPhone('');
      }
    } else {
      setVendor(''); setVendorAddress(''); setVendorPhone('');
    }
  };

  const handleLocationSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedLocationOption(val);
    if (val && val !== 'อื่นๆ') {
      const found = locationList.find(l => l.id.toString() === val);
      if (found) {
        setBuilding(found.building || '');
        setFloor(found.floor || '');
        setDepartment(found.department || '');
      }
    } else {
      setBuilding(''); setFloor(''); setDepartment('');
    }
  };

  // ================= ฟังก์ชันบันทึก Modal =================
  const saveVendor = async () => {
    if (!modalVName) return alert('กรุณากรอกชื่อผู้ขาย');
    const method = editVendorId ? 'PUT' : 'POST';
    const url = editVendorId ? `http://192.168.1.120:5000/api/vendors/${editVendorId}` : 'http://192.168.1.120:5000/api/vendors';
    await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modalVName, address: modalVAddress, phone: modalVPhone })
    });
    setShowVendorModal(false);
    fetchVendors();
  };

  const deleteVendor = async (id: number) => {
    if (confirm('ยืนยันการลบข้อมูลผู้ขายรายนี้?')) {
      await fetch(`http://192.168.1.120:5000/api/vendors/${id}`, { method: 'DELETE' });
      fetchVendors();
    }
  };

  const openVendorModal = (vendorToEdit: any = null) => {
    if (vendorToEdit) {
      setEditVendorId(vendorToEdit.id);
      setModalVName(vendorToEdit.name);
      setModalVAddress(vendorToEdit.address || '');
      setModalVPhone(vendorToEdit.phone || '');
    } else {
      setEditVendorId(null); setModalVName(''); setModalVAddress(''); setModalVPhone('');
    }
    setShowVendorModal(true);
  };

  const saveLocation = async () => {
    if (!modalDepartment) return alert('กรุณากรอกข้อมูลแผนก/หน่วยงาน');
    const method = editLocationId ? 'PUT' : 'POST';
    const url = editLocationId ? `http://192.168.1.120:5000/api/locations/${editLocationId}` : 'http://192.168.1.120:5000/api/locations';
    await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ building: modalBuilding, floor: modalFloor, department: modalDepartment })
    });
    setShowLocationModal(false);
    fetchLocations();
  };

  const deleteLocation = async (id: number) => {
    if (confirm('ยืนยันการลบข้อมูลสถานที่ตั้งนี้?')) {
      await fetch(`http://192.168.1.120:5000/api/locations/${id}`, { method: 'DELETE' });
      fetchLocations();
    }
  };

  const openLocationModal = (locationToEdit: any = null) => {
    if (locationToEdit) {
      setEditLocationId(locationToEdit.id);
      setModalBuilding(locationToEdit.building || '');
      setModalFloor(locationToEdit.floor || '');
      setModalDepartment(locationToEdit.department || '');
    } else {
      setEditLocationId(null); setModalBuilding(''); setModalFloor(''); setModalDepartment('');
    }
    setShowLocationModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const finalAssetNumber1 = `${mainCat}-${subCat}${sequence ? `-${sequence}` : ''}${fiscalYear ? `/${fiscalYear}` : ''}`;
    const selectedCatObj = categories.find(c => c.id === mainCat);
    const fullCategoryName = selectedCatObj ? `${mainCat} - ${selectedCatObj.name}` : mainCat;

    try {
      const checkRes = await fetch(`http://192.168.1.120:5000/api/assets/check-duplicate?asset_number_1=${encodeURIComponent(finalAssetNumber1)}`);
      const checkData = await checkRes.json();
      
      if (checkData.isDuplicate) {
        alert(`⚠️ ไม่อนุญาตให้บันทึก: \n\nหมายเลขครุภัณฑ์ "${finalAssetNumber1}" \nถูกใช้งานไปแล้วในระบบ กรุณาตรวจสอบเลขลำดับใหม่ครับ!`);
        setIsSubmitting(false); return; 
      }

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const res = await fetch('http://192.168.1.120:5000/api/assets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          asset_code: assetCode, asset_number_1: finalAssetNumber1, asset_number_2: assetNumber2,
          name: name, brand: brand, serial_number: serialNumber, category: fullCategoryName, 
          quantity: Number(quantity) || 1, unit: unit, remarks: remarks,
          acquired_date: acquiredDate, acquired_method: acquiredMethod, funding_type: fundingType,
          document_no: documentNo, po_number: poNumber, gfmis: gfmis, price: Number(price) || 0,
          lifespan_years: Number(lifespanYears) || 5, warranty_end: warrantyEnd,
          vendor: vendor, vendor_address: vendorAddress, vendor_phone: vendorPhone,
          building: building, floor: floor, department: department, status: status,
          images: images // 💡 ส่งข้อมูลรูปภาพไปด้วย
        })
      });

      if (res.ok) {
        alert('ขึ้นทะเบียนครุภัณฑ์ (สพ.4) เรียบร้อยแล้ว!');
        router.push('/'); 
      } else {
        const errorData = await res.json();
        alert(`เกิดข้อผิดพลาด: ${errorData.error}`);
      }
    } catch (err) {
      alert('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-base-200 py-8 px-4 flex justify-center relative">
      <div className="card w-full bg-base-100 shadow-xl">
        <div className="card-body">
          
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-primary">ทะเบียนประวัติครุภัณฑ์ (สพ.4)</h2>
              <p className="text-sm text-gray-500">บันทึกรายละเอียดครุภัณฑ์ตามระเบียบพัสดุภาครัฐ</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* SECTION 1 */}
            <section className="bg-base-200/50 p-6 rounded-2xl border border-base-200">
              <h3 className="font-bold text-lg text-primary mb-4 flex items-center gap-2">📦 1. รหัสและรายละเอียดครุภัณฑ์</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">หมายเลขควบคุม (Auto Run) <span className="text-error">*</span></span></label>
                  <input type="text" required className="input input-bordered w-full bg-base-200 text-primary font-bold tracking-wider" value={assetCode} readOnly />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">สถานะการใช้งาน <span className="text-error">*</span></span></label>
                  <select 
                    className={`select select-bordered w-full font-semibold ${status === 'ใช้งานปกติ' ? 'text-success' : (status === 'แทงจำหน่ายแล้ว' ? 'text-error' : 'text-warning')}`}
                    value={status} onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="ใช้งานปกติ">ใช้งานปกติ</option>
                    <option value="ชำรุดรอซ่อม">ชำรุดรอซ่อม</option>
                    <option value="เสื่อมสภาพ/รอจำหน่าย">เสื่อมสภาพ/รอจำหน่าย</option>
                    <option value="แทงจำหน่ายแล้ว">แทงจำหน่ายแล้ว</option>
                  </select>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-secondary shadow-sm mt-4">
                <label className="label pt-0"><span className="label-text font-bold text-secondary text-base">สร้างหมายเลขครุภัณฑ์ 1 <span className="text-error">*</span></span></label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control md:col-span-2">
                    <label className="label"><span className="label-text text-xs text-gray-500">1. ประเภทหลัก</span></label>
                    <select className="select select-bordered w-full font-semibold text-sm" value={mainCat} onChange={(e) => setMainCat(e.target.value)}>
                      {Array.isArray(categories) && categories.map(cat => ( <option key={cat.id} value={cat.id}>{cat.id} - {cat.name}</option> ))}
                    </select>
                  </div>
                  <div className="form-control md:col-span-2">
                    <label className="label"><span className="label-text text-xs text-gray-500">2. ชนิดครุภัณฑ์</span></label>
                    <select className="select select-bordered w-full font-semibold text-sm" value={subCat} onChange={(e) => setSubCat(e.target.value)} disabled={!Array.isArray(subCategories) || subCategories.length === 0}>
                      {Array.isArray(subCategories) && subCategories.map(sub => ( <option key={sub.id} value={sub.id}>{sub.id} - {sub.name}</option> ))}
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text text-xs text-gray-500">3. ลำดับ (Auto)</span></label>
                    <input type="text" required className="input input-bordered w-full font-semibold text-primary border-primary/50 text-center tracking-widest" value={sequence} onChange={(e) => setSequence(e.target.value)} />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text text-xs text-gray-500">4. ปีงบประมาณ</span></label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">/</span>
                      <input type="text" required className="input input-bordered w-full pl-8 font-semibold text-primary border-primary/50 text-center tracking-widest" value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-control md:col-span-2 mt-2 pt-4 border-t border-gray-100">
                    <label className="label"><span className="label-text text-sm font-semibold text-gray-700">หมายเลขครุภัณฑ์ 2 (เลขครุภัณฑ์เดิม)</span></label>
                    <input type="text" placeholder="ใส่รหัสเก่า (ถ้ามี)" className="input input-bordered w-full text-gray-500 bg-gray-50" value={assetNumber2} onChange={(e) => setAssetNumber2(e.target.value)} />
                  </div>
                </div>
                <div className="mt-6 p-3 bg-secondary/10 rounded-lg flex items-center justify-between border border-secondary/20">
                  <span className="text-sm font-semibold text-secondary">ผลลัพธ์หมายเลขครุภัณฑ์:</span>
                  <span className="text-lg font-bold text-primary tracking-wider">{mainCat}-{subCat}-{sequence || 'XXXX'}/{fiscalYear || 'XX'}</span>
                </div>
              </div>

              <div className="form-control mt-4">
                <label className="label"><span className="label-text font-semibold">รายการ (ชื่ออุปกรณ์) <span className="text-error">*</span></span></label>
                <input type="text" required className="input input-bordered w-full" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">ยี่ห้อ / รุ่น / ขนาด / ลักษณะ</span></label>
                  <input type="text" className="input input-bordered w-full" value={brand} onChange={(e) => setBrand(e.target.value)} />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">หมายเลขเครื่อง (S/N)</span></label>
                  <input type="text" className="input input-bordered w-full" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">จำนวน <span className="text-error">*</span></span></label>
                  <input type="number" min="1" required className="input input-bordered w-full" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">หน่วยนับ <span className="text-error">*</span></span></label>
                  <input type="text" required className="input input-bordered w-full" value={unit} onChange={(e) => setUnit(e.target.value)} />
                </div>
              </div>
              <div className="form-control mt-4">
                <label className="label"><span className="label-text font-semibold">หมายเหตุ</span></label>
                <textarea className="textarea textarea-bordered h-20 w-full" value={remarks} onChange={(e) => setRemarks(e.target.value)}></textarea>
              </div>
            </section>

            {/* SECTION 2 */}
            <section className="bg-base-200/50 p-6 rounded-2xl border border-base-200">
              <h3 className="font-bold text-lg text-primary mb-4 flex items-center gap-2">📄 2. ข้อมูลการได้มาและการประเมิน</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">วันที่ได้มา (ตรวจรับ) <span className="text-error">*</span></span>
                    <span className="label-text-alt text-primary font-bold">{formatThaiDate(acquiredDate)}</span>
                  </label>
                  <input type="date" required className="input input-bordered w-full" value={acquiredDate} onChange={(e) => setAcquiredDate(e.target.value)} />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">วิธีการที่ได้มา <span className="text-error">*</span></span></label>
                  <select className="select select-bordered w-full" value={acquiredMethod} onChange={(e) => setAcquiredMethod(e.target.value)}>
                    <option value="ตกลงราคา">ตกลงราคา</option>
                    <option value="สอบราคา">สอบราคา</option>
                    <option value="ประกวดราคา (e-Bidding)">ประกวดราคา (e-Bidding)</option>
                    <option value="วิธีพิเศษ">วิธีพิเศษ</option>
                    <option value="รับบริจาค">รับบริจาค</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">ประเภทเงิน</span></label>
                  <select className="select select-bordered w-full" value={fundingType} onChange={(e) => setFundingType(e.target.value)}>
                    <option value="เงินงบประมาณ">เงินงบประมาณ</option>
                    <option value="เงินบำรุง">เงินบำรุง</option>
                    <option value="เงินบริจาค">เงินบริจาค</option>
                    <option value="เงินรายได้สถานศึกษา">เงินรายได้สถานศึกษา</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">ที่เอกสาร (ใบตรวจรับ)</span></label>
                  <input type="text" className="input input-bordered w-full" value={documentNo} onChange={(e) => setDocumentNo(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">เลขที่ใบสั่งซื้อ (PO)</span></label>
                  <input type="text" className="input input-bordered w-full" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">เลขที่ GFMIS</span></label>
                  <input type="text" className="input input-bordered w-full" value={gfmis} onChange={(e) => setGfmis(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">ราคาต่อหน่วย (บาท) <span className="text-error">*</span></span></label>
                  <input type="number" required min="0" step="0.01" className="input input-bordered w-full text-right" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">อายุการใช้งาน (ปี) <span className="text-error">*</span></span></label>
                  <input type="number" required min="1" max="50" className="input input-bordered w-full text-center" value={lifespanYears} onChange={(e) => setLifespanYears(e.target.value)} />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">สิ้นสุดประกัน</span>
                    <span className="label-text-alt text-primary font-bold">{formatThaiDate(warrantyEnd)}</span>
                  </label>
                  <input type="date" className="input input-bordered w-full" value={warrantyEnd} onChange={(e) => setWarrantyEnd(e.target.value)} />
                </div>
              </div>
            </section>

            {/* SECTION 3 */}
            <section className="bg-base-200/50 p-6 rounded-2xl border border-base-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-primary flex items-center gap-2">🏢 3. ข้อมูลผู้ขาย สถานที่ และการใช้งาน</h3>
                <button type="button" onClick={() => openVendorModal()} className="btn btn-sm btn-outline btn-primary bg-white">+ จัดการรายชื่อผู้ขาย</button>
              </div>
              
              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">ชื่อผู้ขาย / ผู้รับจ้าง / ผู้บริจาค</span></label>
                <select className="select select-bordered w-full" value={selectedVendorOption} onChange={handleVendorSelect}>
                  <option value="">-- เลือกบริษัท / ร้านค้า --</option>
                  {Array.isArray(vendorList) && vendorList.map(v => ( <option key={v.id} value={v.name}>{v.name}</option> ))}
                  <option value="อื่นๆ">อื่นๆ (พิมพ์เองด้านล่าง)</option>
                </select>
                {selectedVendorOption === 'อื่นๆ' && (
                  <input type="text" placeholder="ระบุชื่อผู้ขายด้วยตนเอง" className="input input-bordered w-full mt-2" value={vendor} onChange={(e) => setVendor(e.target.value)} />
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="form-control md:col-span-2">
                  <label className="label"><span className="label-text font-semibold">ที่อยู่ผู้ขาย</span></label>
                  <input type="text" className="input input-bordered w-full" value={vendorAddress} onChange={(e) => setVendorAddress(e.target.value)} />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">เบอร์โทรศัพท์</span></label>
                  <input type="text" className="input input-bordered w-full" value={vendorPhone} onChange={(e) => setVendorPhone(e.target.value)} />
                </div>
              </div>

              {/* ส่วนจัดการสถานที่ตั้ง */}
              <div className="flex justify-between items-center mt-8 border-t pt-6 mb-4">
                <h3 className="font-bold text-lg text-secondary flex items-center gap-2">📍 ข้อมูลสถานที่ตั้ง</h3>
                <button type="button" onClick={() => openLocationModal()} className="btn btn-sm btn-outline btn-secondary bg-white">+ จัดการสถานที่ตั้ง</button>
              </div>

              <div className="form-control mb-4">
                <label className="label"><span className="label-text font-semibold text-gray-500">เลือกสถานที่จากฐานข้อมูล (Auto-fill)</span></label>
                <select className="select select-bordered w-full text-secondary font-semibold" value={selectedLocationOption} onChange={handleLocationSelect}>
                  <option value="">-- เลือกสถานที่ตั้ง --</option>
                  {Array.isArray(locationList) && locationList.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.building || 'ไม่ระบุอาคาร'} - {loc.floor ? `ชั้น ${loc.floor}` : 'ไม่ระบุชั้น'} - {loc.department || 'ไม่ระบุแผนก'}
                    </option>
                  ))}
                  <option value="อื่นๆ">พิมพ์ข้อมูลสถานที่ตั้งเอง (กำหนดเองด้านล่าง)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">อาคาร/ตึก</span></label>
                  <input type="text" className="input input-bordered w-full" value={building} onChange={(e) => setBuilding(e.target.value)} />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">ชั้นที่</span></label>
                  <input type="text" className="input input-bordered w-full" value={floor} onChange={(e) => setFloor(e.target.value)} />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">แผนก/หน่วยงาน</span></label>
                  <input type="text" className="input input-bordered w-full" value={department} onChange={(e) => setDepartment(e.target.value)} />
                </div>
              </div>
            </section>

            {/* 💡 SECTION 4: รูปภาพครุภัณฑ์ */}
            <section className="bg-base-200/50 p-6 rounded-2xl border border-base-200">
              <h3 className="font-bold text-lg text-primary mb-4 flex items-center gap-2">📸 4. รูปภาพครุภัณฑ์ (สูงสุด 5 รูป)</h3>
              <p className="text-sm text-gray-500 mb-4">รองรับการถ่ายรูปจากกล้องมือถือ หรือเลือกรูปจากอัลบั้ม</p>
              
              <div className="flex flex-wrap gap-4 mb-4">
                {images.length < 5 && (
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-primary text-primary rounded-xl hover:bg-teal-50 transition-colors bg-white shadow-sm"
                  >
                    <span className="text-3xl mb-1">➕</span>
                    <span className="text-sm font-bold">เพิ่มรูปภาพ</span>
                  </button>
                )}

                {images.map((src, index) => (
                  <div key={index} className="relative w-32 h-32 border border-gray-200 rounded-xl overflow-hidden shadow-sm group bg-white">
                    <img src={src} alt={`preview-${index}`} className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                multiple 
                className="hidden" 
                onChange={handleImageChange}
              />
            </section>

            <div className="card-actions justify-end mt-8 border-t pt-6">
              <button type="button" onClick={() => router.push('/')} className="btn btn-ghost" disabled={isSubmitting}>ยกเลิก</button>
              <button type="submit" className="btn btn-primary text-white px-8" disabled={isSubmitting}>
                {isSubmitting ? <span className="loading loading-spinner"></span> : '💾 บันทึกทะเบียนประวัติ (สพ.4)'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ================= MODAL จัดการผู้ขาย ================= */}
      {showVendorModal && (
        <div className="modal modal-open bg-black/30">
          <div className="modal-box w-11/12 max-w-4xl p-8 rounded-2xl shadow-2xl">
            <h3 className="font-bold text-2xl mb-6 text-gray-800">{editVendorId ? 'แก้ไขข้อมูลผู้ขาย' : 'เพิ่มผู้ขายใหม่'}</h3>
            <div className="bg-gray-50/80 border border-gray-200 p-6 rounded-xl mb-8 shadow-sm">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <label className="sm:w-1/4 font-semibold text-gray-600 text-sm">ชื่อบริษัท / ร้านค้า <span className="text-error">*</span></label>
                  <input type="text" className="input input-bordered w-full sm:w-3/4 bg-white" value={modalVName} onChange={e => setModalVName(e.target.value)} />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <label className="sm:w-1/4 font-semibold text-gray-600 text-sm">ที่อยู่</label>
                  <input type="text" className="input input-bordered w-full sm:w-3/4 bg-white" value={modalVAddress} onChange={e => setModalVAddress(e.target.value)} />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <label className="sm:w-1/4 font-semibold text-gray-600 text-sm">เบอร์โทรศัพท์</label>
                  <input type="text" className="input input-bordered w-full sm:w-3/4 bg-white" value={modalVPhone} onChange={e => setModalVPhone(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end items-center gap-6 mt-6 pt-5 border-t border-gray-200">
                <button type="button" className="font-bold text-gray-600 hover:text-gray-900" onClick={() => setShowVendorModal(false)}>ยกเลิก</button>
                <button type="button" className="btn btn-primary bg-teal-600 hover:bg-teal-700 text-white px-8" onClick={saveVendor}>💾 บันทึก</button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="table w-full text-center bg-white">
                <thead className="bg-gray-100 text-gray-700 text-sm">
                  <tr>
                    <th className="font-bold py-4 pl-6 text-left">ชื่อผู้ขาย</th>
                    <th className="font-bold py-4">เบอร์โทร</th>
                    <th className="font-bold py-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(vendorList) && vendorList.map(v => (
                    <tr key={v.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="text-left pl-6 font-medium text-gray-700">{v.name}</td>
                      <td className="text-gray-600">{v.phone || '-'}</td>
                      <td className="text-center">
                        <div className="flex justify-center gap-2">
                          <button type="button" onClick={() => openVendorModal(v)} className="btn btn-sm btn-ghost text-warning hover:bg-warning/10">แก้ไข</button>
                          <button type="button" onClick={() => deleteVendor(v.id)} className="btn btn-sm btn-ghost text-error hover:bg-error/10">ลบ</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!Array.isArray(vendorList) || vendorList.length === 0) && ( <tr><td colSpan={3} className="text-center py-8 text-gray-500 font-medium">ยังไม่มีข้อมูลผู้ขายในระบบ</td></tr> )}
                </tbody>
              </table>
            </div>
            <div className="modal-action mt-6">
              <button type="button" className="btn btn-outline border-gray-300 text-gray-700" onClick={() => setShowVendorModal(false)}>ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL จัดการสถานที่ตั้ง ================= */}
      {showLocationModal && (
        <div className="modal modal-open bg-black/30">
          <div className="modal-box w-11/12 max-w-4xl p-8 rounded-2xl shadow-2xl bg-white">
            <h3 className="font-bold text-2xl mb-6 text-pink-600">
              {editLocationId ? 'แก้ไขสถานที่ตั้ง' : 'เพิ่มสถานที่ตั้งใหม่'}
            </h3>
            <div className="bg-pink-50/50 border border-pink-100 p-6 rounded-xl mb-8 shadow-sm">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <label className="sm:w-1/4 font-semibold text-gray-700 text-sm">อาคาร/ตึก</label>
                  <input type="text" className="input input-bordered w-full sm:w-3/4 bg-white focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400" placeholder="เช่น อาคาร 14" value={modalBuilding} onChange={e => setModalBuilding(e.target.value)} />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <label className="sm:w-1/4 font-semibold text-gray-700 text-sm">ชั้นที่</label>
                  <input type="text" className="input input-bordered w-full sm:w-3/4 bg-white focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400" placeholder="เช่น 2" value={modalFloor} onChange={e => setModalFloor(e.target.value)} />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <label className="sm:w-1/4 font-semibold text-gray-700 text-sm">แผนก/หน่วยงาน <span className="text-pink-500">*</span></label>
                  <input type="text" className="input input-bordered w-full sm:w-3/4 bg-white focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400" placeholder="เช่น หอผู้ป่วยหนัก MICU 2" value={modalDepartment} onChange={e => setModalDepartment(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end items-center gap-6 mt-6 pt-5 border-t border-pink-100">
                <button type="button" className="font-bold text-gray-600 hover:text-gray-900" onClick={() => { setEditLocationId(null); setModalBuilding(''); setModalFloor(''); setModalDepartment(''); }}>ยกเลิก</button>
                <button type="button" className="btn bg-[#ec4899] hover:bg-[#db2777] border-none text-white px-8 shadow-md rounded-lg" onClick={saveLocation}>💾 บันทึก</button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="table w-full text-center bg-white">
                <thead className="bg-[#f8fafc] text-gray-700 text-sm border-b border-gray-200">
                  <tr>
                    <th className="font-bold py-4 pl-6 text-left">อาคาร/ตึก</th>
                    <th className="font-bold py-4">ชั้นที่</th>
                    <th className="font-bold py-4">แผนก/หน่วยงาน</th>
                    <th className="font-bold py-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(locationList) && locationList.map(loc => (
                    <tr key={loc.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="text-left pl-6 font-medium text-gray-700">{loc.building || '-'}</td>
                      <td className="text-gray-600">{loc.floor || '-'}</td>
                      <td className="text-gray-600">{loc.department || '-'}</td>
                      <td className="text-center">
                        <div className="flex justify-center gap-2">
                          <button type="button" onClick={() => openLocationModal(loc)} className="btn btn-sm btn-ghost text-amber-500 hover:bg-amber-50">แก้ไข</button>
                          <button type="button" onClick={() => deleteLocation(loc.id)} className="btn btn-sm btn-ghost text-rose-500 hover:bg-rose-50">ลบ</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!Array.isArray(locationList) || locationList.length === 0) && ( <tr><td colSpan={4} className="text-center py-8 text-[#64748b] font-medium">ยังไม่มีข้อมูลสถานที่ในระบบ</td></tr> )}
                </tbody>
              </table>
            </div>
            <div className="modal-action mt-6">
              <button type="button" className="btn btn-outline border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 bg-white" onClick={() => setShowLocationModal(false)}>ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}