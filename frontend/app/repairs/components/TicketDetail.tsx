'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import SignaturePad, { type SignaturePadRef } from './SignaturePad';
import ThermalReceipt from './ThermalReceipt';

const API_BASE = 'http://192.168.1.120:5000';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending:     { label: 'รอรับเรื่อง',     color: '#d97706', bg: '#fef3c7', icon: '⏳' },
  accepted:    { label: 'รับเรื่องแล้ว',    color: '#2563eb', bg: '#dbeafe', icon: '✅' },
  in_progress: { label: 'กำลังซ่อม',       color: '#7c3aed', bg: '#ede9fe', icon: '🔧' },
  returned:    { label: 'ส่งคืนแล้ว',      color: '#059669', bg: '#d1fae5', icon: '📦' },
  closed:      { label: 'ปิดงาน',          color: '#6b7280', bg: '#f3f4f6', icon: '✔️' },
  cancelled:   { label: 'ยกเลิก',          color: '#dc2626', bg: '#fee2e2', icon: '❌' },
  disposed:    { label: 'ตีแทงจำหน่าย',    color: '#ea580c', bg: '#ffedd5', icon: '🗑️' },
};

const statusTimeline = ['pending', 'accepted', 'in_progress', 'returned', 'closed'];
const disposalStatusLabel: Record<string, string> = { pending_review: 'รอพิจารณา', approved: 'อนุมัติแล้ว', disposed: 'จำหน่ายแล้ว' };
const costStatusLabel: Record<string, string> = { pending: 'รออนุมัติ', approved: 'อนุมัติแล้ว', rejected: 'ไม่อนุมัติ' };

function fmtDate(d: string | null) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtMoney(n: number | null) {
  if (n == null) return '-';
  return `฿${Number(n).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// ==================== MODAL COMPONENT ====================
function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className={`relative bg-white rounded-2xl shadow-2xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto p-6`} onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
interface Props { ticketId: number; onClose: () => void; onUpdate: () => void; }

export default function TicketDetail({ ticketId, onClose, onUpdate }: Props) {
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  // Modal states
  const [mAccept, setMAccept] = useState(false);
  const [mEstimate, setMEstimate] = useState(false);
  const [mReturn, setMReturn] = useState(false);
  const [mCancel, setMCancel] = useState(false);
  const [mDisposal, setMDisposal] = useState(false);
  const [mReceipt, setMReceipt] = useState(false);

  // Form states
  const [acceptName, setAcceptName] = useState('');
  const [estRepair, setEstRepair] = useState('');
  const [estLabor, setEstLabor] = useState('');
  const [estStatus, setEstStatus] = useState('pending');
  const [retMethod, setRetMethod] = useState('');
  const [retName, setRetName] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [dispReason, setDispReason] = useState('');
  const [dispMethod, setDispMethod] = useState('');
  const [dispValue, setDispValue] = useState('');
  const [dispApprover, setDispApprover] = useState('');
  const [dispComRef, setDispComRef] = useState('');
  const [printType, setPrintType] = useState<'repair' | 'return'>('repair');

  const recvSigRef = useRef<SignaturePadRef>(null);
  const retSendSigRef = useRef<SignaturePadRef>(null);
  const retRecvSigRef = useRef<SignaturePadRef>(null);

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  const fetchTicket = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/repairs/${ticketId}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setTicket(await res.json());
    } catch (e) { // ignore } finally { setLoading(false); }
  }, [ticketId]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  const act = async (ep: string, body?: any) => {
    setActing(true);
    try {
      const res = await fetch(`${API_BASE}/api/repairs/${ticketId}/${ep}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.ok) { setTicket(await res.json()); onUpdate(); return true; }
      const err = await res.json(); alert(`❌ ${err.error || 'Error'}`); return false;
    } catch (e) { alert('❌ Connection error'); return false; }
    finally { setActing(false); }
  };

  // Handlers
  const hAccept = async () => {
    if (!acceptName.trim()) return alert('กรุณาระบุชื่อผู้รับเรื่อง');
    if (await act('accept', { received_by: acceptName.trim(), receiver_signature: recvSigRef.current?.toDataURL() || null })) {
      setMAccept(false); setAcceptName('');
    }
  };
  const hStartRepair = async () => { if (confirm('ยืนยันเริ่มซ่อม?')) await act('progress'); };
  const hEstimate = async () => {
    const rc = parseFloat(estRepair), lc = parseFloat(estLabor);
    if (isNaN(rc) || isNaN(lc)) return alert('กรุณาระบุค่าอะไหล่และค่าแรง');
    if (await act('estimate', { repair_cost: rc, labor_cost: lc, cost_status: estStatus })) {
      setMEstimate(false); setEstRepair(''); setEstLabor('');
    }
  };
  const hReturn = async () => {
    if (!retMethod) return alert('เลือกวิธีส่งคืน');
    if (!retName.trim()) return alert('กรุณาระบุชื่อผู้ส่งคืน');
    if (await act('return', { return_method: retMethod, returned_by: retName.trim(), return_sender_signature: retSendSigRef.current?.toDataURL() || null, return_receiver_signature: retRecvSigRef.current?.toDataURL() || null })) {
      setMReturn(false); setRetMethod(''); setRetName('');
    }
  };
  const hClose = async () => { if (confirm('ยืนยันปิดงาน?')) await act('close'); };
  const hCancel = async () => {
    if (!cancelReason.trim()) return alert('กรุณาระบุเหตุผล');
    if (await act('cancel', { cancel_reason: cancelReason.trim() })) { setMCancel(false); setCancelReason(''); }
  };
  const hDisposal = async () => {
    if (!dispReason.trim() || !dispMethod) return alert('กรุณาระบุเหตุผลและวิธีจำหน่าย');
    if (await act('disposal', { disposal_reason: dispReason.trim(), disposal_method: dispMethod, disposal_value: dispValue ? parseFloat(dispValue) : null, disposal_approved_by: dispApprover.trim() || null, disposal_com_ref: dispComRef.trim() || null })) {
      setMDisposal(false); setDispReason(''); setDispMethod(''); setDispValue(''); setDispApprover(''); setDispComRef('');
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  if (!ticket) return <div className="text-center py-20 text-gray-500"><p>ไม่พบข้อมูล</p><button onClick={onClose} className="btn btn-ghost btn-sm mt-4">← กลับ</button></div>;

  const cfg = statusConfig[ticket.status] || statusConfig.pending;
  const ti = statusTimeline.indexOf(ticket.status);

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="btn btn-circle btn-ghost btn-sm bg-white shadow-sm lg:hidden">←</button>
          <div><h2 className="text-xl font-bold">{ticket.ticketNo}</h2><p className="text-xs text-gray-500">{fmtDate(ticket.createdAt)}</p></div>
        </div>
        <span className="badge badge-lg font-bold" style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>{cfg.icon} {cfg.label}</span>
      </div>

      {/* CANCEL REASON */}
      {ticket.status === 'cancelled' && ticket.cancelReason && <div className="alert alert-error text-white"><span>❌ เหตุผล: {ticket.cancelReason}</span></div>}

      {/* INFO */}
      <div className="card bg-white shadow-sm border border-gray-100"><div className="card-body p-4">
        <h3 className="font-bold text-sm text-gray-500 mb-3">📋 ข้อมูลใบแจ้งซ่อม</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">อุปกรณ์:</span><span className="ml-2 font-semibold">{ticket.assetName}</span></div>
          {ticket.asset?.assetCode && <div><span className="text-gray-500">รหัส:</span><span className="ml-2 font-mono text-indigo-600">{ticket.asset.assetCode}</span></div>}
          {ticket.asset?.location && <div><span className="text-gray-500">สถานที่:</span><span className="ml-2">📍 {ticket.asset.location.buildingName} {ticket.asset.location.roomName}</span></div>}
          <div className="sm:col-span-2"><span className="text-gray-500">ปัญหา:</span><span className="ml-2">{ticket.problemDetails || '-'}</span></div>
          <div><span className="text-gray-500">ผู้แจ้ง:</span><span className="ml-2 font-medium">👤 {ticket.reporterName || '-'}</span></div>
        </div>
      </div></div>

      {/* PHOTOS */}
      {(() => { let p: string[] = []; try { p = ticket.photos ? JSON.parse(ticket.photos) : []; } catch (e) { // ignore } return p.length > 0 ? (
        <div className="card bg-white shadow-sm border border-gray-100"><div className="card-body p-4">
          <h3 className="font-bold text-sm text-gray-500 mb-3">📷 รูป ({p.length})</h3>
          <div className="flex gap-2 flex-wrap">{p.map((s, i) => <div key={i} className="w-20 h-20 rounded-lg border overflow-hidden"><img src={s} className="w-full h-full object-cover" /></div>)}</div>
        </div></div>
      ) : null; })()}

      {/* ACCEPTANCE */}
      {ticket.receivedBy && <div className="card bg-white shadow-sm border border-blue-100"><div className="card-body p-4">
        <h3 className="font-bold text-sm text-blue-600 mb-3">🔧 รับเรื่อง</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">ผู้รับ:</span><span className="ml-2 font-medium">{ticket.receivedBy}</span></div>
          <div><span className="text-gray-500">วันที่:</span><span className="ml-2">{fmtDate(ticket.receivedAt)}</span></div>
        </div>
        {ticket.receiverSignature && <div className="mt-2"><span className="text-xs text-gray-500">ลายเซ็น:</span><img src={ticket.receiverSignature} className="h-16 mt-1 rounded border bg-white object-contain p-1" /></div>}
      </div></div>}

      {/* COST */}
      {(ticket.repairCost != null || ticket.costStatus) && <div className="card bg-white shadow-sm border border-yellow-100"><div className="card-body p-4">
        <h3 className="font-bold text-sm text-yellow-700 mb-3">💰 ค่าใช้จ่าย</h3>
        {ticket.costStatus && <div className="mb-2"><span className="badge badge-sm" style={{ backgroundColor: ticket.costStatus === 'approved' ? '#d1fae5' : ticket.costStatus === 'rejected' ? '#fee2e2' : '#fef3c7', color: ticket.costStatus === 'approved' ? '#059669' : ticket.costStatus === 'rejected' ? '#dc2626' : '#d97706' }}>{costStatusLabel[ticket.costStatus]}</span></div>}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-50 rounded-lg p-2"><div className="text-xs text-gray-500">อะไหล่</div><div className="font-bold">{fmtMoney(ticket.repairCost)}</div></div>
          <div className="bg-gray-50 rounded-lg p-2"><div className="text-xs text-gray-500">แรง</div><div className="font-bold">{fmtMoney(ticket.laborCost)}</div></div>
          <div className="bg-indigo-50 rounded-lg p-2"><div className="text-xs text-indigo-600">รวม</div><div className="font-bold text-indigo-700">{fmtMoney(ticket.totalCost)}</div></div>
        </div>
      </div></div>}

      {/* RETURN */}
      {ticket.returnedBy && <div className="card bg-white shadow-sm border border-green-100"><div className="card-body p-4">
        <h3 className="font-bold text-sm text-green-700 mb-3">📦 ส่งคืน</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">วิธี:</span><span className="ml-2">{ticket.returnMethod}</span></div>
          <div><span className="text-gray-500">ผู้ส่งคืน:</span><span className="ml-2 font-medium">{ticket.returnedBy}</span></div>
          <div><span className="text-gray-500">วันที่:</span><span className="ml-2">{fmtDate(ticket.returnedAt)}</span></div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {ticket.returnSenderSignature && <div><span className="text-xs text-gray-500">ลายเซ็นผู้ส่ง:</span><img src={ticket.returnSenderSignature} className="h-14 mt-1 rounded border bg-white object-contain p-1" /></div>}
          {ticket.returnReceiverSignature && <div><span className="text-xs text-gray-500">ลายเซ็นผู้รับ:</span><img src={ticket.returnReceiverSignature} className="h-14 mt-1 rounded border bg-white object-contain p-1" /></div>}
        </div>
      </div></div>}

      {/* DISPOSAL */}
      {ticket.disposalStatus && <div className="card bg-white shadow-sm border border-orange-200"><div className="card-body p-4">
        <h3 className="font-bold text-sm text-orange-700 mb-3">🗑️ ตีแทงจำหน่าย</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div><span className="text-gray-500">สถานะ:</span><span className="ml-2 font-medium text-orange-700">{disposalStatusLabel[ticket.disposalStatus]}</span></div>
          {ticket.disposalMethod && <div><span className="text-gray-500">วิธี:</span><span className="ml-2">{ticket.disposalMethod}</span></div>}
          {ticket.disposalValue != null && <div><span className="text-gray-500">ราคา:</span><span className="ml-2 font-medium">{fmtMoney(ticket.disposalValue)}</span></div>}
          {ticket.disposalReason && <div className="sm:col-span-2"><span className="text-gray-500">เหตุผล:</span><span className="ml-2">{ticket.disposalReason}</span></div>}
        </div>
      </div></div>}

      {/* TIMELINE */}
      <div className="card bg-white shadow-sm border border-gray-100"><div className="card-body p-4">
        <h3 className="font-bold text-sm text-gray-500 mb-4">📊 สถานะ</h3>
        <div className="flex items-center justify-between">
          {statusTimeline.map((step, idx) => {
            const sc = statusConfig[step];
            const done = ticket.status !== 'cancelled' && ticket.status !== 'disposed' && idx <= ti;
            const curr = ticket.status !== 'cancelled' && ticket.status !== 'disposed' && idx === ti;
            return (
              <div key={step} className="flex flex-1 items-center">
                {idx > 0 && <div className={`h-0.5 flex-1 ${done ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
                <div className="flex flex-col items-center mx-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 ${curr ? 'border-indigo-500 bg-indigo-500 text-white' : done ? 'border-emerald-400 bg-emerald-50 text-emerald-600' : 'border-gray-200 bg-gray-50 text-gray-400'}`}>{done && !curr ? '✓' : sc.icon}</div>
                  <span className={`text-[10px] mt-1 text-center font-medium ${curr ? 'text-indigo-600' : done ? 'text-emerald-600' : 'text-gray-400'}`}>{sc.label}</span>
                </div>
                {idx < statusTimeline.length - 1 && <div className={`h-0.5 flex-1 ${idx < ti ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
              </div>
            );
          })}
        </div>
      </div></div>

      {/* ACTIONS */}
      {ticket.status !== 'cancelled' && ticket.status !== 'closed' && ticket.status !== 'disposed' && <div className="card bg-white shadow-sm border border-gray-100"><div className="card-body p-4">
        <h3 className="font-bold text-sm text-gray-500 mb-3">⚡ การดำเนินการ</h3>
        <div className="flex flex-wrap gap-2">
          {ticket.status === 'pending' && <button onClick={() => setMAccept(true)} className="btn btn-sm bg-emerald-600 text-white border-none hover:bg-emerald-700" disabled={acting}>✅ รับเรื่อง</button>}
          {ticket.status === 'accepted' && <>
            <button onClick={hStartRepair} className="btn btn-sm bg-violet-600 text-white border-none hover:bg-violet-700" disabled={acting}>🔧 เริ่มซ่อม</button>
            <button onClick={() => { setPrintType('repair'); setMReceipt(true); }} className="btn btn-sm btn-ghost border-gray-300">🖨️ ปริ้น</button>
            <button onClick={() => setMCancel(true)} className="btn btn-sm btn-error btn-outline" disabled={acting}>❌ ยกเลิก</button>
            <button onClick={() => setMDisposal(true)} className="btn btn-sm btn-outline border-orange-300 text-orange-600" disabled={acting}>🗑️ ตีแทง</button>
          </>}
          {ticket.status === 'in_progress' && <>
            <button onClick={() => setMEstimate(true)} className="btn btn-sm bg-yellow-600 text-white border-none hover:bg-yellow-700" disabled={acting}>💰 เสนอราคา</button>
            <button onClick={() => setMReturn(true)} className="btn btn-sm bg-emerald-600 text-white border-none hover:bg-emerald-700" disabled={acting}>📦 ส่งคืน</button>
            <button onClick={() => setMCancel(true)} className="btn btn-sm btn-error btn-outline" disabled={acting}>❌ ยกเลิก</button>
            <button onClick={() => setMDisposal(true)} className="btn btn-sm btn-outline border-orange-300 text-orange-600" disabled={acting}>🗑️ ตีแทง</button>
          </>}
          {ticket.status === 'returned' && <>
            <button onClick={hClose} className="btn btn-sm bg-gray-700 text-white border-none hover:bg-gray-800" disabled={acting}>✔️ ปิดงาน</button>
            <button onClick={() => { setPrintType('return'); setMReceipt(true); }} className="btn btn-sm btn-ghost border-gray-300">🖨️ ใบส่งคืน</button>
            <button onClick={() => { setPrintType('repair'); setMReceipt(true); }} className="btn btn-sm btn-ghost border-gray-300">🖨️ ใบรับซ่อม</button>
          </>}
        </div>
      </div></div>}

      {ticket.status === 'closed' && <div className="card bg-white shadow-sm border border-gray-100"><div className="card-body p-4">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setPrintType('repair'); setMReceipt(true); }} className="btn btn-sm btn-ghost border-gray-300">🖨️ ใบรับซ่อม</button>
          <button onClick={() => { setPrintType('return'); setMReceipt(true); }} className="btn btn-sm btn-ghost border-gray-300">🖨️ ใบส่งคืน</button>
        </div>
      </div></div>}

      {/* ===== MODALS ===== */}

      {/* ACCEPT */}
      <Modal open={mAccept} onClose={() => setMAccept(false)} title="🔧 รับเรื่องแจ้งซ่อม">
        <div className="space-y-4">
          <div><label className="label"><span className="label-text font-semibold">ชื่อผู้รับเรื่อง *</span></label>
          <input type="text" className="input input-bordered w-full" placeholder="ระบุชื่อ" value={acceptName} onChange={e => setAcceptName(e.target.value)} /></div>
          <SignaturePad ref={recvSigRef} title="ลายเซ็นผู้รับ" />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button className="btn btn-ghost" onClick={() => setMAccept(false)}>ยกเลิก</button>
            <button className="btn bg-emerald-600 text-white border-none hover:bg-emerald-700" onClick={hAccept} disabled={acting}>{acting && <span className="loading loading-spinner loading-xs"></span>}ยืนยันรับเรื่อง</button>
          </div>
        </div>
      </Modal>

      {/* ESTIMATE */}
      <Modal open={mEstimate} onClose={() => setMEstimate(false)} title="💰 เสนอราคาซ่อม">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label"><span className="label-text font-semibold">ค่าอะไหล่ *</span></label><input type="number" min="0" step="0.01" className="input input-bordered w-full" placeholder="0.00" value={estRepair} onChange={e => setEstRepair(e.target.value)} /></div>
            <div><label className="label"><span className="label-text font-semibold">ค่าแรง *</span></label><input type="number" min="0" step="0.01" className="input input-bordered w-full" placeholder="0.00" value={estLabor} onChange={e => setEstLabor(e.target.value)} /></div>
          </div>
          <div className="bg-indigo-50 rounded-lg p-3 text-center"><div className="text-xs text-indigo-600">รวม</div><div className="text-xl font-bold text-indigo-700">{fmtMoney((parseFloat(estRepair) || 0) + (parseFloat(estLabor) || 0))}</div></div>
          <div><label className="label"><span className="label-text font-semibold">สถานะอนุมัติ *</span></label>
          <select className="select select-bordered w-full" value={estStatus} onChange={e => setEstStatus(e.target.value)}><option value="pending">รออนุมัติ</option><option value="approved">อนุมัติ</option><option value="rejected">ไม่อนุมัติ</option></select>
          {estStatus === 'rejected' && <p className="text-xs text-red-500 mt-1">⚠️ ไม่อนุมัติ = ยกเลิกใบแจ้งซ่อมอัตโนมัติ</p>}</div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button className="btn btn-ghost" onClick={() => setMEstimate(false)}>ยกเลิก</button>
            <button className="btn bg-yellow-600 text-white border-none hover:bg-yellow-700" onClick={hEstimate} disabled={acting}>{acting && <span className="loading loading-spinner loading-xs"></span>}บันทึก</button>
          </div>
        </div>
      </Modal>

      {/* RETURN */}
      <Modal open={mReturn} onClose={() => setMReturn(false)} title="📦 ส่งคืนครุภัณฑ์">
        <div className="space-y-4">
          <div><label className="label"><span className="label-text font-semibold">วิธีส่งคืน *</span></label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setRetMethod('หน่วยงานมารับเอง')} className={`btn btn-sm ${retMethod === 'หน่วยงานมารับเอง' ? 'bg-indigo-600 text-white' : 'btn-outline'}`}>🏢 มารับเอง</button>
            <button type="button" onClick={() => setRetMethod('ช่างไปส่งคืน')} className={`btn btn-sm ${retMethod === 'ช่างไปส่งคืน' ? 'bg-indigo-600 text-white' : 'btn-outline'}`}>🚗 ไปส่งคืน</button>
          </div></div>
          <div><label className="label"><span className="label-text font-semibold">ชื่อผู้ส่งคืน *</span></label><input type="text" className="input input-bordered w-full" placeholder="ชื่อ" value={retName} onChange={e => setRetName(e.target.value)} /></div>
          <div className="divider my-2"></div>
          <SignaturePad ref={retSendSigRef} title="ลายเซ็นผู้ส่ง" />
          <SignaturePad ref={retRecvSigRef} title="ลายเซ็นผู้รับคืน" />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button className="btn btn-ghost" onClick={() => setMReturn(false)}>ยกเลิก</button>
            <button className="btn bg-emerald-600 text-white border-none hover:bg-emerald-700" onClick={hReturn} disabled={acting}>{acting && <span className="loading loading-spinner loading-xs"></span>}ยืนยันส่งคืน</button>
          </div>
        </div>
      </Modal>

      {/* CANCEL */}
      <Modal open={mCancel} onClose={() => setMCancel(false)} title="❌ ยกเลิกใบแจ้งซ่อม">
        <div className="space-y-4">
          <div><label className="label"><span className="label-text font-semibold">เหตุผล *</span></label><textarea className="textarea textarea-bordered w-full" rows={3} placeholder="เช่น อะไหล่หายาก" value={cancelReason} onChange={e => setCancelReason(e.target.value)} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button className="btn btn-ghost" onClick={() => setMCancel(false)}>ยกเลิก</button>
            <button className="btn btn-error text-white" onClick={hCancel} disabled={acting}>{acting && <span className="loading loading-spinner loading-xs"></span>}ยืนยันยกเลิก</button>
          </div>
        </div>
      </Modal>

      {/* DISPOSAL */}
      <Modal open={mDisposal} onClose={() => setMDisposal(false)} title="🗑️ ตีแทงจำหน่าย">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{ticket.ticketNo} — {ticket.assetName}</p>
          <div><label className="label"><span className="label-text font-semibold">เหตุผล *</span></label><textarea className="textarea textarea-bordered w-full" rows={2} placeholder="เช่น อะไหล่หมดสต็อก" value={dispReason} onChange={e => setDispReason(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label"><span className="label-text font-semibold">วิธีจำหน่าย *</span></label><select className="select select-bordered w-full" value={dispMethod} onChange={e => setDispMethod(e.target.value)}><option value="">-- เลือก --</option><option value="จำหน่าย/ชำระ">จำหน่าย/ชำระ</option><option value="ทำลาย">ทำลาย</option><option value="บริจาค">บริจาค</option></select></div>
            <div><label className="label"><span className="label-text font-semibold">ราคาประเมิน</span></label><input type="number" className="input input-bordered w-full" placeholder="0.00" value={dispValue} onChange={e => setDispValue(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label"><span className="label-text font-semibold">ผู้อนุมัติ</span></label><input type="text" className="input input-bordered w-full" placeholder="ชื่อ" value={dispApprover} onChange={e => setDispApprover(e.target.value)} /></div>
            <div><label className="label"><span className="label-text font-semibold">หนังสือ ครม.</span></label><input type="text" className="input input-bordered w-full" placeholder="ครม.ที่ 1/2569" value={dispComRef} onChange={e => setDispComRef(e.target.value)} /></div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button className="btn btn-ghost" onClick={() => setMDisposal(false)}>ยกเลิก</button>
            <button className="btn bg-orange-600 text-white border-none hover:bg-orange-700" onClick={hDisposal} disabled={acting}>{acting && <span className="loading loading-spinner loading-xs"></span>}บันทึกตีแทง</button>
          </div>
        </div>
      </Modal>

      {/* RECEIPT */}
      <Modal open={mReceipt} onClose={() => setMReceipt(false)} title={`🖨️ ${printType === 'return' ? 'ใบส่งคืน' : 'ใบรับซ่อม'}`} maxWidth="max-w-sm">
        <div className="flex justify-center"><ThermalReceipt ticket={ticket} type={printType} /></div>
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <button className="btn btn-ghost btn-sm" onClick={() => setMReceipt(false)}>ปิด</button>
          <button className="btn btn-sm bg-indigo-600 text-white border-none" onClick={() => { setMReceipt(false); setTimeout(() => window.print(), 300); }}>🖨️ ปริ้น</button>
        </div>
      </Modal>

      <style jsx global>{`@media print { body * { visibility: hidden; } .thermal-receipt, .thermal-receipt * { visibility: visible; } .thermal-receipt { position: absolute; left: 0; top: 0; } }`}</style>
    </div>
  );
}
