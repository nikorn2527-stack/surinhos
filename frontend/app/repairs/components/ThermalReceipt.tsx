'use client';

interface ThermalReceiptProps {
  ticket: any;
  type: 'repair' | 'return';
}

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function formatThaiDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ThermalReceipt({ ticket, type }: ThermalReceiptProps) {
  if (!ticket) return null;

  return (
    <div className="thermal-receipt" style={{
      width: '280px',
      fontFamily: "'Sarabun', monospace",
      fontSize: '11px',
      lineHeight: '1.5',
      padding: '10px',
      background: 'white',
      color: '#1a1a1a'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', borderBottom: '1px dashed #999', paddingBottom: '8px', marginBottom: '8px' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
          {type === 'repair' ? 'ใบแจ้งซ่อมอุปกรณ์' : 'ใบส่งคืนอุปกรณ์'}
        </div>
        <div style={{ fontSize: '10px', color: '#666' }}>
          {type === 'repair' ? 'Repair Ticket' : 'Return Receipt'}
        </div>
      </div>

      {/* Ticket Info */}
      <div style={{ marginBottom: '6px' }}>
        <div><strong>เลขที่:</strong> {ticket.ticketNo}</div>
        <div><strong>วันที่แจ้ง:</strong> {formatThaiDate(ticket.createdAt)}</div>
      </div>

      <div style={{ borderTop: '1px dashed #ccc', paddingTop: '6px', marginBottom: '6px' }}>
        <div><strong>อุปกรณ์:</strong> {ticket.assetName}</div>
        {ticket.asset?.assetCode && <div><strong>รหัส:</strong> {ticket.asset.assetCode}</div>}
        {ticket.problemDetails && <div><strong>ปัญหา:</strong> {ticket.problemDetails}</div>}
        <div><strong>ผู้แจ้ง:</strong> {ticket.reporterName}</div>
      </div>

      {type === 'repair' && ticket.receivedBy && (
        <div style={{ borderTop: '1px dashed #ccc', paddingTop: '6px', marginBottom: '6px' }}>
          <div><strong>ช่างรับเรื่อง:</strong> {ticket.receivedBy}</div>
          <div><strong>วันที่รับ:</strong> {formatThaiDate(ticket.receivedAt)}</div>
          {ticket.receiverSignature && (
            <div style={{ marginTop: '4px' }}>
              <div style={{ fontSize: '10px', color: '#666' }}>ลายเซ็นช่าง:</div>
              <img src={ticket.receiverSignature} alt="ลายเซ็น" style={{ maxWidth: '120px', maxHeight: '50px', border: '1px solid #eee' }} />
            </div>
          )}
        </div>
      )}

      {type === 'return' && ticket.returnedBy && (
        <div style={{ borderTop: '1px dashed #ccc', paddingTop: '6px', marginBottom: '6px' }}>
          <div><strong>วิธีส่งคืน:</strong> {ticket.returnMethod}</div>
          <div><strong>ผู้ส่งคืน:</strong> {ticket.returnedBy}</div>
          <div><strong>วันที่ส่งคืน:</strong> {formatThaiDate(ticket.returnedAt)}</div>
          {ticket.returnSenderSignature && (
            <div style={{ marginTop: '4px' }}>
              <div style={{ fontSize: '10px', color: '#666' }}>ลายเซ็นผู้ส่ง:</div>
              <img src={ticket.returnSenderSignature} alt="ลายเซ็น" style={{ maxWidth: '120px', maxHeight: '50px', border: '1px solid #eee' }} />
            </div>
          )}
          {ticket.returnReceiverSignature && (
            <div style={{ marginTop: '4px' }}>
              <div style={{ fontSize: '10px', color: '#666' }}>ลายเซ็นผู้รับ:</div>
              <img src={ticket.returnReceiverSignature} alt="ลายเซ็น" style={{ maxWidth: '120px', maxHeight: '50px', border: '1px solid #eee' }} />
            </div>
          )}
        </div>
      )}

      {/* Cost info */}
      {ticket.totalCost != null && (
        <div style={{ borderTop: '1px dashed #ccc', paddingTop: '6px', marginBottom: '6px' }}>
          <div><strong>ค่าอะไหล่:</strong> ฿{Number(ticket.repairCost).toLocaleString()}</div>
          <div><strong>ค่าแรง:</strong> ฿{Number(ticket.laborCost).toLocaleString()}</div>
          <div style={{ fontWeight: 'bold' }}><strong>รวม:</strong> ฿{Number(ticket.totalCost).toLocaleString()}</div>
        </div>
      )}

      {/* Status */}
      <div style={{ borderTop: '1px dashed #999', paddingTop: '6px', textAlign: 'center' }}>
        <div style={{ fontSize: '10px', color: '#666' }}>สถานะ: {ticket.status}</div>
      </div>

      {/* Signatures */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', fontSize: '10px' }}>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <div style={{ borderBottom: '1px solid #999', paddingBottom: '25px', marginBottom: '4px' }}></div>
          <div>ผู้แจ้ง</div>
        </div>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <div style={{ borderBottom: '1px solid #999', paddingBottom: '25px', marginBottom: '4px' }}></div>
          <div>ผู้รับเรื่อง</div>
        </div>
      </div>
    </div>
  );
}
