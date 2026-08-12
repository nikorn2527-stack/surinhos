'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const API_BASE = 'http://192.168.1.120:5000';

export default function Dashboard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token, hasPermission, handleForceLogout } = useAuth();

  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  const [org, setOrg] = useState({ prefix: '', orgName: 'Pacific Plus IT', logo: '' });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ทั้งหมด');

  useEffect(() => {
    if (!token) return;

    const headers = { 'Authorization': `Bearer ${token}` };

    fetch(`${API_BASE}/api/settings/organization`, { headers })
      .then(async res => {
        const data = await res.json();
        if (data?.forceLogout) return handleForceLogout(data.error);
        if (data && !data.error) setOrg(data);
      })
      .catch(err => console.error('Error fetching org:', err));

    fetch(`${API_BASE}/api/assets`, { headers })
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
  }, [token, handleForceLogout]);

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

    fetch(`${API_BASE}/api/assets/import`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    })
    .then(async res => {
      const data = await res.json();
      setIsImporting(false);
      if (data?.forceLogout) return handleForceLogout(data.error);
      if (data.error) alert('เกิดข้อผิดพลาด: ' + data.error);
      else { alert(data.message); window.location.reload(); }
    })
    .catch(() => {
      setIsImporting(false);
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    })
    .finally(() => {
      if (fileInputRef.current) fileInputRef.current.value = '';
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? (การดำเนินการนี้ไม่สามารถกู้คืนได้)')) {
      const res = await fetch(`${API_BASE}/api/assets/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data?.forceLogout) return handleForceLogout(data.error);
      window.location.reload(); 
    }
  };

  if (isLoading) return <div className="text-center mt-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
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

        {/* Action buttons row */}
        <div className="flex flex-wrap gap-2">
          {hasPermission('export_excel') && (
            <button onClick={exportToCSV} className="btn btn-sm btn-ghost text-success border-success/30">📄 ส่งออก Excel</button>
          )}
          {hasPermission('export_pdf') && (
            <button onClick={exportToPDF} className="btn btn-sm btn-ghost text-error border-error/30">📕 ส่งออก PDF</button>
          )}
          {hasPermission('import_asset') && (
            <>
              <input type="file" accept=".csv, .xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <button onClick={() => fileInputRef.current?.click()} className="btn btn-sm btn-ghost text-info border-info/30" disabled={isImporting}>
                {isImporting ? <span className="loading loading-spinner loading-xs"></span> : '📥 นำเข้าข้อมูล'}
              </button>
              <button onClick={downloadTemplate} className="btn btn-sm btn-ghost text-primary border-primary/30">📤 ฟอร์มนำเข้า</button>
            </>
          )}
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
    </div>
  );
}
