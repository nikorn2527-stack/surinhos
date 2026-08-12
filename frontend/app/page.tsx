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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">จำนวนอุปกรณ์ทั้งหมด</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">{assets.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">มูลค่ารวม (บาท)</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">฿{totalValue.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">ใช้งานปกติ</p>
            <p className="text-3xl font-bold text-emerald-500 mt-1">{assets.filter(a => a.status === 'ใช้งานปกติ').length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400">ชำรุด / รอซ่อม</p>
            <p className="text-3xl font-bold text-amber-500 mt-1">{assets.filter(a => a.status === 'ชำรุดรอซ่อม').length}</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-4">📊 สรุปสถานะครุภัณฑ์</h3>
            <div className="space-y-3">
              {[
                { label: 'ใช้งานปกติ', count: assets.filter(a => a.status === 'ใช้งานปกติ').length, color: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
                { label: 'ชำรุดรอซ่อม', count: assets.filter(a => a.status === 'ชำรุดรอซ่อม').length, color: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/30' },
                { label: 'เสื่อมสภาพ/รอจำหน่าย', count: assets.filter(a => a.status === 'เสื่อมสภาพ/รอจำหน่าย').length, color: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-900/30' },
                { label: 'แทงจำหน่ายแล้ว', count: assets.filter(a => a.status === 'แทงจำหน่ายแล้ว').length, color: 'bg-gray-400', bg: 'bg-gray-50 dark:bg-gray-700' },
              ].map((item) => {
                const pct = assets.length > 0 ? (item.count / assets.length) * 100 : 0;
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">{item.label}</span>
                      <span className="text-gray-800 dark:text-gray-200 font-bold">{item.count} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className={`w-full h-3 rounded-full ${item.bg} overflow-hidden`}>
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-700 ease-out`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Distribution Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-4">📁 ครุภัณฑ์แยกตามหมวดหมู่</h3>
            <div className="space-y-2">
              {(() => {
                const catMap: Record<string, number> = {};
                assets.forEach(a => {
                  const cat = (a.category || 'ไม่ระบุ').split(' - ').pop() || 'ไม่ระบุ';
                  catMap[cat] = (catMap[cat] || 0) + 1;
                });
                const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
                const max = sorted[0]?.[1] || 1;
                const colors = ['bg-indigo-500', 'bg-blue-500', 'bg-cyan-500', 'bg-teal-500', 'bg-emerald-500', 'bg-gray-400'];
                return sorted.map(([cat, count], i) => (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400 font-medium truncate max-w-[70%]" title={cat}>{cat}</span>
                      <span className="text-gray-800 dark:text-gray-200 font-bold">{count}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors[i] || colors[colors.length - 1]} transition-all duration-700 ease-out`}
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                ));
              })()}
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

        <div className="flex flex-col sm:flex-row gap-4">
          <input 
            type="text" placeholder="ค้นหาจากรหัส หรือ รายการ..." className="input input-bordered w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select className="select select-bordered w-full sm:w-64 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="ทั้งหมด">สถานะทั้งหมด</option>
            <option value="ใช้งานปกติ">ใช้งานปกติ</option>
            <option value="ชำรุดรอซ่อม">ชำรุดรอซ่อม</option>
            <option value="เสื่อมสภาพ/รอจำหน่าย">เสื่อมสภาพ/รอจำหน่าย</option>
            <option value="แทงจำหน่ายแล้ว">แทงจำหน่ายแล้ว</option>
          </select>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="font-semibold">หมายเลขควบคุม</th>
                  <th className="font-semibold">ชื่อรายการ</th>
                  <th className="font-semibold hidden md:table-cell">หมวดหมู่</th>
                  <th className="font-semibold hidden lg:table-cell">วันที่ได้มา</th>
                  <th className="font-semibold">ราคา</th>
                  <th className="font-semibold">สถานะ</th>
                  <th className="font-semibold">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover dark:hover:bg-gray-700/50 border-t border-gray-50 dark:border-gray-700">
                      <td className="font-semibold">
                        <p className="dark:text-gray-200">{asset.asset_code}</p>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-normal">{asset.asset_number_1}</div>
                        {asset.asset_number_2 && <div className="text-[11px] text-gray-400 dark:text-gray-500 font-normal mt-0.5">(เลขเดิม: {asset.asset_number_2})</div>}
                      </td>
                      <td className="dark:text-gray-300">{asset.name}</td>
                      <td className="max-w-[180px] truncate hidden md:table-cell text-gray-500 dark:text-gray-400" title={asset.category}>{asset.category}</td>
                      <td className="text-sm whitespace-nowrap hidden lg:table-cell text-gray-500 dark:text-gray-400">{formatThaiDate(asset.acquired_date)}</td>
                      <td className="dark:text-gray-300 font-medium">฿{Number(asset.price).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>
                        <div className={`badge ${asset.status === 'ใช้งานปกติ' ? 'badge-success' : 'badge-warning'} text-white`">
                          {asset.status}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => router.push(`/view/${asset.id}`)} 
                            className="btn btn-sm btn-ghost bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 font-bold"
                          >
                            👁️
                          </button>
                          
                          {hasPermission('delete_asset') && (
                            <button onClick={() => handleDelete(asset.id)} className="btn btn-error btn-sm text-white">ลบ</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAssets.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">ไม่พบข้อมูลครุภัณฑ์ที่ค้นหา</td></tr>
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
