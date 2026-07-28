'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Wrench, Plus, Send, Loader2, CheckCircle2, Camera, X } from 'lucide-react'
import { toast } from 'sonner'
import { AssetSearch } from './asset-search'
import { QRScanner } from './qr-scanner'

interface Location {
  buildingName: string
  roomName: string
}

interface Asset {
  id: string
  assetCode: string
  name: string
  category: string
  locationId: string | null
  status: string
  location: Location | null
}

interface RepairFormProps {
  onSubmit: () => void
}

export function RepairForm({ onSubmit }: RepairFormProps) {
  const [open, setOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedTicketNo, setSubmittedTicketNo] = useState('')

  // ฟอร์มแจ้งซ่อมตรงต้นฉบับ: 3 ฟิลด์
  const [formData, setFormData] = useState({
    assetName: '',       // ชื่ออุปกรณ์ / สถานที่ (auto-fill จากการเลือก asset)
    problemDetails: '',  // รายละเอียดปัญหา
    reporterName: '',    // ชื่อผู้แจ้ง
  })

  // Photo upload state
  const [photoFiles, setPhotoFiles] = useState<string[]>([]) // base64 data URLs

  const resetForm = useCallback(() => {
    setSelectedAsset(null)
    setFormData({ assetName: '', problemDetails: '', reporterName: '' })
    setPhotoFiles([])
    setSubmitted(false)
    setSubmittedTicketNo('')
  }, [])

  const handleAssetSelect = useCallback((asset: Asset) => {
    setSelectedAsset(asset)
    // ดึงชื่ออุปกรณ์ + สถานที่ มาแสดงในฟิลด์ asset_name อัตโนมัติ
    const locationStr = asset.location
      ? `${asset.location.buildingName}, ${asset.location.roomName}`
      : ''
    const fullName = locationStr ? `${asset.name} (${locationStr})` : asset.name
    setFormData((prev) => ({ ...prev, assetName: fullName }))
  }, [])

  const handleQRScan = useCallback(async (assetCode: string) => {
    try {
      const res = await fetch(`/api/assets?q=${encodeURIComponent(assetCode)}`)
      const data: Asset[] = await res.json()
      if (data.length > 0) {
        handleAssetSelect(data[0])
        toast.success(`พบครุภัณฑ์: ${data[0].name}`)
      } else {
        toast.error(`ไม่พบครุภัณฑ์หมายเลข ${assetCode}`)
      }
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการค้นหาครุภัณฑ์')
    }
  }, [handleAssetSelect])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.assetName || !formData.reporterName) {
      toast.error('กรุณากรอกชื่ออุปกรณ์/สถานที่ และชื่อผู้แจ้งอย่างน้อย')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetCode: selectedAsset?.assetCode || null,
          assetName: formData.assetName,
          problemDetails: formData.problemDetails,
          reporterName: formData.reporterName,
          photos: photoFiles.length > 0 ? JSON.stringify(photoFiles) : null,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to submit')
      }

      const data = await res.json()
      setSubmittedTicketNo(data.ticketNo)
      setSubmitted(true)
      toast.success(`แจ้งซ่อมสำเร็จ! เลขที่: ${data.ticketNo}`)
      onSubmit()
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาดในการแจ้งซ่อม')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm()
      setOpen(newOpen)
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="h-4 w-4" />
          แจ้งซ่อมใหม่
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Wrench className="h-5 w-5 text-emerald-600" />
            📝 ฟอร์มแจ้งซ่อมอุปกรณ์
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          /* ========== หน้าสำเร็จ ========== */
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">แจ้งซ่อมสำเร็จ!</h3>
              <p className="text-sm text-muted-foreground">
                เลขที่แจ้งซ่อม: <span className="font-semibold text-foreground">{submittedTicketNo}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={resetForm} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-4 w-4" />
                แจ้งซ่อมเพิ่มเติม
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>ปิด</Button>
            </div>
          </div>
        ) : (
          /* ========== ฟอร์มแจ้งซ่อม ========== */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ค้นหา/สแกนครุภัณฑ์ */}
            <Card className="border-dashed">
              <CardContent className="p-4 space-y-3">
                <p className="text-xs text-muted-foreground">ค้นหาจากฐานข้อมูลเพื่อกรอกข้อมูลอัตโนมัติ (ไม่บังคับ)</p>
                <AssetSearch
                  onSelect={handleAssetSelect}
                  selectedAsset={selectedAsset}
                  onClear={() => {
                    setSelectedAsset(null)
                    setFormData((prev) => ({ ...prev, assetName: '' }))
                  }}
                />
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">หรือ</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="flex justify-center">
                  <QRScanner onScan={handleQRScan} />
                </div>
              </CardContent>
            </Card>

            {/* ฟิลด์แจ้งซ่อม 3 ฟิลด์ ตามต้นฉบับ */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assetName">ชื่ออุปกรณ์ / สถานที่ *</Label>
                <Input
                  id="assetName"
                  placeholder="เช่น คอมพิวเตอร์ห้อง 301..."
                  value={formData.assetName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, assetName: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="problemDetails">รายละเอียดปัญหา</Label>
                <Textarea
                  id="problemDetails"
                  placeholder="อธิบายปัญหาที่พบ..."
                  value={formData.problemDetails}
                  onChange={(e) => setFormData((prev) => ({ ...prev, problemDetails: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reporterName">ชื่อผู้แจ้งซ่อม *</Label>
                <Input
                  id="reporterName"
                  placeholder="ชื่อ-นามสกุล..."
                  value={formData.reporterName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reporterName: e.target.value }))}
                />
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Camera className="size-3.5" />
                  รูปประกอบ (ถ่ายรูปอาการเสีย)
                </Label>
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30 transition"
                  onClick={() => document.getElementById('photo-upload-input')?.click()}
                >
                  <input
                    id="photo-upload-input"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      files.forEach(file => {
                        const reader = new FileReader()
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            setPhotoFiles(prev => [...prev, ev.target.result as string])
                          }
                        }
                        reader.readAsDataURL(file)
                      })
                    }}
                  />
                  <Camera className="h-6 w-6 mx-auto mb-1 text-gray-300" />
                  <p className="text-xs text-muted-foreground">คลิกเพื่อแนบรูป (รองรับหลายรูป)</p>
                </div>
                {photoFiles.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
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
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                    <div
                      className="w-16 h-16 rounded-md border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30 transition"
                      onClick={() => document.getElementById('photo-upload-input')?.click()}
                    >
                      <Plus className="size-4 text-gray-300" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ปุ่ม */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
              <Button
                type="submit"
                disabled={submitting}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> กำลังบันทึก...</>
                ) : (
                  <><Send className="h-4 w-4" /> 💾 บันทึกแจ้งซ่อม</>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
