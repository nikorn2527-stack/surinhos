import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePad = ({ onSave, onClear, title = "เซ็นชื่อที่นี่" }) => {
    const sigCanvas = useRef({});

    // ฟังก์ชันล้างลายเซ็น
    const clear = () => {
        sigCanvas.current.clear();
        if (onClear) onClear();
    };

    // ฟังก์ชันบันทึกลายเซ็นแปลงเป็น Base64
    const save = () => {
        if (sigCanvas.current.isEmpty()) {
            alert("กรุณาเซ็นชื่อก่อนยืนยัน");
            return;
        }
        // แปลงภาพวาดเป็น Base64 String
        const base64String = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
        onSave(base64String);
    };

    return (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', backgroundColor: '#fff' }}>
            <p style={{ marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>{title}</p>
            
            {/* พื้นที่สำหรับวาดลายเซ็น */}
            <div style={{ border: '2px dashed #d1d5db', borderRadius: '4px', backgroundColor: '#f9fafb' }}>
                <SignatureCanvas 
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{
                        className: 'signature-canvas',
                        style: { width: '100%', height: '200px', cursor: 'crosshair' }
                    }}
                />
            </div>

            {/* ปุ่มกดยืนยันและล้าง */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                <button 
                    type="button" 
                    onClick={clear}
                    style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                >
                    ล้างใหม่
                </button>
                <button 
                    type="button" 
                    onClick={save}
                    style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                >
                    ยืนยันลายเซ็น
                </button>
            </div>
        </div>
    );
};

export default SignaturePad;