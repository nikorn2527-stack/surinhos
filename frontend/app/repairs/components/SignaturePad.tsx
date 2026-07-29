'use client';

import { useRef, useEffect, forwardRef, useImperativeHandle, type Ref } from 'react';

interface SignaturePadProps {
  title?: string;
  width?: number;
  height?: number;
}

export interface SignaturePadRef {
  toDataURL: () => string;
  clear: () => void;
  isEmpty: () => boolean;
}

const SignaturePad = forwardRef(function SignaturePad(
  { title, width = 400, height = 150 }: SignaturePadProps,
  ref: Ref<SignaturePadRef>
) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const lastPoint = useRef({ x: 0, y: 0 });

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Set drawing style
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Fill white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }, [width, height]);

    const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ('touches' in e) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      isDrawing.current = true;
      lastPoint.current = getPoint(e);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing.current || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const currentPoint = getPoint(e);
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();

      lastPoint.current = currentPoint;
    };

    const stopDrawing = () => {
      isDrawing.current = false;
    };

    const clear = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const toDataURL = () => {
      return canvasRef.current?.toDataURL('image/png') || '';
    };

    const isEmpty = () => {
      const canvas = canvasRef.current;
      if (!canvas) return true;
      const ctx = canvas.getContext('2d');
      if (!ctx) return true;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      // Check if all pixels are white (255,255,255)
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
          return false;
        }
      }
      return true;
    };

    useImperativeHandle(ref, () => ({
      toDataURL,
      clear,
      isEmpty,
    }));

    return (
      <div>
        {title && (
          <label className="label">
            <span className="label-text font-semibold text-sm">{title}</span>
          </label>
        )}
        <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            className="w-full cursor-crosshair touch-none"
            style={{ maxWidth: width, height: height }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
        <button
          type="button"
          onClick={clear}
          className="btn btn-ghost btn-xs mt-1 text-gray-500"
        >
          🗑️ ล้างลายเซ็น
        </button>
      </div>
    );
  }
);

});

SignaturePad.displayName = 'SignaturePad';
export default SignaturePad;
