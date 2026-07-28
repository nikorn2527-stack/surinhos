'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Eraser, Save } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  onSignature: (data: string | null) => void;
  value?: string | null;
  required?: boolean;
}

export default function SignaturePad({
  label,
  onSignature,
  value = null,
  required = false,
}: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [capturedSignature, setCapturedSignature] = useState<string | null>(value);
  const [canvasWidth, setCanvasWidth] = useState(400);
  const [canvasHeight, setCanvasHeight] = useState(200);

  // Auto-resize canvas to fit container width
  const updateCanvasSize = useCallback(() => {
    if (containerRef.current) {
      const width = containerRef.current.offsetWidth;
      setCanvasWidth(width);
      const isMobile = width < 640;
      setCanvasHeight(isMobile ? 150 : 200);
    }
  }, []);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [updateCanvasSize]);

  // Load previously saved signature
  useEffect(() => {
    if (value && sigCanvas.current) {
      sigCanvas.current.fromDataURL(value);
    }
  }, [value, canvasWidth, canvasHeight]);

  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
    setCapturedSignature(null);
    onSignature(null);
  };

  const handleSave = () => {
    if (!sigCanvas.current) return;

    if (sigCanvas.current.isEmpty()) {
      return;
    }

    const trimmedCanvas = sigCanvas.current.getTrimmedCanvas();
    const dataUrl = trimmedCanvas.toDataURL('image/png');
    setCapturedSignature(dataUrl);
    onSignature(dataUrl);
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="text-sm font-medium leading-none">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="bg-white border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden cursor-crosshair touch-none"
      >
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            width: canvasWidth,
            height: canvasHeight,
            className: 'w-full',
          }}
          penColor="#1a1a1a"
          backgroundColor="transparent"
        />
      </div>

      {/* Hint text */}
      {!capturedSignature && (
        <p className="text-xs text-muted-foreground text-center">
          กรุณาลงลายเซ็นในช่องด้านบน
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="gap-1.5"
        >
          <Eraser className="h-4 w-4" />
          ล้าง
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          className="gap-1.5"
        >
          <Save className="h-4 w-4" />
          บันทึก
        </Button>
      </div>

      {/* Preview of Captured Signature */}
      {capturedSignature && (
        <div className="flex items-center gap-3 mt-2 p-3 bg-muted/50 rounded-lg border border-border">
          <div className="shrink-0 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              ลายเซ็นที่บันทึกแล้ว
            </p>
            <div className="bg-white rounded border border-border p-1.5 inline-block">
              <img
                src={capturedSignature}
                alt="Captured signature"
                className="h-16 w-auto max-w-[200px] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
