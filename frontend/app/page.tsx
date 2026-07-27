'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  
  const [userName, setUserName] = useState('');
  const [roleName, setRoleName] = useState('');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  
  const [org, setOrg] = useState({ prefix: '', orgName: 'Pacific Plus IT', logo: '' });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ทั้งหมด');

  const handleForceLogout = (message: string) => {
    alert(`⚠️ ${message}`);
    localStorage.clear();
    sessionStorage.clear();
    router.push('/login');
  };

  const getToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  useEffect(() => {
    const token = getToken();
    
    if (!token) {
      router.push('/login');
      return;
    }
    
    setUserName(localStorage.getItem('userName') || sessionStorage.getItem('userName') || '');
    setRoleName(localStorage.getItem('roleName') || sessionStorage.getItem('roleName') || '');
    const permsString = localStorage.getItem('permissions') || sessionStorage.getItem('permissions') || '[]';
    setUserPermissions(JSON.parse(permsString));

    const headers = { 'Authorization': `Bearer ${token}` };

    fetch('http://192.168.1.120:5000/api/settings/organization', { headers })
      .then(async res => {
        const data = await res.json();
        if (data?.forceLogout) return handleForceLogout(data.error);
        if (data && !data.error) setOrg(data);
      })
      .catch(err => console.error('Error fetching org:', err));

    fetch('http://192.168.1.120:5000/api/assets', { headers })
      .then(async (res) => {
        const data = await res.json();
        if (data?.forceLogout) return handleForceLogout(data.error);
        if (Array.isArray(data)) setAssets(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching assets:', err);
        setIsLoading(false);
      });
  }, [router]);

  const handleLogout = () => {
    if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
      localStorage.clear();
      sessionStorage.clear();
      router.push('/login');
    }
  };

  const hasPermission = (key: string) => {
    const roleLower = (roleName || '').toLowerCase();
    if (roleLower.includes('admin') || roleLower.includes('ผู้ดูแลระบบ')) return true; 
    return userPermissions.includes(key);
  };

  const filteredAssets = assets.filter((asset) => {
    const matchSearch = (asset.asset_code || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (asset.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (asset.asset_number_1 || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'ทั้งหมด' || asset.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalValue = assets.reduce((sum, a) => sum + Number(a.price || 0), 0);

  const formatThaiDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const downloadTemplate = () => {
    const headers = [
      'หมายเลขควบคุม', 'หมายเลขครุภัณฑ์ 1', 'หมายเลขครุภัณฑ์ 2', 'รายการ', 
      'ยี่ห้อ', 'Serial Number', 'ประเภทครุภัณฑ์', 'ราคา', 
      'วันที่ได้มา', 'วิธีการได้มา', 'ผู้ขาย', 'อายุการใช้งาน', 'สถานที่ตั้ง'
    ];
    const exampleRow = [
      'SR-0000001', '7440-001-0001/67', 'OLD-1234', 'เครื่องคอมพิวเตอร์ All In One', 
      'Lenovo', 'SN987654321', 'ครุภัณฑ์คอมพิวเตอร์', '15000', 
      '2026-07-21', 'ตกลงราคา', 'บริษัท ไอที จำกัด', '5', 'ห้องประชุม 1'
    ];
    const csvRows = [headers.join(','), exampleRow.map(text => `"${text}"`).join(',')];
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = 'ฟอร์มนำเข้าครุภัณฑ์_สพ4.csv';
    link.click();
  };

  const exportToCSV = () => {
    const headers = ['หมายเลขควบคุม', 'หมายเลข 1', 'หมายเลข 2', 'ชื่อรายการ', 'หมวดหมู่', 'ราคา', 'วันที่ได้มา', 'สถานะ'];
    const csvRows = [headers.join(',')];
    filteredAssets.forEach(asset => {
      csvRows.push([
        `"${asset.asset_code || ''}"`, `"${asset.asset_number_1 || ''}"`, `"${asset.asset_number_2 || ''}"`, 
        `"${asset.name || ''}"`, `"${asset.category || ''}"`, asset.price, `"${formatThaiDate(asset.acquired_date)}"`, `"${asset.status || ''}"`
      ].join(','));
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = 'รายงานครุภัณฑ์ทั้งหมด.csv';
    link.click();
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('กรุณาอนุญาต Pop-ups สำหรับเว็บไซต์นี้เพื่อพิมพ์ PDF');

    const html = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <title>รายงานครุภัณฑ์ทั้งหมด</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Sarabun', sans-serif; padding: 30px; color: #333; }
          .header-container { text-align: center; margin-bottom: 25px; }
          .logo { width: 90px; height: 90px; object-fit: contain; margin-bottom: 10px; }
          h2 { margin: 0 0 5px 0; font-size: 26px; color: #1e3a8a; }
          .subtitle { font-size: 16px; color: #555; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px 8px; text-align: left; }
          th { background-color: #f8fafc; font-weight: 600; }
          tr:nth-child(even) { background-color: #fcfcfc; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          @media print { @page { margin: 1cm; size: A4 landscape; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header-container">
          ${org.logo ? `<img src="${org.logo}" class="logo" alt="Logo" />` : ''}
          <h2>${org.prefix} ${org.orgName}</h2>
          <div class="subtitle"><strong>รายงานสรุปรายการครุภัณฑ์ทั้งหมด</strong></div>
          <div class="subtitle" style="font-size: 14px;">ออกรายงานวันที่: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th class="text-center" width="5%">ลำดับ</th>
              <th width="15%">หมายเลขครุภัณฑ์</th>
              <th width="25%">ชื่อรายการ</th>
              <th width="20%">หมวดหมู่</th>
              <th width="10%">วันที่ได้มา</th>
              <th class="text-right" width="10%">ราคา (บาท)</th>
              <th width="15%">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            ${filteredAssets.map((a, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>
                  <strong>${a.asset_number_1 || '-'}</strong>
                  ${a.asset_number_2 ? `<br><span style="font-size:11px; color:#888;">(เลขเดิม: ${a.asset_number_2})</span>` : ''}
                </td>
                <td>${a.name || '-'}</td>
                <td>${a.category || '-'}</td>
                <td>${formatThaiDate(a.acquired_date)}</td>
                <td class="text-right">${Number(a.price || 0).toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                <td>${a.status || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>
          window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 800); };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(`ยืนยันการนำเข้าข้อมูลจากไฟล์ ${file.name} ใช่หรือไม่?`)) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    fetch('http://192.168.1.120:5000/api/assets/import', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData
    })
    .then(async res => {
      const data = await res.json();
      setIsImporting(false);
      if (data?.forceLogout) return handleForceLogout(data.error);
      if (data.error) alert('เกิดข้อผิดพลาด: ' + data.error);
      else { alert(data.message); window.location.reload(); }
    })
    .catch(err => {
      setIsImporting(false);
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    })
    .finally(() => {
      if (fileInputRef.current) fileInputRef.current.value = '';
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? (การดำเนินการนี้ไม่สามารถกู้คืนได้)')) {
      const res = await fetch(`http://192.168.1.120:5000/api/assets/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data?.forceLogout) return handleForceLogout(data.error);
      window.location.reload(); 
    }
  };

  if (isLoading) return <div className="text-center mt-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

  return (
    <div className="flex min-h-screen bg-base-200">
      <aside className="w-72 bg-white shadow-xl flex flex-col justify-between z-10 h-screen">
        <div className="p-6 overflow-y-auto">
          <div className="flex flex-col items-center text-center gap-3 py-4 border-b border-gray-100">
            {org.logo ? (
              <img src={org.logo} alt="Organization Logo" className="w-24 h-24 object-contain shrink-0" />
            ) : (
              <div className="w-24 h-24 bg-transparent text-indigo-600 flex items-center justify-center font-bold text-5xl shrink-0">
                {org.orgName ? org.orgName.charAt(0) : 'P'}
              </div>
            )}
            <div className="flex flex-col justify-center items-center w-full px-2">
              <h1 className="text-[17px] font-bold text-indigo-700 leading-tight line-clamp-2" title={`${org.prefix} ${org.orgName}`}>
                {org.prefix} {org.orgName}
              </h1>
              <p className="text-[16px] text-gray-500 mt-1.5">ระบบบริหารจัดการครุภัณฑ์</p>
            </div>
          </div>

          <div className="bg-base-200 p-4 rounded-xl border border-base-300 mt-6 text-center">
            <p className="text-sm font-semibold">{userName || 'Loading...'}</p>
            <p className="text-xs text-gray-500 mt-1">{roleName || 'Loading...'}</p>
          </div>

          <nav className="mt-8 flex flex-col gap-6 pb-6">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">จัดการครุภัณฑ์</h3>
              <div className="space-y-1">
                <button className="btn btn-primary w-full justify-start text-white">📊 หน้าหลัก (Dashboard)</button>
                {hasPermission('create_asset') && (
                  <a href="/create" className="btn btn-ghost w-full justify-start font-normal whitespace-nowrap">➕ ขึ้นทะเบียนครุภัณฑ์ใหม่</a>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">ตรวจนับและซ่อมบำรุง</h3>
              <div className="space-y-1">
                <button onClick={() => router.push('/audits')} className="btn btn-ghost w-full justify-start font-normal text-indigo-600 whitespace-nowrap">📋 ระบบตรวจนับครุภัณฑ์</button>
                <button onClick={() => router.push('/repairs')} className="btn btn-ghost w-full justify-start font-normal text-orange-500 whitespace-nowrap">🛠️ ระบบแจ้งซ่อม</button>
              </div>
            </div>

            {(hasPermission('export_excel') || hasPermission('export_pdf')) && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">รายงาน</h3>
                <div className="space-y-1">
                  {hasPermission('export_excel') && <button onClick={exportToCSV} className="btn btn-ghost w-full justify-start font-normal text-success whitespace-nowrap">📄 รายงานครุภัณฑ์ทั้งหมด Excel</button>}
                  {hasPermission('export_pdf') && <button onClick={exportToPDF} className="btn btn-ghost w-full justify-start font-normal text-error whitespace-nowrap">📕 รายงานครุภัณฑ์ทั้งหมด PDF</button>}
                </div>
              </div>
            )}

            {hasPermission('import_asset') && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">นำเข้า / ส่งออก</h3>
                <div className="space-y-1">
                  <input type="file" accept=".csv, .xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  <button onClick={() => fileInputRef.current?.click()} className="btn btn-ghost w-full justify-start font-normal text-info whitespace-nowrap" disabled={isImporting}>
                    {isImporting ? <span className="loading loading-spinner loading-xs"></span> : '📥 นำเข้าข้อมูล (Excel)'}
                  </button>
                  <button onClick={downloadTemplate} className="btn btn-ghost w-full justify-start font-normal text-primary whitespace-nowrap">📤 ฟอร์มนำเข้า (Excel)</button>
                </div>
              </div>
            )}

            {(hasPermission('manage_users') || hasPermission('manage_org') || hasPermission('manage_running_number') || hasPermission('manage_roles')) && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">ตั้งค่าระบบทั้งหมด</h3>
                <div className="space-y-1">
                  {hasPermission('manage_users') && <a href="/settings/users" className="btn btn-ghost w-full justify-start font-normal text-warning whitespace-nowrap">👥 เพิ่ม/จัดการผู้ใช้งาน</a>}
                  {hasPermission('manage_org') && <a href="/settings/organization" className="btn btn-ghost w-full justify-start font-normal text-warning whitespace-nowrap">🏢 ตั้งค่าหน่วยงาน</a>}
                  {hasPermission('manage_running_number') && <a href="/settings/running-number" className="btn btn-ghost w-full justify-start font-normal text-warning whitespace-nowrap">🔢 ตั้งค่าเลขที่ทั้งหมด</a>}
                  {hasPermission('manage_roles') && <button onClick={() => router.push('/settings/permissions')} className="btn btn-ghost w-full justify-start font-normal text-warning whitespace-nowrap">⚙️ ตั้งค่าสิทธิ์การใช้งาน</button>}
                </div>
              </div>
            )}
          </nav>
        </div>

        <div className="p-6 border-t border-base-200 bg-white shrink-0">
          <button onClick={handleLogout} className="btn btn-outline btn-error w-full">ออกจากระบบ</button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold">รายการครุภัณฑ์ทั้งหมด</h2>
          </div>

          <div className="stats shadow w-full bg-base-100">
            <div className="stat">
              <div className="stat-title">จำนวนอุปกรณ์ในระบบ</div>
              <div className="stat-value text-primary">{assets.length}</div>
            </div>
            <div className="stat">
              <div className="stat-title">มูลค่ารวม (บาท)</div>
              <div className="stat-value text-secondary">
                ฿{totalValue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <input 
              type="text" placeholder="ค้นหาจากรหัส หรือ รายการ..." className="input input-bordered w-full"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select className="select select-bordered w-64" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="ทั้งหมด">สถานะทั้งหมด</option>
              <option value="ใช้งานปกติ">ใช้งานปกติ</option>
              <option value="ชำรุดรอซ่อม">ชำรุดรอซ่อม</option>
              <option value="เสื่อมสภาพ/รอจำหน่าย">เสื่อมสภาพ/รอจำหน่าย</option>
              <option value="แทงจำหน่ายแล้ว">แทงจำหน่ายแล้ว</option>
            </select>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body p-0 overflow-hidden rounded-2xl">
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead className="bg-base-200 text-base">
                    <tr>
                      <th>หมายเลขควบคุม</th>
                      <th>ชื่อรายการ</th>
                      <th>หมวดหมู่</th>
                      <th>วันที่ได้มา</th>
                      <th>ราคา</th>
                      <th>สถานะ</th>
                      <th>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.map((asset) => (
                      <tr key={asset.id} className="hover">
                        <td className="font-semibold">
                          {asset.asset_code}
                          <div className="text-xs text-gray-500 font-normal">{asset.asset_number_1}</div>
                          {asset.asset_number_2 && <div className="text-[11px] text-gray-400 font-normal mt-0.5">(เลขเดิม: {asset.asset_number_2})</div>}
                        </td>
                        <td>{asset.name}</td>
                        <td className="max-w-[180px] truncate" title={asset.category}>{asset.category}</td>
                        <td className="text-sm whitespace-nowrap">{formatThaiDate(asset.acquired_date)}</td>
                        <td>฿{Number(asset.price).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>
                          <div className={`badge ${asset.status === 'ใช้งานปกติ' ? 'badge-success' : 'badge-warning'} text-white`}>
                            {asset.status}
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            {/* 💡 เหลือแค่ 2 ปุ่ม คือ ดูข้อมูล กับ ลบ */}
                            <button 
                              onClick={() => router.push(`/view/${asset.id}`)} 
                              className="btn btn-sm btn-ghost bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold"
                            >
                              👁️ ดูข้อมูล
                            </button>
                            
                            {hasPermission('delete_asset') && (
                              <button onClick={() => handleDelete(asset.id)} className="btn btn-error btn-sm text-white">ลบ</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredAssets.length === 0 && (
                      <tr><td colSpan={7} className="text-center py-8 text-gray-500">ไม่พบข้อมูลครุภัณฑ์ที่ค้นหา</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}