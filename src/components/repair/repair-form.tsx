'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Wrench, Plus, Send, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { AssetSearch } from './asset-search'
import { QRScanner } from './qr-scanner'

interface Asset {
  id: string
  assetNo: string
  name: string
  category: string
  brand: string
  model: string
  serialNo: string | null
  location: string
  department: string | null
  status: string
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

  const [formData, setFormData] = useState({
    problemCategory: '',
    description: '',
    urgency: 'ปกติ',
    reporterName: '',
    reporterPhone: '',
    reporterDept: '',
  })

  const resetForm = useCallback(() => {
    setSelectedAsset(null)
    setFormData({
      problemCategory: '',
      description: '',
      urgency: 'ปกติ',
      reporterName: '',
      reporterPhone: '',
      reporterDept: '',
    })
    setSubmitted(false)
    setSubmittedTicketNo('')
  }, [])

  const handleAssetSelect = useCallback((asset: Asset) => {
    setSelectedAsset(asset)
  }, [])

  const handleQRScan = useCallback(async (assetNo: string) => {
    try {
      // Search for the asset by its asset number from QR
      const res = await fetch(`/api/assets?q=${encodeURIComponent(assetNo)}`)
      const data: Asset[] = await res.json()

      if (data.length > 0) {
        setSelectedAsset(data[0])
        toast.success(`พบครุภัณฑ์: ${data[0].name}`)
      } else {
        toast.error(`ไม่พบครุภัณฑ์หมายเลข ${assetNo}`)
      }
    } catch (err) {
      console.error('QR lookup error:', err)
      toast.error('เกิดข้อผิดพลาดในการค้นหาครุภัณฑ์')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedAsset) {
      toast.error('กรุณาเลือกครุภัณฑ์ก่อน')
      return
    }

    if (!formData.problemCategory || !formData.description || !formData.reporterName || !formData.reporterPhone || !formData.reporterDept) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: selectedAsset.id,
          ...formData,
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
      console.error('Submit error:', err)
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
          แจ้งซ่อมอุปกรณ์
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Wrench className="h-5 w-5 text-emerald-600" />
            ฟอร์มแจ้งซ่อมอุปกรณ์
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">แจ้งซ่อมสำเร็จ!</h3>
              <p className="text-sm text-muted-foreground">
                เลขที่แจ้งซ่อม: <span className="font-semibold text-foreground">{submittedTicketNo}</span>
              </p>
              <p className="text-xs text-muted-foreground">ระบบได้บันทึกข้อมูลการแจ้งซ่อมของคุณแล้ว</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={resetForm} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-4 w-4" />
                แจ้งซ่อมเพิ่มเติม
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>
                ปิด
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Asset Selection */}
            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-600 text-white text-xs font-bold">1</span>
                  เลือกครุภัณฑ์ที่ต้องการแจ้งซ่อม
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <AssetSearch
                  onSelect={handleAssetSelect}
                  selectedAsset={selectedAsset}
                  onClear={() => setSelectedAsset(null)}
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

            {/* Step 2: Problem Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-600 text-white text-xs font-bold">2</span>
                  รายละเอียดปัญหา
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="problemCategory">หมวดหมู่ปัญหา *</Label>
                    <Select
                      value={formData.problemCategory}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, problemCategory: val }))}
                    >
                      <SelectTrigger id="problemCategory">
                        <SelectValue placeholder="เลือกหมวดหมู่" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ฮาร์ดแวร์">ฮาร์ดแวร์ (Hardware)</SelectItem>
                        <SelectItem value="ซอฟต์แวร์">ซอฟต์แวร์ (Software)</SelectItem>
                        <SelectItem value="เครือข่าย">เครือข่าย (Network)</SelectItem>
                        <SelectItem value="อื่นๆ">อื่นๆ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="urgency">ระดับความเร่งด่วน *</Label>
                    <Select
                      value={formData.urgency}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, urgency: val }))}
                    >
                      <SelectTrigger id="urgency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ปกติ">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            ปกติ
                          </span>
                        </SelectItem>
                        <SelectItem value="ด่วน">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            ด่วน
                          </span>
                        </SelectItem>
                        <SelectItem value="ด่วนที่สุด">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-red-500" />
                            ด่วนที่สุด
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">รายละเอียดอาการเสีย *</Label>
                  <Textarea
                    id="description"
                    placeholder="อธิบายอาการเสียที่พบ เช่น เปิดเครื่องไม่ติด, หน้าจอมีจุดดำ, อินเทอร์เน็ตใช้งานไม่ได้..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Reporter Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-600 text-white text-xs font-bold">3</span>
                  ข้อมูลผู้แจ้ง
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reporterName">ชื่อผู้แจ้ง *</Label>
                    <Input
                      id="reporterName"
                      placeholder="ชื่อ-นามสกุล"
                      value={formData.reporterName}
                      onChange={(e) => setFormData(prev => ({ ...prev, reporterName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reporterPhone">เบอร์ติดต่อกลับ *</Label>
                    <Input
                      id="reporterPhone"
                      placeholder="เช่น 081-234-5678"
                      value={formData.reporterPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, reporterPhone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reporterDept">แผนกของผู้แจ้ง *</Label>
                  <Input
                    id="reporterDept"
                    placeholder="เช่น แผนกบัญชี, แผนกบุคคล"
                    value={formData.reporterDept}
                    onChange={(e) => setFormData(prev => ({ ...prev, reporterDept: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={submitting || !selectedAsset}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    ส่งแจ้งซ่อม
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
