'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { QrCode } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface QRScannerProps {
  onScan: (assetCode: string) => void
}

export function QRScanner({ onScan }: QRScannerProps) {
  const [open, setOpen] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrCodeRef = useRef<any>(null)

  const startScanning = useCallback(async () => {
    if (!scannerRef.current) return
    setScanning(true)
    setError(null)

    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      html5QrCodeRef.current = new Html5Qrcode('qr-reader')

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText: string) => {
          onScan(decodedText)
          setOpen(false)
          stopScanning()
        },
        () => { /* QR not found in frame - ignore */ }
      )
    } catch (err) {
      console.error('QR Scanner error:', err)
      setError('ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบสิทธิ์การใช้กล้อง')
      setScanning(false)
    }
  }, [onScan])

  const stopScanning = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState()
        if (state === 2) {
          await html5QrCodeRef.current.stop()
        }
        html5QrCodeRef.current.clear()
      } catch (err) {
        console.error('Stop scanning error:', err)
      }
      html5QrCodeRef.current = null
    }
    setScanning(false)
  }, [])

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => startScanning(), 500)
      return () => clearTimeout(timer)
    } else {
      stopScanning()
    }
  }, [open, startScanning, stopScanning])

  useEffect(() => {
    return () => stopScanning()
  }, [stopScanning])

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) stopScanning()
      setOpen(newOpen)
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" type="button" className="gap-2">
          <QrCode className="h-4 w-4" />
          สแกน QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            สแกน QR Code ครุภัณฑ์
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            สแกน QR Code บนป้ายครุภัณฑ์เพื่อดึงข้อมูลอัตโนมัติ
          </p>
          <div id="qr-reader" ref={scannerRef} className="w-full aspect-square max-w-[280px] mx-auto rounded-lg overflow-hidden bg-muted" />
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
          )}
          {scanning && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              กำลังสแกน...
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => { stopScanning(); setOpen(false) }}>ปิด</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
