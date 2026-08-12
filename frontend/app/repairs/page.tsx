'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TicketDetail from './components/TicketDetail';
import AssetSearch from './components/AssetSearch';
import SignaturePad from './components/SignaturePad';

const API_BASE = 'http://192.168.1.120:5000';

// ==================== CONFIG ====================
const statusDot: Record<string, string> = {
  pending: 'bg-amber-400',
  accepted: 'bg-blue-400',
  in_progress: 'bg-violet-400',
  returned: 'bg-emerald-400',
  closed: 'bg-gray-400',
  cancelled: 'bg-red-400',
  disposed: 'bg-orange-400',
};

const statusLabel: Record<string, string> = {
  pending: 'รอรับเรื่อง',
  accepted: 'รับเรื่องแล้ว',
  in_progress: 'กำลังซ่อม',
  returned: 'ส่งคืนแล้ว',
  closed: 'ปิดงาน',
  cancelled: 'ยกเลิก',
  disposed: 'ตีแทงจำหน่าย',
};

const statusBg: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  accepted: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-violet-50 text-violet-700',
  returned: 'bg-emerald-50 text-emerald-700',
  closed: 'bg-gray-50 text-gray-700',
  cancelled: 'bg-red-50 text-red-700',
  disposed: 'bg-orange-50 text-orange-700',
};

function formatThaiDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatThaiTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

// ==================== MAIN PAGE ====================
export default function RepairsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // New repair form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newRepair, setNewRepair] = useState({ asset_name: '', problem_details: '', reporter_name: '' });
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [photoFiles, setPhotoFiles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  // ==================== FETCH ====================
  const fetchTickets = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    try {
      const res = await fetch(`${API_BASE}/api/repairs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error('Error fetching repairs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchTickets(); }, [fetchTickets, refreshTrigger]);

  // ==================== STATS ====================
  const stats = {
    total: tickets.length,
    pending: tickets.filter(t => t.status === 'pending').length,
    accepted: tickets.filter(t => t.status === 'accepted').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    returned: tickets.filter(t => t.status === 'returned').length,
    closed: tickets.filter(t => t.status === 'closed').length,
    cancelled: tickets.filter(t => t.status === 'cancelled').length,
    disposed: tickets.filter(t => t.status === 'disposed').length,
  };

  // ==================== FILTER ====================
  const filteredTickets = searchQuery
    ? tickets.filter(t =>
        t.ticketNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.assetName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        statusLabel[t.status]?.includes(searchQuery)
      )
    : tickets;

  // ==================== NEW REPAIR ====================
  const handleSubmitRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepair.asset_name || !newRepair.reporter_name) {
      alert('กรุณากรอกชื่ออุปกรณ์และชื่อผู้แจ้ง');
      return;
    }
    setIsSubmitting(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/repairs`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: selectedAsset?.id || null,
          asset_name: newRepair.asset_name,
          problem_details: newRepair.problem_details,
          reporter_name: newRepair.reporter_name,
          photos: photoFiles.length > 0 ? JSON.stringify(photoFiles) : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`✅ แจ้งซ่อมสำเร็จ! เลขที่: ${data.ticketNo}`);
        setShowNewForm(false);
        setNewRepair({ asset_name: '', problem_details: '', reporter_name: '' });
        setSelectedAsset(null);
        setPhotoFiles([]);
        setRefreshTrigger(p => p + 1);
        setSelectedTicketId(data.id);
      } else {
        const err = await res.json();
        alert(`❌ ${err.error || 'เกิดข้อผิดพลาด'}`);
      }
    } catch (err) {
      alert('❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setPhotoFiles(prev => [...prev, ev.target.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRefresh = useCallback(() => {
    setRefreshTrigger(p => p + 1);
  }, []);

  // ==================== RENDER ====================
  return (
    <div className="flex h-screen bg-gray-50">
      {/* ===== SIDEBAR ===== */}
      <aside className="w-full lg:w-[380px] bg-white border-r border-gray-100 flex flex-col h-screen shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div>
                <h1 className="text-lg font-bold flex items-center gap-2">🔧 ระบบแจ้งซ่อม</h1>
                <p className="text-xs text-gray-400">Repair Tracking System</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewForm(true)}
              className="btn btn-sm bg-emerald-600 text-white border-none hover:bg-emerald-700"
            >
              + แจ้งซ่อม
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-1 overflow-x-auto pb-2 no-scrollbar">
            {[
              { k: 'total', v: stats.total, label: 'ทั้งหมด', cls: 'bg-gray-100 text-gray-700' },
              { k: 'pending', v: stats.pending, label: 'รอ', cls: statusBg.pending },
              { k: 'accepted', v: stats.accepted, label: 'รับ', cls: statusBg.accepted },
              { k: 'inProgress', v: stats.inProgress, label: 'ซ่อม', cls: statusBg.in_progress },
              { k: 'returned', v: stats.returned, label: 'ส่ง', cls: statusBg.returned },
              { k: 'closed', v: stats.closed, label: 'ปิด', cls: statusBg.closed },
              { k: 'cancelled', v: stats.cancelled, label: 'ยก', cls: statusBg.cancelled },
              { k: 'disposed', v: stats.disposed, label: 'ตีแทง', cls: statusBg.disposed },
            ].filter(s => s.v > 0).map(s => (
              <div key={s.k} className={`flex flex-col items-center px-2.5 py-1 rounded-lg shrink-0 min-w-[38px] ${s.cls}`}>
                <span className="text-sm font-bold">{s.v}</span>
                <span className="text-[9px]">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative mt-2">
            <input
              type="text"
              placeholder="ค้นหาเลขที่, อุปกรณ์, สถานะ..."
              className="input input-bordered input-sm w-full pl-8 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          </div>
        </div>

        {/* Ticket List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm">ยังไม่มีรายการแจ้งซ่อม</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-l-3 ${
                    selectedTicketId === ticket.id ? 'border-l-emerald-500 bg-emerald-50/30' : 'border-l-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${statusDot[ticket.status] || 'bg-gray-400'}`} />
                    <span className="text-[13px] font-bold font-mono text-gray-800">{ticket.ticketNo}</span>
                    <span className="ml-auto text-[10px] text-gray-400">{formatThaiDate(ticket.createdAt)}</span>
                  </div>
                  <div className="pl-4">
                    <p className="text-[13px] text-gray-700 truncate">{ticket.assetName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {ticket.asset?.assetCode && (
                        <span className="text-[10px] text-gray-400 font-mono">{ticket.asset.assetCode}</span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusBg[ticket.status] || 'bg-gray-50 text-gray-500'}`}>
                        {statusLabel[ticket.status]}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 text-center text-[10px] text-gray-400 bg-white">
          🔧 Surinhos Repair Tracking · © {new Date().getFullYear()}
        </div>
      </aside>

      {/* ===== DETAIL PANEL ===== */}
      <main className="hidden lg:flex flex-1 flex-col h-screen overflow-hidden">
        {selectedTicketId ? (
          <>
            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
              <div className="">
                <TicketDetail
                  ticketId={selectedTicketId}
                  onClose={() => setSelectedTicketId(null)}
                  onUpdate={handleRefresh}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50/50">
            <div className="text-center text-gray-300">
              <p className="text-5xl mb-3">🔧</p>
              <p className="text-sm">เลือกรายการเพื่อดูรายละเอียด</p>
            </div>
          </div>
        )}
      </main>

      {/* ===== MOBILE DETAIL (full screen overlay) ===== */}
      {selectedTicketId && (
        <div className="lg:hidden fixed inset-0 z-50 bg-gray-50 overflow-y-auto">
          <div className="p-4">
            <TicketDetail
              ticketId={selectedTicketId}
              onClose={() => setSelectedTicketId(null)}
              onUpdate={handleRefresh}
            />
          </div>
        </div>
      )}

      {/* ===== NEW REPAIR MODAL ===== */}
      {showNewForm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={() => setShowNewForm(false)}>
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg">📝 ฟอร์มแจ้งซ่อมอุปกรณ์</h3>
            <form onSubmit={handleSubmitRepair} className="space-y-4 mt-4">
              {/* Asset Search */}
              <AssetSearch
                onSelect={(asset) => {
                  setSelectedAsset(asset);
                  setNewRepair(prev => ({ ...prev, asset_name: asset.name }));
                }}
                selectedAsset={selectedAsset}
                onClear={() => {
                  setSelectedAsset(null);
                  setNewRepair(prev => ({ ...prev, asset_name: '' }));
                }}
              />

              <div className="divider text-xs text-gray-400">หรือกรอกข้อมูลเอง</div>

              <div>
                <label className="label"><span className="label-text font-semibold">ชื่ออุปกรณ์ / สถานที่ *</span></label>
                <input type="text" required className="input input-bordered w-full" placeholder="เช่น คอมพิวเตอร์ห้อง 301..."
                  value={newRepair.asset_name} onChange={(e) => setNewRepair(prev => ({ ...prev, asset_name: e.target.value }))} />
              </div>

              <div>
                <label className="label"><span className="label-text font-semibold">รายละเอียดปัญหา</span></label>
                <textarea className="textarea textarea-bordered w-full" rows={3} placeholder="อธิบายปัญหาที่พบ..."
                  value={newRepair.problem_details} onChange={(e) => setNewRepair(prev => ({ ...prev, problem_details: e.target.value }))} />
              </div>

              <div>
                <label className="label"><span className="label-text font-semibold">ชื่อผู้แจ้งซ่อม *</span></label>
                <input type="text" required className="input input-bordered w-full" placeholder="ชื่อ-นามสกุล..."
                  value={newRepair.reporter_name} onChange={(e) => setNewRepair(prev => ({ ...prev, reporter_name: e.target.value }))} />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="label"><span className="label-text font-semibold">📷 รูปประกอบ (ถ่ายรูปอาการเสีย)</span></label>
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30 transition"
                  onClick={() => document.getElementById('repair-photo-input')?.click()}
                >
                  <input id="repair-photo-input" type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                  <p className="text-2xl mb-1">📷</p>
                  <p className="text-xs text-gray-500">คลิกเพื่อแนบรูป (รองรับหลายรูป)</p>
                </div>
                {photoFiles.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {photoFiles.map((src, i) => (
                      <div key={i} className="relative group">
                        <div className="w-16 h-16 rounded-md border border-gray-200 overflow-hidden">
                          <img src={src} alt={`รูปที่ ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setPhotoFiles(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" className="btn btn-ghost" onClick={() => setShowNewForm(false)}>ยกเลิก</button>
                <button type="submit" className="btn bg-emerald-600 text-white border-none hover:bg-emerald-700" disabled={isSubmitting}>
                  {isSubmitting ? <span className="loading loading-spinner loading-xs"></span> : '💾 บันทึกแจ้งซ่อม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
