'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import SignaturePad, { type SignaturePadRef } from './SignaturePad';
import ThermalReceipt from './ThermalReceipt';

const API_BASE = 'http://192.168.1.120:5000';

// ==================== CONFIG ====================
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

const disposalStatusLabel: Record<string, string> = {
  pending_review: 'รอพิจารณา',
  approved: 'อนุมัติแล้ว',
  disposed: 'จำหน่ายแล้ว',
};

const costStatusLabel: Record<string, string> = {
  pending: 'รออนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ไม่อนุมัติ',
};

function formatThaiDate(dateStr: string | null) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(amount: number | null) {
  if (amount == null) return '-';
  return `฿${Number(amount).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// ==================== PROPS ====================
interface TicketDetailProps {
  ticketId: number;
  onClose: () => void;
  onUpdate: () => void;
}

export default function TicketDetail({ ticketId, onClose, onUpdate }: TicketDetailProps) {
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDisposalModal, setShowDisposalModal] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [printType, setPrintType] = useState<'repair' | 'return'>('repair');

  // Form states
  const [acceptReceiver, setAcceptReceiver] = useState('');
  const [estRepairCost, setEstRepairCost] = useState('');
  const [estLaborCost, setEstLaborCost] = useState('');
  const [estCostStatus, setEstCostStatus] = useState('pending');
  const [returnMethod, setReturnMethod] = useState('');
  const [returnedBy, setReturnedBy] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [disposalReason, setDisposalReason] = useState('');
  const [disposalMethod, setDisposalMethod] = useState('');
  const [disposalValue, setDisposalValue] = useState('');
  const [disposalApprovedBy, setDisposalApprovedBy] = useState('');
  const [disposalComRef, setDisposalComRef] = useState('');

  // Refs
  const receiverSigRef = useRef<SignaturePadRef>(null);
  const returnSenderSigRef = useRef<SignaturePadRef>(null);
  const returnReceiverSigRef = useRef<SignaturePadRef>(null);

  // Loading states
  const [actionLoading, setActionLoading] = useState(false);

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  const fetchTicket = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/repairs/${ticketId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTicket(data);
      }
    } catch (err) {
      console.error('Error fetching ticket:', err);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  // ==================== ACTIONS ====================
  const doAction = async (endpoint: string, method: string, body?: any) => {
    setActionLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/repairs/${ticketId}/${endpoint}`, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.ok) {
        const data = await res.json();
        setTicket(data);
        onUpdate();
        return true;
      } else {
        const err = await res.json();
        alert(`❌ ${err.error || 'เกิดข้อผิดพลาด'}`);
        return false;
      }
    } catch (err) {
      alert('❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!acceptReceiver.trim()) return alert('กรุณาระบุชื่อผู้รับเรื่อง');
    const sig = receiverSigRef.current?.toDataURL() || null;
    const ok = await doAction('accept', 'PUT', { received_by: acceptReceiver.trim(), receiver_signature: sig });
    if (ok) { setShowAcceptModal(false); setAcceptReceiver(''); }
  };

  const handleStartRepair = async () => {
    if (!confirm('ยืนยันเริ่มซ่อม?')) return;
    await doAction('progress', 'PUT');
  };

  const handleEstimate = async () => {
    const rc = parseFloat(estRepairCost);
    const lc = parseFloat(estLaborCost);
    if (isNaN(rc) || isNaN(lc)) return alert('กรุณาระบุค่าอะไหล่และค่าแรงให้ถูกต้อง');
    const ok = await doAction('estimate', 'PUT', { repair_cost: rc, labor_cost: lc, cost_status: estCostStatus });
    if (ok) { setShowEstimateModal(false); setEstRepairCost(''); setEstLaborCost(''); }
  };

  const handleReturn = async () => {
    if (!returnMethod) return alert('กรุณาเลือกวิธีส่งคืน');
    if (!returnedBy.trim()) return alert('กรุณาระบุชื่อผู้ส่งคืน');
    const senderSig = returnSenderSigRef.current?.toDataURL() || null;
    const receiverSig = returnReceiverSigRef.current?.toDataURL() || null;
    const ok = await doAction('return', 'PUT', {
      return_method: returnMethod, returned_by: returnedBy.trim(),
      return_sender_signature: senderSig, return_receiver_signature: receiverSig,
    });
    if (ok) { setShowReturnModal(false); setReturnMethod(''); setReturnedBy(''); }
  };

  const handleClose = async () => {
    if (!confirm('ยืนยันปิดงานซ่อม?')) return;
    await doAction('close', 'PUT');
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return alert('กรุณาระบุเหตุผลการยกเลิก');
    const ok = await doAction('cancel', 'PUT', { cancel_reason: cancelReason.trim() });
    if (ok) { setShowCancelModal(false); setCancelReason(''); }
  };

  const handleDisposal = async () => {
    if (!disposalReason.trim() || !disposalMethod) return alert('กรุณาระบุเหตุผลและวิธีจำหน่าย');
    const ok = await doAction('disposal', 'PUT', {
      disposal_reason: disposalReason.trim(), disposal_method: disposalMethod,
      disposal_value: disposalValue ? parseFloat(disposalValue) : null,
      disposal_approved_by: disposalApprovedBy.trim() || null,
      disposal_com_ref: disposalComRef.trim() || null,
    });
    if (ok) {
      setShowDisposalModal(false);
      setDisposalReason(''); setDisposalMethod(''); setDisposalValue('');
      setDisposalApprovedBy(''); setDisposalComRef('');
    }
  };

  const handlePrint = (type: 'repair' | 'return') => {
    setPrintType(type);
    setShowReceiptPreview(true);
  };

  // ==================== RENDER ====================
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>ไม่พบข้อมูลใบแจ้งซ่อม</p>
        <button onClick={onClose} className="btn btn-ghost btn-sm mt-4">← กลับ</button>
      </div>
    );
  }

  const cfg = statusConfig[ticket.status] || statusConfig.pending;
  const timelineIndex = statusTimeline.indexOf(ticket.status);

  return (
    <div className="space-y-4">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="btn btn-circle btn-ghost btn-sm bg-white shadow-sm lg:hidden">
            ←
          </button>
          <div>
            <h2 className="text-xl font-bold">{ticket.ticketNo}</h2>
            <p className="text-xs text-gray-500">{formatThaiDate(ticket.createdAt)}</p>
          </div>
        </div>
        <span className="badge badge-lg font-bold" style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {/* ===== CANCEL REASON ===== */}
      {ticket.status === 'cancelled' && ticket.cancelReason && (
        <div className="alert alert-error text-white">
          <span>❌ เหตุผลการยกเลิก: {ticket.cancelReason}</span>
        </div>
      )}

      {/* ===== INFO CARD ===== */}
      <div className="card bg-white shadow-sm border border-gray-100">
        <div className="card-body p-4">
          <h3 className="font-bold text-sm text-gray-500 mb-3">📋 ข้อมูลใบแจ้งซ่อม</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">อุปกรณ์:</span>
              <span className="ml-2 font-semibold">{ticket.assetName}</span>
            </div>
            {ticket.asset?.assetCode && (
              <div>
                <span className="text-gray-500">รหัสครุภัณฑ์:</span>
                <span className="ml-2 font-mono text-indigo-600">{ticket.asset.assetCode}</span>
              </div>
            )}
            {ticket.asset?.category && (
              <div>
                <span className="text-gray-500">หมวดหมู่:</span>
                <span className="ml-2">{ticket.asset.category}</span>
              </div>
            )}
            {ticket.asset?.location && (
              <div>
                <span className="text-gray-500">สถานที่:</span>
                <span className="ml-2">📍 {ticket.asset.location.buildingName} {ticket.asset.location.roomName}</span>
              </div>
            )}
            <div className="sm:col-span-2">
              <span className="text-gray-500">ปัญหา:</span>
              <span className="ml-2">{ticket.problemDetails || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">ผู้แจ้ง:</span>
              <span className="ml-2 font-medium">👤 {ticket.reporterName || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== PHOTOS ===== */}
      {(() => {
        let photos: string[] = [];
        try { photos = ticket.photos ? JSON.parse(ticket.photos) : []; } catch { photos = []; }
        if (photos.length === 0) return null;
        return (
          <div className="card bg-white shadow-sm border border-gray-100">
            <div className="card-body p-4">
              <h3 className="font-bold text-sm text-gray-500 mb-3">📷 รูปประกอบ ({photos.length} รูป)</h3>
              <div className="flex gap-2 flex-wrap">
                {photos.map((src, i) => (
                  <div key={i} className="w-20 h-20 rounded-lg border border-gray-200 overflow-hidden">
                    <img src={src} alt={`รูปที่ ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===== ACCEPTANCE INFO ===== */}
      {ticket.receivedBy && (
        <div className="card bg-white shadow-sm border border-blue-100">
          <div className="card-body p-4">
            <h3 className="font-bold text-sm text-blue-600 mb-3">🔧 ข้อมูลการรับเรื่อง</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">ผู้รับเรื่อง:</span>
                <span className="ml-2 font-medium">{ticket.receivedBy}</span>
              </div>
              <div>
                <span className="text-gray-500">วันที่รับ:</span>
                <span className="ml-2">{formatThaiDate(ticket.receivedAt)}</span>
              </div>
            </div>
            {ticket.receiverSignature && (
              <div className="mt-2">
                <span className="text-xs text-gray-500">ลายเซ็นผู้รับ:</span>
                <img src={ticket.receiverSignature} alt="ลายเซ็น" className="h-16 mt-1 rounded border bg-white object-contain p-1" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== COST ESTIMATE ===== */}
      {(ticket.repairCost != null || ticket.costStatus) && (
        <div className="card bg-white shadow-sm border border-yellow-100">
          <div className="card-body p-4">
            <h3 className="font-bold text-sm text-yellow-700 mb-3">💰 ข้อมูลค่าใช้จ่าย</h3>
            {ticket.costStatus && (
              <div className="mb-2">
                <span className="badge badge-sm" style={{
                  backgroundColor: ticket.costStatus === 'approved' ? '#d1fae5' : ticket.costStatus === 'rejected' ? '#fee2e2' : '#fef3c7',
                  color: ticket.costStatus === 'approved' ? '#059669' : ticket.costStatus === 'rejected' ? '#dc2626' : '#d97706',
                }}>
                  {costStatusLabel[ticket.costStatus]}
                </span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-xs text-gray-500">ค่าอะไหล่</div>
                <div className="font-bold">{formatCurrency(ticket.repairCost)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-xs text-gray-500">ค่าแรง</div>
                <div className="font-bold">{formatCurrency(ticket.laborCost)}</div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-2">
                <div className="text-xs text-indigo-600">รวม</div>
                <div className="font-bold text-indigo-700">{formatCurrency(ticket.totalCost)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== RETURN INFO ===== */}
      {ticket.returnedBy && (
        <div className="card bg-white shadow-sm border border-green-100">
          <div className="card-body p-4">
            <h3 className="font-bold text-sm text-green-700 mb-3">📦 ข้อมูลการส่งคืน</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">วิธีส่งคืน:</span><span className="ml-2">{ticket.returnMethod}</span></div>
              <div><span className="text-gray-500">ผู้ส่งคืน:</span><span className="ml-2 font-medium">{ticket.returnedBy}</span></div>
              <div><span className="text-gray-500">วันที่ส่งคืน:</span><span className="ml-2">{formatThaiDate(ticket.returnedAt)}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {ticket.returnSenderSignature && (
                <div>
                  <span className="text-xs text-gray-500">ลายเซ็นผู้ส่ง:</span>
                  <img src={ticket.returnSenderSignature} alt="ลายเซ็น" className="h-14 mt-1 rounded border bg-white object-contain p-1" />
                </div>
              )}
              {ticket.returnReceiverSignature && (
                <div>
                  <span className="text-xs text-gray-500">ลายเซ็นผู้รับ:</span>
                  <img src={ticket.returnReceiverSignature} alt="ลายเซ็น" className="h-14 mt-1 rounded border bg-white object-contain p-1" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== DISPOSAL INFO ===== */}
      {ticket.disposalStatus && (
        <div className="card bg-white shadow-sm border border-orange-200">
          <div className="card-body p-4">
            <h3 className="font-bold text-sm text-orange-700 mb-3">🗑️ ตีแทงจำหน่าย</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">สถานะ:</span><span className="ml-2 font-medium text-orange-700">{disposalStatusLabel[ticket.disposalStatus]}</span></div>
              {ticket.disposalMethod && <div><span className="text-gray-500">วิธี:</span><span className="ml-2">{ticket.disposalMethod}</span></div>}
              {ticket.disposalValue != null && <div><span className="text-gray-500">ราคาประเมิน:</span><span className="ml-2 font-medium">{formatCurrency(ticket.disposalValue)}</span></div>}
              {ticket.disposalReason && <div className="sm:col-span-2"><span className="text-gray-500">เหตุผล:</span><span className="ml-2">{ticket.disposalReason}</span></div>}
              {ticket.disposalApprovedBy && <div><span className="text-gray-500">ผู้อนุมัติ:</span><span className="ml-2">{ticket.disposalApprovedBy}</span></div>}
              {ticket.disposalComRef && <div><span className="text-gray-500">หนังสือ ครม.:</span><span className="ml-2 font-mono">{ticket.disposalComRef}</span></div>}
            </div>
          </div>
        </div>
      )}

      {/* ===== STATUS TIMELINE ===== */}
      <div className="card bg-white shadow-sm border border-gray-100">
        <div className="card-body p-4">
          <h3 className="font-bold text-sm text-gray-500 mb-4">📊 สถานะการดำเนินการ</h3>
          <div className="flex items-center justify-between">
            {statusTimeline.map((step, idx) => {
              const stepCfg = statusConfig[step];
              const isCompleted = ticket.status !== 'cancelled' && ticket.status !== 'disposed' && idx <= timelineIndex;
              const isCurrent = ticket.status !== 'cancelled' && ticket.status !== 'disposed' && idx === timelineIndex;
              return (
                <div key={step} className="flex flex-1 items-center">
                  {idx > 0 && <div className={`h-0.5 flex-1 ${isCompleted ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
                  <div className="flex flex-col items-center mx-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-colors ${
                      isCurrent ? 'border-indigo-500 bg-indigo-500 text-white' :
                      isCompleted ? 'border-emerald-400 bg-emerald-50 text-emerald-600' :
                      'border-gray-200 bg-gray-50 text-gray-400'
                    }`}>
                      {isCompleted && !isCurrent ? '✓' : stepCfg.icon}
                    </div>
                    <span className={`text-[10px] mt-1 text-center font-medium ${
                      isCurrent ? 'text-indigo-600' : isCompleted ? 'text-emerald-600' : 'text-gray-400'
                    }`}>
                      {stepCfg.label}
                    </span>
                  </div>
                  {idx < statusTimeline.length - 1 && <div className={`h-0.5 flex-1 ${idx < timelineIndex ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== ACTION BUTTONS ===== */}
      {ticket.status !== 'cancelled' && ticket.status !== 'closed' && ticket.status !== 'disposed' && (
        <div className="card bg-white shadow-sm border border-gray-100">
          <div className="card-body p-4">
            <h3 className="font-bold text-sm text-gray-500 mb-3">⚡ การดำเนินการ</h3>
            <div className="flex flex-wrap gap-2">
              {ticket.status === 'pending' && (
                <button onClick={() => setShowAcceptModal(true)} className="btn btn-sm bg-emerald-600 text-white border-none hover:bg-emerald-700" disabled={actionLoading}>
                  ✅ รับเรื่อง
                </button>
              )}
              {ticket.status === 'accepted' && (
                <>
                  <button onClick={handleStartRepair} className="btn btn-sm bg-violet-600 text-white border-none hover:bg-violet-700" disabled={actionLoading}>
                    🔧 เริ่มซ่อม
                  </button>
                  <button onClick={() => handlePrint('repair')} className="btn btn-sm btn-ghost border-gray-300">
                    🖨️ ปริ้นใบรับซ่อม
                  </button>
                  <button onClick={() => setShowCancelModal(true)} className="btn btn-sm btn-error btn-outline" disabled={actionLoading}>
                    ❌ ยกเลิก
                  </button>
                  <button onClick={() => setShowDisposalModal(true)} className="btn btn-sm btn-outline border-orange-300 text-orange-600 hover:bg-orange-50" disabled={actionLoading}>
                    🗑️ ตีแทงจำหน่าย
                  </button>
                </>
              )}
              {ticket.status === 'in_progress' && (
                <>
                  <button onClick={() => setShowEstimateModal(true)} className="btn btn-sm bg-yellow-600 text-white border-none hover:bg-yellow-700" disabled={actionLoading}>
                    💰 เสนอราคา
                  </button>
                  <button onClick={() => setShowReturnModal(true)} className="btn btn-sm bg-emerald-600 text-white border-none hover:bg-emerald-700" disabled={actionLoading}>
                    📦 ส่งคืน
                  </button>
                  <button onClick={() => setShowCancelModal(true)} className="btn btn-sm btn-error btn-outline" disabled={actionLoading}>
                    ❌ ยกเลิก
                  </button>
                  <button onClick={() => setShowDisposalModal(true)} className="btn btn-sm btn-outline border-orange-300 text-orange-600 hover:bg-orange-50" disabled={actionLoading}>
                    🗑️ ซ่อมไม่ได้ — ตีแทง
                  </button>
                </>
              )}
              {ticket.status === 'returned' && (
                <>
                  <button onClick={handleClose} className="btn btn-sm bg-gray-700 text-white border-none hover:bg-gray-800" disabled={actionLoading}>
                    ✔️ ปิดงาน
                  </button>
                  <button onClick={() => handlePrint('return')} className="btn btn-sm btn-ghost border-gray-300">
                    🖨️ ปริ้นใบส่งคืน
                  </button>
                  <button onClick={() => handlePrint('repair')} className="btn btn-sm btn-ghost border-gray-300">
                    🖨️ ปริ้นใบรับซ่อม
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== CLOSED ACTIONS ===== */}
      {ticket.status === 'closed' && (
        <div className="card bg-white shadow-sm border border-gray-100">
          <div className="card-body p-4">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handlePrint('repair')} className="btn btn-sm btn-ghost border-gray-300">🖨️ ปริ้นใบรับซ่อม</button>
              <button onClick={() => handlePrint('return')} className="btn btn-sm btn-ghost border-gray-300">🖨️ ปริ้นใบส่งคืน</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODALS ========== */}

      {/* ACCEPT MODAL */}
      {showAcceptModal && (
        <dialog className="modal modal-open" open>
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg">🔧 รับเรื่องแจ้งซ่อม</h3>
            <div className="space-y-4 mt-4">
              <div>
                <label className="label"><span className="label-text font-semibold">ชื่อผู้รับเรื่อง *</span></label>
                <input type="text" className="input input-bordered w-full" placeholder="ระบุชื่อผู้รับเรื่อง" value={acceptReceiver} onChange={(e) => setAcceptReceiver(e.target.value)} />
              </div>
              <SignaturePad ref={receiverSigRef} title="ลายเซ็นผู้รับ" />
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowAcceptModal(false)}>ยกเลิก</button>
              <button className="btn bg-emerald-600 text-white border-none hover:bg-emerald-700" onClick={handleAccept} disabled={actionLoading}>
                {actionLoading && <span className="loading loading-spinner loading-xs"></span>}
                ยืนยันรับเรื่อง
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop"><button onClick={() => setShowAcceptModal(false)}>ปิด</button></form>
        </dialog>
      )}

      {/* ESTIMATE MODAL */}
      {showEstimateModal && (
        <dialog className="modal modal-open" open>
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg">💰 เสนอราคาซ่อม</h3>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label"><span className="label-text font-semibold">ค่าอะไหล่ (บาท) *</span></label>
                  <input type="number" min="0" step="0.01" className="input input-bordered w-full" placeholder="0.00" value={estRepairCost} onChange={(e) => setEstRepairCost(e.target.value)} />
                </div>
                <div>
                  <label className="label"><span className="label-text font-semibold">ค่าแรง (บาท) *</span></label>
                  <input type="number" min="0" step="0.01" className="input input-bordered w-full" placeholder="0.00" value={estLaborCost} onChange={(e) => setEstLaborCost(e.target.value)} />
                </div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-3 text-center">
                <div className="text-xs text-indigo-600">รวมทั้งหมด</div>
                <div className="text-xl font-bold text-indigo-700">
                  {formatCurrency((parseFloat(estRepairCost) || 0) + (parseFloat(estLaborCost) || 0))}
                </div>
              </div>
              <div>
                <label className="label"><span className="label-text font-semibold">สถานะอนุมัติ *</span></label>
                <select className="select select-bordered w-full" value={estCostStatus} onChange={(e) => setEstCostStatus(e.target.value)}>
                  <option value="pending">รออนุมัติ</option>
                  <option value="approved">อนุมัติ</option>
                  <option value="rejected">ไม่อนุมัติ</option>
                </select>
                {estCostStatus === 'rejected' && (
                  <p className="text-xs text-red-500 mt-1">⚠️ เลือก "ไม่อนุมัติ" จะยกเลิกใบแจ้งซ่อมอัตโนมัติ</p>
                )}
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowEstimateModal(false)}>ยกเลิก</button>
              <button className="btn bg-yellow-600 text-white border-none hover:bg-yellow-700" onClick={handleEstimate} disabled={actionLoading}>
                {actionLoading && <span className="loading loading-spinner loading-xs"></span>}
                บันทึก
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop"><button onClick={() => setShowEstimateModal(false)}>ปิด</button></form>
        </dialog>
      )}

      {/* RETURN MODAL */}
      {showReturnModal && (
        <dialog className="modal modal-open" open>
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg">📦 ส่งคืนครุภัณฑ์</h3>
            <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="label"><span className="label-text font-semibold">วิธีส่งคืน *</span></label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setReturnMethod('หน่วยงานมารับเอง')}
                    className={`btn btn-sm ${returnMethod === 'หน่วยงานมารับเอง' ? 'bg-indigo-600 text-white border-indigo-600' : 'btn-outline border-gray-300'}`}>
                    🏢 หน่วยงานมารับเอง
                  </button>
                  <button type="button" onClick={() => setReturnMethod('ช่างไปส่งคืน')}
                    className={`btn btn-sm ${returnMethod === 'ช่างไปส่งคืน' ? 'bg-indigo-600 text-white border-indigo-600' : 'btn-outline border-gray-300'}`}>
                    🚗 ช่างไปส่งคืน
                  </button>
                </div>
              </div>
              <div>
                <label className="label"><span className="label-text font-semibold">ชื่อผู้ส่งคืน *</span></label>
                <input type="text" className="input input-bordered w-full" placeholder="ระบุชื่อผู้ส่งคืน" value={returnedBy} onChange={(e) => setReturnedBy(e.target.value)} />
              </div>
              <div className="divider"></div>
              <SignaturePad ref={returnSenderSigRef} title="ลายเซ็นผู้ส่ง" />
              <SignaturePad ref={returnReceiverSigRef} title="ลายเซ็นผู้รับคืน" />
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowReturnModal(false)}>ยกเลิก</button>
              <button className="btn bg-emerald-600 text-white border-none hover:bg-emerald-700" onClick={handleReturn} disabled={actionLoading}>
                {actionLoading && <span className="loading loading-spinner loading-xs"></span>}
                ยืนยันส่งคืน
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop"><button onClick={() => setShowReturnModal(false)}>ปิด</button></form>
        </dialog>
      )}

      {/* CANCEL MODAL */}
      {showCancelModal && (
        <dialog className="modal modal-open" open>
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg text-red-600">❌ ยกเลิกใบแจ้งซ่อม</h3>
            <div className="mt-4">
              <label className="label"><span className="label-text font-semibold">เหตุผลการยกเลิก *</span></label>
              <textarea className="textarea textarea-bordered w-full" rows={3} placeholder="เช่น อะไหล่หายาก, ค่าซ่อมสูงกว่าราคาเครื่อง" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowCancelModal(false)}>ยกเลิก</button>
              <button className="btn btn-error text-white" onClick={handleCancel} disabled={actionLoading}>
                {actionLoading && <span className="loading loading-spinner loading-xs"></span>}
                ยืนยันยกเลิก
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop"><button onClick={() => setShowCancelModal(false)}>ปิด</button></form>
        </dialog>
      )}

      {/* DISPOSAL MODAL */}
      {showDisposalModal && (
        <dialog className="modal modal-open" open>
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg text-orange-600">🗑️ ตีแทงจำหน่ายครุภัณฑ์</h3>
            <p className="text-sm text-gray-500 mt-1">{ticket.ticketNo} — {ticket.assetName}</p>
            <div className="space-y-4 mt-4">
              <div>
                <label className="label"><span className="label-text font-semibold">เหตุผลที่ต้องจำหน่าย *</span></label>
                <textarea className="textarea textarea-bordered w-full" rows={2} placeholder="เช่น อะไหล่หมดสต็อก" value={disposalReason} onChange={(e) => setDisposalReason(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label"><span className="label-text font-semibold">วิธีจำหน่าย *</span></label>
                  <select className="select select-bordered w-full" value={disposalMethod} onChange={(e) => setDisposalMethod(e.target.value)}>
                    <option value="">-- เลือก --</option>
                    <option value="จำหน่าย/ชำระ">จำหน่าย/ชำระ (ประมูล)</option>
                    <option value="ทำลาย">ทำลาย</option>
                    <option value="บริจาค">บริจาค</option>
                  </select>
                </div>
                <div>
                  <label className="label"><span className="label-text font-semibold">ราคาประเมิน (฿)</span></label>
                  <input type="number" className="input input-bordered w-full" placeholder="0.00" value={disposalValue} onChange={(e) => setDisposalValue(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label"><span className="label-text font-semibold">ผู้อนุมัติ</span></label>
                  <input type="text" className="input input-bordered w-full" placeholder="ชื่อ-นามสกุล" value={disposalApprovedBy} onChange={(e) => setDisposalApprovedBy(e.target.value)} />
                </div>
                <div>
                  <label className="label"><span className="label-text font-semibold">หนังสือ ครม.</span></label>
                  <input type="text" className="input input-bordered w-full" placeholder="เช่น ครม.ที่ 1/2569" value={disposalComRef} onChange={(e) => setDisposalComRef(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowDisposalModal(false)}>ยกเลิก</button>
              <button className="btn bg-orange-600 text-white border-none hover:bg-orange-700" onClick={handleDisposal} disabled={actionLoading}>
                {actionLoading && <span className="loading loading-spinner loading-xs"></span>}
                บันทึกการตีแทง
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop"><button onClick={() => setShowDisposalModal(false)}>ปิด</button></form>
        </dialog>
      )}

      {/* RECEIPT PREVIEW */}
      {showReceiptPreview && (
        <dialog className="modal modal-open" open>
          <div className="modal-box max-w-sm p-0">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <span className="text-sm font-medium">🖨️ {printType === 'return' ? 'ใบส่งคืน' : 'ใบรับซ่อม'}</span>
              <span className="text-xs text-gray-400">50mm</span>
            </div>
            <div className="px-4 pb-4 flex justify-center">
              <ThermalReceipt ticket={ticket} type={printType} />
            </div>
            <div className="flex justify-end gap-2 border-t px-4 py-3">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowReceiptPreview(false)}>ปิด</button>
              <button className="btn btn-sm bg-indigo-600 text-white border-none" onClick={() => { setShowReceiptPreview(false); setTimeout(() => window.print(), 300); }}>
                🖨️ ปริ้น
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop"><button onClick={() => setShowReceiptPreview(false)}>ปิด</button></form>
        </dialog>
      )}

      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .thermal-receipt, .thermal-receipt * { visibility: visible; }
          .thermal-receipt { position: absolute; left: 0; top: 0; }
        }
      `}</style>
    </div>
  );
}
