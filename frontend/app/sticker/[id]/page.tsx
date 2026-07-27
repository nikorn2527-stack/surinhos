'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';

// ================= คอมโพเนนต์สำหรับทำให้ลากได้ (Draggable) =================
function DraggableItem({ children }: { children: React.ReactNode }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    startPos.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPos({
      x: e.clientX - startPos.current.x,
      y: e.clientY - startPos.current.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="draggable-item no-print-border"
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        cursor: isDragging ? 'grabbing' : 'grab',
        position: 'relative',
        zIndex: isDragging ? 50 : 1,
        touchAction: 'none',
        userSelect: 'none'
      }}
    >
      {children}
    </div>
  );
}

export default function CustomPrintLabel() {
  const params = useParams();
  const id = params.id;
  const [asset, setAsset] = useState<any>(null);
  const [error, setError] = useState(false);

  // 💡 State ข้อมูลองค์กร
  const [org, setOrg] = useState<any>({ prefix: '', orgName: '', logo: '' });

  // ================= State สำหรับการตั้งค่าสติ๊กเกอร์ =================
  const [tapeSize, setTapeSize] = useState('24mm'); 
  const [tapeLength, setTapeLength] = useState(80); 
  const [headerText, setHeaderText] = useState('🏢 กำลังโหลดชื่อหน่วยงาน...');
  const [baseFontSize, setBaseFontSize] = useState(7); 

  // ================= State เปิด/ปิด ข้อมูลที่จะแสดง =================
  const [showBorder, setShowBorder] = useState(true); 
  const [showLogo, setShowLogo] = useState(true); // 💡 เพิ่มสวิตช์เปิดปิดโลโก้
  const [showQR, setShowQR] = useState(true);
  
  const [showAssetNum1, setShowAssetNum1] = useState(true);
  const [showAssetNum2, setShowAssetNum2] = useState(false);
  const [showName, setShowName] = useState(true);
  const [showBrand, setShowBrand] = useState(true);
  const [showCategory, setShowCategory] = useState(false);
  const [showSN, setShowSN] = useState(true);
  
  const [showDept, setShowDept] = useState(true); 
  const [showAcquiredDate, setShowAcquiredDate] = useState(true);
  const [showBuilding, setShowBuilding] = useState(false); 
  const [showFloor, setShowFloor] = useState(false); 
  
  const [showAcquiredMethod, setShowAcquiredMethod] = useState(false); 
  const [showFundingType, setShowFundingType] = useState(false); 
  const [showVendor, setShowVendor] = useState(false); 
  const [showLifespan, setShowLifespan] = useState(false); 
  
  const [showPrice, setShowPrice] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  // ================= State สำหรับจัดการ Profile และ Reset =================
  const [savedProfiles, setSavedProfiles] = useState<any[]>([]);
  const [newProfileName, setNewProfileName] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [resetKey, setResetKey] = useState(0); 

  useEffect(() => {
    const loadedProfiles = localStorage.getItem('stickerProfilesSep');
    if (loadedProfiles) {
      setSavedProfiles(JSON.parse(loadedProfiles));
    }
    
    // 💡 ดึงข้อมูลองค์กร
    fetch('http://192.168.1.120:5000/api/settings/organization')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setOrg(data);
          setHeaderText(`🏢 ${data.prefix} ${data.orgName} (สพ.4)`);
        }
      })
      .catch(err => console.error('Error fetching org:', err));

  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`http://192.168.1.120:5000/api/assets/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => setAsset(data))
      .catch(err => {
        console.error(err);
        setError(true);
      });
  }, [id]);

  // ================= ฟังก์ชันรีเซ็ต =================
  const handleReset = () => {
    if (confirm('คุณต้องการรีเซ็ตการตั้งค่า การเลือกหัวข้อ และตำแหน่งทั้งหมดกลับเป็นค่าเริ่มต้นใช่หรือไม่?')) {
      setTapeSize('24mm');
      setTapeLength(80);
      setHeaderText(`🏢 ${org.prefix} ${org.orgName} (สพ.4)`);
      setBaseFontSize(7);

      setShowBorder(true);
      setShowLogo(true); // 💡 รีเซ็ตโลโก้
      setShowQR(true);
      setShowAssetNum1(true);
      setShowAssetNum2(false);
      setShowName(true);
      setShowBrand(true);
      setShowCategory(false);
      setShowSN(true);
      
      setShowDept(true);
      setShowAcquiredDate(true);
      setShowBuilding(false);
      setShowFloor(false);
      
      setShowAcquiredMethod(false);
      setShowFundingType(false);
      setShowVendor(false);
      setShowLifespan(false);
      
      setShowPrice(false);
      setShowStatus(false);
      
      setSelectedProfileId('');
      setResetKey(prev => prev + 1); 
    }
  };

  // ================= ฟังก์ชันบันทึกและโหลด Profile =================
  const saveProfile = () => {
    if (!newProfileName.trim()) {
      alert('กรุณาตั้งชื่อโปรไฟล์ก่อนบันทึก');
      return;
    }
    const currentConfig = {
      id: Date.now().toString(),
      name: newProfileName,
      tapeSize, tapeLength, headerText, baseFontSize,
      showBorder, showLogo, showQR, showAssetNum1, showAssetNum2, showName, showBrand, showCategory, showSN,
      showDept, showAcquiredDate, showBuilding, showFloor,
      showAcquiredMethod, showFundingType, showVendor, showLifespan, showPrice, showStatus
    };

    const updatedProfiles = [...savedProfiles, currentConfig];
    setSavedProfiles(updatedProfiles);
    localStorage.setItem('stickerProfilesSep', JSON.stringify(updatedProfiles));
    setNewProfileName('');
    setSelectedProfileId(currentConfig.id);
    alert('บันทึกโปรไฟล์สำเร็จ!');
  };

  const loadProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
    if (!profileId) return;

    const profile = savedProfiles.find(p => p.id === profileId);
    if (profile) {
      setTapeSize(profile.tapeSize);
      setTapeLength(profile.tapeLength);
      setHeaderText(profile.headerText);
      setBaseFontSize(profile.baseFontSize);
      
      setShowBorder(profile.showBorder ?? true);
      setShowLogo(profile.showLogo ?? true); // 💡 โหลดค่าสวิตช์โลโก้
      setShowQR(profile.showQR ?? true);
      setShowAssetNum1(profile.showAssetNum1 ?? true);
      setShowAssetNum2(profile.showAssetNum2 ?? false);
      setShowName(profile.showName ?? true);
      setShowBrand(profile.showBrand ?? true);
      setShowCategory(profile.showCategory ?? false);
      setShowSN(profile.showSN ?? true);
      
      setShowDept(profile.showDept ?? true);
      setShowAcquiredDate(profile.showAcquiredDate ?? true);
      setShowBuilding(profile.showBuilding ?? false);
      setShowFloor(profile.showFloor ?? false);
      
      setShowAcquiredMethod(profile.showAcquiredMethod ?? false);
      setShowFundingType(profile.showFundingType ?? false);
      setShowVendor(profile.showVendor ?? false);
      setShowLifespan(profile.showLifespan ?? false);
      
      setShowPrice(profile.showPrice ?? false);
      setShowStatus(profile.showStatus ?? false);

      setResetKey(prev => prev + 1); 
    }
  };

  const deleteProfile = () => {
    if (!selectedProfileId) return;
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโปรไฟล์นี้?')) {
      const updatedProfiles = savedProfiles.filter(p => p.id !== selectedProfileId);
      setSavedProfiles(updatedProfiles);
      localStorage.setItem('stickerProfilesSep', JSON.stringify(updatedProfiles));
      setSelectedProfileId('');
    }
  };

  if (error) return <div className="p-8 text-center text-red-500 font-bold text-xl">❌ ไม่พบข้อมูลครุภัณฑ์ หรือเกิดข้อผิดพลาด</div>;
  if (!asset) return <div className="p-8 text-center font-bold text-xl text-primary">⏳ กำลังเตรียมข้อมูลครุภัณฑ์...</div>;

  const formatShortThaiDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric' }); 
  };

  const qrData = encodeURIComponent(`${asset.asset_number_1 || asset.asset_code}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`;

  const stickerConfig = {
    '18mm': { height: '18mm', qrSize: '15mm' },
    '24mm': { height: '24mm', qrSize: '20mm' },
    '36mm': { height: '36mm', qrSize: '28mm' },
  }[tapeSize] || { height: '24mm', qrSize: '20mm' };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      
      {/* ================= ฝั่งซ้าย: แผงควบคุม ================= */}
      <div className="no-print w-full md:w-[350px] bg-white shadow-2xl z-10 p-6 flex flex-col gap-4 overflow-y-auto border-r border-gray-200" style={{ maxHeight: '100vh' }}>
        <div>
          <h2 className="text-xl font-bold text-gray-800">🛠️ ปรับแต่งสติ๊กเกอร์</h2>
          <p className="text-xs text-gray-500 mt-1">ลากข้อความในตัวอย่างฝั่งขวาเพื่อจัดตำแหน่ง</p>
        </div>

        {/* 0. ระบบ Profile */}
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
          <label className="label p-0 mb-2"><span className="label-text font-bold text-blue-800">💾 จัดการโปรไฟล์ (Profiles)</span></label>
          <div className="flex gap-2 mb-2">
            <select 
              className="select select-bordered select-sm flex-1 bg-white" 
              value={selectedProfileId} 
              onChange={(e) => loadProfile(e.target.value)}
            >
              <option value="">-- เลือกโปรไฟล์ --</option>
              {savedProfiles.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {selectedProfileId && (
              <button onClick={deleteProfile} className="btn btn-sm btn-error text-white" title="ลบโปรไฟล์">🗑️</button>
            )}
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="ตั้งชื่อโปรไฟล์ใหม่..." 
              className="input input-bordered input-sm flex-1 bg-white" 
              value={newProfileName} 
              onChange={(e) => setNewProfileName(e.target.value)}
            />
            <button onClick={saveProfile} className="btn btn-sm btn-primary">บันทึก</button>
          </div>
        </div>

        <div className="space-y-3">
          {/* 1. ขนาดเทปและความยาว */}
          <div className="form-control bg-gray-50 p-3 rounded-lg border border-gray-100">
            <label className="label cursor-pointer p-0 mb-2"><span className="label-text font-bold text-gray-700">📏 ขนาดเทป (ความสูง)</span></label>
            <select className="select select-bordered select-sm w-full mb-3" value={tapeSize} onChange={(e) => setTapeSize(e.target.value)}>
              <option value="18mm">เทป 18mm (เล็ก)</option>
              <option value="24mm">เทป 24mm (มาตรฐาน)</option>
              <option value="36mm">เทป 36mm (ใหญ่)</option>
            </select>

            <label className="label p-0 mb-1 mt-2 flex justify-between">
              <span className="label-text font-bold text-gray-700">↔️ ความยาวสติ๊กเกอร์</span>
              <span className="font-bold text-primary">{tapeLength} mm</span>
            </label>
            <input 
              type="range" 
              min="40" 
              max="150" 
              value={tapeLength} 
              className="range range-primary range-sm" 
              onChange={(e) => setTapeLength(Number(e.target.value))}
            />
          </div>

          <div className="form-control">
            <label className="label p-0 mb-1"><span className="label-text font-bold text-gray-700">🏷️ ข้อความหัวสติ๊กเกอร์</span></label>
            <input 
              type="text" 
              className="input input-bordered input-sm w-full" 
              value={headerText} 
              onChange={(e) => setHeaderText(e.target.value)} 
            />
          </div>

          <div className="form-control">
            <label className="label p-0 mb-1"><span className="label-text font-bold text-gray-700">A ปรับขนาดตัวอักษรรวม</span></label>
            <div className="flex items-center gap-3">
              <button onClick={() => setBaseFontSize(prev => Math.max(4, prev - 0.5))} className="btn btn-sm btn-outline">-</button>
              <span className="font-semibold text-sm w-8 text-center">{baseFontSize}</span>
              <button onClick={() => setBaseFontSize(prev => Math.min(14, prev + 0.5))} className="btn btn-sm btn-outline">+</button>
            </div>
          </div>

          <div className="divider my-0"></div>

          {/* กลุ่ม 1: ข้อมูลพื้นฐาน */}
          <div className="form-control">
            <label className="label p-0 mb-2"><span className="label-text font-bold text-gray-700">👁️ ข้อมูลพื้นฐาน</span></label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-primary">
                <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={showBorder} onChange={(e) => setShowBorder(e.target.checked)} /> 🔳 กรอบสีดำ
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={showLogo} onChange={(e) => setShowLogo(e.target.checked)} /> โลโก้หน่วยงาน
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={showQR} onChange={(e) => setShowQR(e.target.checked)} /> QR Code
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={showAssetNum1} onChange={(e) => setShowAssetNum1(e.target.checked)} /> เลขครุภัณฑ์หลัก
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={showAssetNum2} onChange={(e) => setShowAssetNum2(e.target.checked)} /> เลขครุภัณฑ์เดิม
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={showName} onChange={(e) => setShowName(e.target.checked)} /> ชื่อรายการ
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={showBrand} onChange={(e) => setShowBrand(e.target.checked)} /> ยี่ห้อ (Brand)
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={showCategory} onChange={(e) => setShowCategory(e.target.checked)} /> หมวดหมู่
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={showSN} onChange={(e) => setShowSN(e.target.checked)} /> Serial Number
              </label>
            </div>
          </div>

          <div className="divider my-0"></div>

          {/* กลุ่ม 2: ข้อมูลเชิงลึก (สพ.4) */}
          <div className="form-control pb-4">
            <label className="label p-0 mb-2"><span className="label-text font-bold text-gray-700">📑 ข้อมูลเชิงลึก (สพ.4)</span></label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input type="checkbox" className="checkbox checkbox-xs checkbox-secondary" checked={showDept} onChange={(e) => setShowDept(e.target.checked)} /> แผนก
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input type="checkbox" className="checkbox checkbox-xs checkbox-secondary" checked={showAcquiredDate} onChange={(e) => setShowAcquiredDate(e.target.checked)} /> วันที่รับ
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input type="checkbox" className="checkbox checkbox-xs checkbox-secondary" checked={showBuilding} onChange={(e) => setShowBuilding(e.target.checked)} /> อาคาร
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input type="checkbox" className="checkbox checkbox-xs checkbox-secondary" checked={showFloor} onChange={(e) => setShowFloor(e.target.checked)} /> ชั้น
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input type="checkbox" className="checkbox checkbox-xs checkbox-secondary" checked={showAcquiredMethod} onChange={(e) => setShowAcquiredMethod(e.target.checked)} /> วิธีการได้มา
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input type="checkbox" className="checkbox checkbox-xs checkbox-secondary" checked={showFundingType} onChange={(e) => setShowFundingType(e.target.checked)} /> แหล่งเงินทุน
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input type="checkbox" className="checkbox checkbox-xs checkbox-secondary" checked={showVendor} onChange={(e) => setShowVendor(e.target.checked)} /> ผู้ขาย
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input type="checkbox" className="checkbox checkbox-xs checkbox-secondary" checked={showLifespan} onChange={(e) => setShowLifespan(e.target.checked)} /> อายุการใช้งาน
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input type="checkbox" className="checkbox checkbox-xs checkbox-secondary" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} /> ราคา
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input type="checkbox" className="checkbox checkbox-xs checkbox-secondary" checked={showStatus} onChange={(e) => setShowStatus(e.target.checked)} /> สถานะ
              </label>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4 flex flex-col gap-2">
          <button onClick={() => window.print()} className="btn btn-primary w-full shadow-lg text-white font-bold text-lg">
            🖨️ สั่งพิมพ์ (Print)
          </button>
          
          <div className="flex gap-2">
            <button onClick={handleReset} className="btn btn-outline btn-error flex-1 font-semibold">
              🔄 รีเซ็ต
            </button>
            <button onClick={() => window.close()} className="btn btn-ghost flex-1 text-gray-500">
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>

      {/* ================= ฝั่งขวา: พรีวิวสติ๊กเกอร์ (ลากปรับตำแหน่งได้) ================= */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-500 print-bg-white print-p-0 print-block overflow-hidden">
        <div className="no-print mb-4 text-white text-sm opacity-70">🔎 ตัวอย่างสติ๊กเกอร์ (กว้าง {tapeLength}mm x สูง {tapeSize}) - ลากข้อความและรูปภาพเพื่อจัดตำแหน่งได้เลย</div>
        
        {/* กล่องสติ๊กเกอร์ */}
        <div 
          className="print-container bg-white flex items-center box-border shadow-xl print-shadow-none relative"
          style={{
            width: `${tapeLength}mm`,
            height: stickerConfig.height,
            padding: '1.5mm',
            fontFamily: "'Sarabun', sans-serif",
            color: 'black',
            borderRadius: '2px', 
            border: showBorder ? '1.5px solid black' : 'none', 
            overflow: 'hidden'
          }}
        >
          <div className="relative w-full h-full" key={resetKey}>
            
            {/* 💡 โลโก้ที่เพิ่มเข้ามา (ลากอิสระได้เช่นกัน) */}
            {showLogo && org.logo && (
              <div className="absolute" style={{ top: '0', right: '0' }}>
                <DraggableItem>
                  <div style={{ width: stickerConfig.qrSize, height: stickerConfig.qrSize }}>
                    <img src={org.logo} alt="Organization Logo" draggable="false" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                </DraggableItem>
              </div>
            )}

            {showQR && (
              <div className="absolute" style={{ top: '0', left: '0' }}>
                <DraggableItem>
                  <div style={{ width: stickerConfig.qrSize, height: stickerConfig.qrSize }}>
                    <img src={qrUrl} alt="QR Code" draggable="false" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                </DraggableItem>
              </div>
            )}
            
            {/* กล่องใส่ข้อความทั้งหมดเพื่อให้เริ่มต้นมาจัดเรียงต่อกัน แต่ผู้ใช้สามารถลากแยกออกไปได้ */}
            <div className="flex flex-col flex-wrap h-full content-start" style={{ marginLeft: showQR ? `calc(${stickerConfig.qrSize} + 2mm)` : '0', zIndex: 10 }}>
              
              {headerText && (
                <DraggableItem>
                  <div style={{ fontSize: `${baseFontSize}pt`, fontWeight: 700, borderBottom: '1px solid #000', marginBottom: '1px', paddingBottom: '1px', whiteSpace: 'nowrap', display: 'inline-block' }}>
                    {headerText}
                  </div>
                </DraggableItem>
              )}
              
              {showAssetNum1 && (
                <DraggableItem>
                  <div style={{ fontSize: `${baseFontSize + 1.5}pt`, fontWeight: 700, whiteSpace: 'nowrap', marginTop: '1px', display: 'inline-block' }}>
                    {asset.asset_number_1 || asset.asset_code}
                  </div>
                </DraggableItem>
              )}

              {showAssetNum2 && asset.asset_number_2 && (
                <DraggableItem>
                  <div style={{ fontSize: `${baseFontSize + 1}pt`, fontWeight: 700, whiteSpace: 'nowrap', display: 'inline-block' }}>
                    ({asset.asset_number_2})
                  </div>
                </DraggableItem>
              )}
              
              {showName && (
                <DraggableItem>
                  <div style={{ fontSize: `${baseFontSize - 0.5}pt`, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    รายการ: {asset.name}
                  </div>
                </DraggableItem>
              )}

              {showBrand && asset.brand && (
                <DraggableItem>
                  <div style={{ fontSize: `${baseFontSize - 0.5}pt`, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    ยี่ห้อ: {asset.brand}
                  </div>
                </DraggableItem>
              )}
              
              {showCategory && asset.category && (
                <DraggableItem>
                  <div style={{ fontSize: `${baseFontSize - 1}pt`, whiteSpace: 'nowrap' }}>
                    หมวดหมู่: {asset.category}
                  </div>
                </DraggableItem>
              )}
              
              {showSN && asset.serial_number && (
                <DraggableItem>
                  <div style={{ fontSize: `${baseFontSize - 1}pt`, whiteSpace: 'nowrap' }}>
                    S/N: {asset.serial_number}
                  </div>
                </DraggableItem>
              )}
              
              {showDept && asset.department && (
                <DraggableItem>
                  <div style={{ fontSize: `${baseFontSize - 1}pt`, whiteSpace: 'nowrap' }}>
                    แผนก: {asset.department}
                  </div>
                </DraggableItem>
              )}

              {showAcquiredDate && asset.acquired_date && (
                <DraggableItem>
                  <div style={{ fontSize: `${baseFontSize - 1}pt`, whiteSpace: 'nowrap' }}>
                    รับ: {formatShortThaiDate(asset.acquired_date)}
                  </div>
                </DraggableItem>
              )}

              {showBuilding && asset.building && (
                <DraggableItem>
                  <div style={{ fontSize: `${baseFontSize - 1}pt`, whiteSpace: 'nowrap' }}>
                    อาคาร: {asset.building}
                  </div>
                </DraggableItem>
              )}

              {showFloor && asset.floor && (
                <DraggableItem>
                  <div style={{ fontSize: `${baseFontSize - 1}pt`, whiteSpace: 'nowrap' }}>
                    ชั้น: {asset.floor}
                  </div>
                </DraggableItem>
              )}

              {showAcquiredMethod && asset.acquired_method && (
                <DraggableItem>
                  <div style={{ fontSize: `${baseFontSize - 1}pt`, whiteSpace: 'nowrap' }}>
                    การได้มา: {asset.acquired_method}
                  </div>
                </DraggableItem>
              )}

              {showFundingType && asset.funding_type && (
                <DraggableItem>
                  <div style={{ fontSize: `${baseFontSize - 1}pt`, whiteSpace: 'nowrap' }}>
                    เงินทุน: {asset.funding_type}
                  </div>
                </DraggableItem>
              )}

              {showVendor && asset.vendor && (
                <DraggableItem>
                  <div style={{ fontSize: `${baseFontSize - 1}pt`, whiteSpace: 'nowrap' }}>
                    ผู้ขาย: {asset.vendor}
                  </div>
                </DraggableItem>
              )}

              {showLifespan && asset.lifespan_years && (
                <DraggableItem>
                  <div style={{ fontSize: `${baseFontSize - 1}pt`, whiteSpace: 'nowrap' }}>
                    อายุ: {asset.lifespan_years} ปี
                  </div>
                </DraggableItem>
              )}

              {showPrice && asset.price && (
                <DraggableItem>
                  <div style={{ fontSize: `${baseFontSize - 1}pt`, whiteSpace: 'nowrap' }}>
                    ราคา: ฿{Number(asset.price).toLocaleString()}
                  </div>
                </DraggableItem>
              )}

              {showStatus && asset.status && (
                <DraggableItem>
                  <div style={{ fontSize: `${baseFontSize - 1}pt`, whiteSpace: 'nowrap' }}>
                    สถานะ: {asset.status}
                  </div>
                </DraggableItem>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* ================= CSS สำหรับหน้าต่างพิมพ์และเอฟเฟกต์การลาก ================= */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
        
        .draggable-item {
          transition: background-color 0.2s;
          border-radius: 4px;
          padding: 0 2px;
          margin-left: -2px; 
          line-height: 1.1;
        }
        .draggable-item:hover {
          outline: 1px dashed #3b82f6;
          background-color: rgba(59, 130, 246, 0.1);
        }

        @media print {
          @page {
            size: ${tapeLength}mm ${stickerConfig.height} landscape;
            margin: 0;
          }
          body {
            background-color: white !important;
            margin: 0;
            padding: 0;
            display: block;
          }
          .no-print {
            display: none !important;
          }
          .print-bg-white {
            background-color: white !important;
          }
          .print-p-0 {
            padding: 0 !important;
          }
          .print-block {
            display: block !important;
          }
          .print-shadow-none {
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .print-container {
            margin: 0;
            page-break-after: avoid;
          }
          .no-print-border, .no-print-border:hover {
            outline: none !important;
            background-color: transparent !important;
          }
        }
      `}} />
    </div>
  );
}