'use client'

import { useMemo } from 'react'

// ==================== TYPES ====================

interface AssetInfo {
  assetCode: string | null
  name: string
  category: string
  location: {
    buildingName: string
    roomName: string
  } | null
}

export interface RepairTicketForReceipt {
  ticketNo: string
  assetName: string
  problemDetails: string | null
  reporterName: string | null
  status: string
  receivedBy: string | null
  receivedAt: string | null
  senderSignature: string | null
  receiverSignature: string | null
  returnMethod: string | null
  returnedBy: string | null
  returnedAt: string | null
  returnSenderSignature: string | null
  returnReceiverSignature: string | null
  repairCost: number | null
  laborCost: number | null
  totalCost: number | null
  costStatus: string | null
  cancelReason: string | null
  createdAt: string
  asset: AssetInfo | null
}

type ReceiptType = 'repair' | 'return'

// ==================== HELPERS ====================

const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

function formatDateThai(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDate().toString().padStart(2, '0')
  const month = THAI_MONTHS[d.getMonth()]
  const year = (d.getFullYear() + 543).toString().slice(-2)
  const hour = d.getHours().toString().padStart(2, '0')
  const min = d.getMinutes().toString().padStart(2, '0')
  return `${day}/${month}/${year} ${hour}:${min}`
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDate().toString().padStart(2, '0')
  const month = THAI_MONTHS[d.getMonth()]
  const year = (d.getFullYear() + 543).toString().slice(-2)
  return `${day}/${month}/${year}`
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

const statusLabel: Record<string, string> = {
  pending: 'รอรับเรื่อง',
  accepted: 'รับเรื่องแล้ว',
  in_progress: 'กำลังซ่อม',
  returned: 'ส่งคืนแล้ว',
  closed: 'ปิดงาน',
  cancelled: 'ยกเลิก',
}

// ==================== COMPONENT ====================

export default function ThermalReceipt({
  ticket,
  type,
}: {
  ticket: RepairTicketForReceipt
  type: ReceiptType
}) {
  const isReturn = type === 'return'

  const totalCostDisplay = useMemo(() => {
    if (ticket.totalCost != null) return formatCurrency(ticket.totalCost)
    if (ticket.repairCost != null && ticket.laborCost != null) {
      return formatCurrency(ticket.repairCost + ticket.laborCost)
    }
    return null
  }, [ticket])

  return (
    <div className="thermal-receipt" data-receipt-type={type}>
      {/* ============ TOP CUT LINE ============ */}
      <div className="receipt-cut-top" />

      <div className="receipt-content">
        {/* ---- Header ---- */}
        <div className="text-center">
          <div className="receipt-logo">🔧</div>
          <div className="receipt-org-name">SURINHOS</div>
          <div className="receipt-org-sub">REPAIR CENTER</div>
          <div className="receipt-divider" />
          <div className="receipt-title">
            {isReturn ? 'ใบส่งคืนครุภัณฑ์' : 'ใบรับซ่อมอุปกรณ์'}
          </div>
          <div className="receipt-divider" />
        </div>

        {/* ---- Ticket Number (Large) ---- */}
        <div className="ticket-number-row">
          <div className="ticket-number-label">เลขที่</div>
          <div className="ticket-number-value">{ticket.ticketNo}</div>
        </div>
        <div className="ticket-date-row">
          {formatDateThai(ticket.createdAt)}
        </div>

        <div className="receipt-divider" />

        {/* ---- Status ---- */}
        <div className="info-row status-row">
          <span className="info-label">สถานะ</span>
          <span className={`info-value status-badge status-${ticket.status}`}>
            {statusLabel[ticket.status] || ticket.status}
          </span>
        </div>

        <div className="receipt-divider" />

        {/* ---- Equipment Info ---- */}
        <div className="section-header">อุปกรณ์</div>
        <div className="info-row">
          <span className="info-label">ชื่อ</span>
          <span className="info-value text-bold">{ticket.assetName}</span>
        </div>
        {ticket.asset?.assetCode && (
          <div className="info-row">
            <span className="info-label">ครุภัณฑ์</span>
            <span className="info-value">{ticket.asset.assetCode}</span>
          </div>
        )}
        {ticket.asset?.category && (
          <div className="info-row">
            <span className="info-label">ประเภท</span>
            <span className="info-value">{ticket.asset.category}</span>
          </div>
        )}
        {ticket.asset?.location && (
          <div className="info-row">
            <span className="info-label">สถานที่</span>
            <span className="info-value">
              {ticket.asset.location.buildingName} {ticket.asset.location.roomName}
            </span>
          </div>
        )}

        <div className="receipt-divider" />

        {/* ---- Problem Description ---- */}
        <div className="section-header">รายละเอียดปัญหา</div>
        <div className="description-text">
          {ticket.problemDetails || '-'}
        </div>

        <div className="receipt-divider" />

        {/* ---- Reporter & Receiver ---- */}
        <div className="info-row">
          <span className="info-label">ผู้แจ้ง</span>
          <span className="info-value">{ticket.reporterName || '-'}</span>
        </div>

        {!isReturn && ticket.receivedBy && (
          <>
            <div className="info-row">
              <span className="info-label">ผู้รับเรื่อง</span>
              <span className="info-value">{ticket.receivedBy}</span>
            </div>
            <div className="info-row">
              <span className="info-label">วันรับเรื่อง</span>
              <span className="info-value">{formatDateThai(ticket.receivedAt!)}</span>
            </div>
          </>
        )}

        {/* ---- Signatures for REPAIR ticket ---- */}
        {!isReturn && ticket.senderSignature && (
          <>
            <div className="receipt-divider" />
            <div className="signature-section">
              <div className="signature-block">
                <div className="signature-label">ลายเซ็น ผู้ส่ง</div>
                <div className="signature-img-wrap">
                  <img src={ticket.senderSignature} alt="ผู้ส่ง" className="signature-img" />
                </div>
              </div>
              {ticket.receiverSignature && (
                <div className="signature-block">
                  <div className="signature-label">ลายเซ็น ผู้รับ</div>
                  <div className="signature-img-wrap">
                    <img src={ticket.receiverSignature} alt="ผู้รับ" className="signature-img" />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ---- Return Info ---- */}
        {isReturn && (
          <>
            {ticket.returnMethod && (
              <div className="info-row">
                <span className="info-label">วิธีส่งคืน</span>
                <span className="info-value">{ticket.returnMethod}</span>
              </div>
            )}
            {ticket.returnedBy && (
              <div className="info-row">
                <span className="info-label">ผู้ส่งคืน</span>
                <span className="info-value">{ticket.returnedBy}</span>
              </div>
            )}
            {ticket.returnedAt && (
              <div className="info-row">
                <span className="info-label">วันส่งคืน</span>
                <span className="info-value">{formatDateThai(ticket.returnedAt)}</span>
              </div>
            )}
            <div className="receipt-divider" />
          </>
        )}

        {/* ---- Cost Info ---- */}
        {(totalCostDisplay || ticket.repairCost != null || ticket.laborCost != null) && (
          <>
            <div className="section-header">ค่าใช้จ่าย</div>
            {ticket.repairCost != null && (
              <div className="info-row">
                <span className="info-label">ค่าอะไหล่</span>
                <span className="info-value">{formatCurrency(ticket.repairCost)}</span>
              </div>
            )}
            {ticket.laborCost != null && (
              <div className="info-row">
                <span className="info-label">ค่าแรง</span>
                <span className="info-value">{formatCurrency(ticket.laborCost)}</span>
              </div>
            )}
            {totalCostDisplay && (
              <div className="info-row total-row">
                <span className="info-label">รวมทั้งหมด</span>
                <span className="info-value">{totalCostDisplay} บาท</span>
              </div>
            )}
            <div className="receipt-divider" />
          </>
        )}

        {/* ---- Return Signatures ---- */}
        {isReturn && (ticket.returnSenderSignature || ticket.returnReceiverSignature) && (
          <>
            <div className="signature-section">
              {ticket.returnSenderSignature && (
                <div className="signature-block">
                  <div className="signature-label">ลายเซ็น ผู้ส่งคืน</div>
                  <div className="signature-img-wrap">
                    <img src={ticket.returnSenderSignature} alt="ผู้ส่งคืน" className="signature-img" />
                  </div>
                </div>
              )}
              {ticket.returnReceiverSignature && (
                <div className="signature-block">
                  <div className="signature-label">ลายเซ็น ผู้รับคืน</div>
                  <div className="signature-img-wrap">
                    <img src={ticket.returnReceiverSignature} alt="ผู้รับคืน" className="signature-img" />
                  </div>
                </div>
              )}
            </div>
            <div className="receipt-divider" />
          </>
        )}

        {/* ---- Cancel Reason ---- */}
        {ticket.cancelReason && (
          <>
            <div className="section-header text-danger">เหตุผลยกเลิก</div>
            <div className="description-text text-danger">
              {ticket.cancelReason}
            </div>
            <div className="receipt-divider" />
          </>
        )}

        {/* ---- Footer ---- */}
        <div className="receipt-footer">
          <div className="receipt-footer-line">
            พิมพ์เมื่อ: {formatDateThai(new Date().toISOString())}
          </div>
          <div className="receipt-footer-line">
            Surinhos Asset Management
          </div>
          <div className="receipt-footer-thanks">
            ☆ ขอบคุณที่ใช้บริการ ☆
          </div>
        </div>
      </div>

      {/* ============ BOTTOM CUT LINE ============ */}
      <div className="receipt-cut-bottom" />
    </div>
  )
}

// ==================== INLINE STYLES ====================
// These are injected as <style> so they are available both on-screen and in print

export function ThermalReceiptStyles() {
  return (
    <style>{`
      /* ==================== THERMAL RECEIPT STYLES ==================== */
      .thermal-receipt {
        font-family: 'Noto Sans Thai', 'Courier New', monospace;
        width: 50mm;
        min-width: 50mm;
        max-width: 50mm;
        margin: 0 auto;
        background: #ffffff;
        color: #1a1a1a;
        font-size: 7pt;
        line-height: 1.4;
        position: relative;
        padding: 0;
        box-sizing: border-box;
      }

      /* ---- Cut lines (zigzag) ---- */
      .receipt-cut-top,
      .receipt-cut-bottom {
        width: 50mm;
        height: 4mm;
        background: repeating-linear-gradient(
          135deg,
          #fff 0px,
          #fff 2px,
          #ddd 2px,
          #ddd 4px,
          #fff 4px,
          #fff 6px
        );
      }

      .receipt-cut-bottom {
        margin-top: 2mm;
      }

      .receipt-content {
        padding: 2mm 3mm;
      }

      /* ---- Logo & Org ---- */
      .receipt-logo {
        font-size: 16pt;
        line-height: 1;
        margin-bottom: 1mm;
      }

      .receipt-org-name {
        font-size: 9pt;
        font-weight: 700;
        letter-spacing: 3px;
        line-height: 1.2;
      }

      .receipt-org-sub {
        font-size: 6pt;
        letter-spacing: 2px;
        opacity: 0.7;
        margin-bottom: 1mm;
      }

      /* ---- Title ---- */
      .receipt-title {
        font-size: 8pt;
        font-weight: 700;
        margin: 1.5mm 0;
        text-align: center;
      }

      /* ---- Dividers ---- */
      .receipt-divider {
        border: none;
        border-top: 1px dashed #999;
        margin: 1.5mm 0;
      }

      /* ---- Ticket Number (Large, prominent) ---- */
      .ticket-number-row {
        display: flex;
        align-items: baseline;
        justify-content: center;
        gap: 2mm;
        margin: 1mm 0;
      }

      .ticket-number-label {
        font-size: 6pt;
        opacity: 0.6;
      }

      .ticket-number-value {
        font-size: 11pt;
        font-weight: 900;
        letter-spacing: 0.5px;
        font-family: 'Courier New', monospace;
      }

      .ticket-date-row {
        text-align: center;
        font-size: 6.5pt;
        opacity: 0.7;
        margin-bottom: 1mm;
      }

      /* ---- Status Row ---- */
      .status-row {
        justify-content: center;
      }

      .status-badge {
        font-weight: 700;
        padding: 0.3mm 1.5mm;
        border-radius: 1mm;
        font-size: 6.5pt;
      }

      .status-pending {
        background: #fff3cd;
        color: #856404;
      }
      .status-accepted {
        background: #d1ecf1;
        color: #0c5460;
      }
      .status-in_progress {
        background: #e2d5f1;
        color: #4a1d8e;
      }
      .status-returned {
        background: #d4edda;
        color: #155724;
      }
      .status-closed {
        background: #e2e3e5;
        color: #383d41;
      }
      .status-cancelled {
        background: #f8d7da;
        color: #721c24;
      }

      /* ---- Section Headers ---- */
      .section-header {
        font-size: 6.5pt;
        font-weight: 700;
        opacity: 0.5;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 0.5mm;
        padding-bottom: 0.3mm;
        border-bottom: 0.5px solid #ccc;
      }

      .section-header.text-danger {
        color: #dc3545;
        opacity: 1;
      }

      /* ---- Info Rows ---- */
      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin: 0.5mm 0;
        gap: 1mm;
      }

      .info-label {
        font-size: 6.5pt;
        opacity: 0.5;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .info-value {
        font-size: 6.5pt;
        font-weight: 500;
        text-align: right;
        word-break: break-word;
      }

      .info-value.text-bold {
        font-weight: 700;
      }

      .total-row {
        border-top: 1px solid #333;
        padding-top: 0.5mm;
        margin-top: 0.5mm;
      }

      .total-row .info-label {
        font-weight: 700;
        opacity: 1;
      }

      .total-row .info-value {
        font-size: 8pt;
        font-weight: 900;
      }

      /* ---- Description ---- */
      .description-text {
        font-size: 6.5pt;
        line-height: 1.4;
        margin: 0.5mm 0;
        word-break: break-word;
      }

      .description-text.text-danger {
        color: #dc3545;
      }

      /* ---- Signatures ---- */
      .signature-section {
        display: flex;
        gap: 2mm;
        margin: 1mm 0;
      }

      .signature-block {
        flex: 1;
        text-align: center;
      }

      .signature-label {
        font-size: 5.5pt;
        opacity: 0.5;
        margin-bottom: 0.5mm;
      }

      .signature-img-wrap {
        border: 0.5px solid #ccc;
        height: 8mm;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.5mm;
        background: #fafafa;
      }

      .signature-img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }

      /* ---- Footer ---- */
      .receipt-footer {
        text-align: center;
        margin-top: 2mm;
        padding-top: 1mm;
      }

      .receipt-footer-line {
        font-size: 5pt;
        opacity: 0.4;
        margin: 0.3mm 0;
      }

      .receipt-footer-thanks {
        font-size: 6pt;
        margin-top: 1mm;
        opacity: 0.6;
      }

      /* ==================== PREVIEW MODE (on-screen, scaled up) ==================== */
      @media screen {
        .thermal-receipt-wrapper {
          background: #f0f0f0;
          padding: 24px;
          border-radius: 12px;
          overflow-x: auto;
          display: flex;
          justify-content: center;
        }

        .thermal-receipt-wrapper .thermal-receipt {
          transform: scale(2);
          transform-origin: top center;
          box-shadow: 2px 2px 12px rgba(0,0,0,0.15);
          border-radius: 2px;
        }
      }

      /* ==================== PRINT MODE ==================== */
      @media print {
        .thermal-receipt-wrapper {
          padding: 0 !important;
          margin: 0 !important;
          background: none !important;
        }

        .thermal-receipt-wrapper .thermal-receipt {
          transform: none !important;
          box-shadow: none !important;
          border-radius: 0 !important;
        }

        .no-print {
          display: none !important;
        }

        .print-receipt-area {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          background: white !important;
          z-index: 99999 !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        @page {
          size: 50mm auto;
          margin: 0;
        }
      }
    `}</style>
  )
}
