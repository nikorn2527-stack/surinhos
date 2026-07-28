'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Wrench,
  PackageOpen,
  CheckCircle2,
  XCircle,
  Printer,
  Loader2,
  CalendarDays,
  User,
  MapPin,
  AlertTriangle,
  Banknote,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import SignaturePad from '@/components/repair/signature-pad'

// ==================== TYPES ====================

interface TicketDetailProps {
  ticketId: string
  onClose: () => void
  onUpdate: () => void
}

interface AssetInfo {
  assetCode: string | null
  name: string
  category: string
  location: {
    buildingName: string
    roomName: string
  } | null
}

interface RepairTicket {
  id: string
  ticketNo: string
  assetId: string | null
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
  updatedAt: string
  asset: AssetInfo | null
}

// ==================== CONFIG ====================

const statusConfig: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  pending: {
    label: 'รอรับเรื่อง',
    color: 'bg-amber-100 text-amber-700',
    icon: 'Clock',
  },
  accepted: {
    label: 'รับเรื่องแล้ว',
    color: 'bg-blue-100 text-blue-700',
    icon: 'CheckCircle',
  },
  in_progress: {
    label: 'กำลังซ่อม',
    color: 'bg-violet-100 text-violet-700',
    icon: 'Wrench',
  },
  returned: {
    label: 'ส่งคืนแล้ว',
    color: 'bg-emerald-100 text-emerald-700',
    icon: 'PackageOpen',
  },
  closed: {
    label: 'ปิดงาน',
    color: 'bg-gray-100 text-gray-700',
    icon: 'CheckCircle2',
  },
  cancelled: {
    label: 'ยกเลิก',
    color: 'bg-red-100 text-red-700',
    icon: 'XCircle',
  },
}

const statusTimeline = ['pending', 'accepted', 'in_progress', 'returned', 'closed']

const iconMap: Record<string, React.ReactNode> = {
  Clock: <Clock className="size-4" />,
  CheckCircle: <CheckCircle className="size-4" />,
  Wrench: <Wrench className="size-4" />,
  PackageOpen: <PackageOpen className="size-4" />,
  CheckCircle2: <CheckCircle2 className="size-4" />,
  XCircle: <XCircle className="size-4" />,
}

const costStatusLabel: Record<string, string> = {
  pending: 'รออนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ไม่อนุมัติ',
}

// ==================== HELPER ====================

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(amount: number | null) {
  if (amount == null) return '-'
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

function getTimelineIndex(status: string): number {
  if (status === 'cancelled') return -1
  return statusTimeline.indexOf(status)
}

// ==================== COMPONENT ====================

export default function TicketDetail({
  ticketId,
  onClose,
  onUpdate,
}: TicketDetailProps) {
  // ---------- state ----------
  const [ticket, setTicket] = useState<RepairTicket | null>(null)
  const [loading, setLoading] = useState(true)

  // accept modal
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [acceptReceiver, setAcceptReceiver] = useState('')
  const receiverSignatureRef = useRef<{ toDataURL: () => string } | null>(null)

  // cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  // estimate modal
  const [showEstimateModal, setShowEstimateModal] = useState(false)
  const [estRepairCost, setEstRepairCost] = useState('')
  const [estLaborCost, setEstLaborCost] = useState('')
  const [estCostStatus, setEstCostStatus] = useState('pending')

  // return modal
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returnMethod, setReturnMethod] = useState('')
  const [returnedBy, setReturnedBy] = useState('')
  const returnSenderSignatureRef = useRef<{ toDataURL: () => string } | null>(null)
  const returnReceiverSignatureRef = useRef<{ toDataURL: () => string } | null>(null)

  // confirm dialogs
  const [showStartRepairConfirm, setShowStartRepairConfirm] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  // print
  const [printType, setPrintType] = useState<'repair' | 'return'>('repair')

  // ---------- fetch ticket ----------
  const fetchTicket = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/repairs/${ticketId}`)
      if (!res.ok) {
        if (res.status === 404) {
          toast.error('ไม่พบใบแจ้งซ่อมที่ต้องการ')
          onClose()
        } else {
          throw new Error('Failed to fetch')
        }
        return
      }
      const data: RepairTicket = await res.json()
      setTicket(data)
    } catch {
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setLoading(false)
    }
  }, [ticketId, onClose])

  useEffect(() => {
    fetchTicket()
  }, [fetchTicket])

  // ---------- mutations ----------
  const acceptMutation = useMutation({
    mutationFn: async (data: { receivedBy: string; receiverSignature?: string }) => {
      const res = await fetch(`/api/repairs/${ticketId}/accept`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'ล้มเหลว')
      }
      return res.json()
    },
    onSuccess: (updated) => {
      setTicket(updated)
      setShowAcceptModal(false)
      setAcceptReceiver('')
      toast.success('รับเรื่องเรียบร้อยแล้ว')
      onUpdate()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const progressMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/repairs/${ticketId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'ล้มเหลว')
      }
      return res.json()
    },
    onSuccess: (updated) => {
      setTicket(updated)
      setShowStartRepairConfirm(false)
      toast.success('เริ่มดำเนินการซ่อมเรียบร้อยแล้ว')
      onUpdate()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const estimateMutation = useMutation({
    mutationFn: async (data: { repairCost: number; laborCost: number; costStatus: string }) => {
      const res = await fetch(`/api/repairs/${ticketId}/estimate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'ล้มเหลว')
      }
      return res.json()
    },
    onSuccess: (updated) => {
      setTicket(updated)
      setShowEstimateModal(false)
      setEstRepairCost('')
      setEstLaborCost('')
      setEstCostStatus('pending')
      toast.success('บันทึกการเสนอราคาเรียบร้อยแล้ว')
      onUpdate()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const returnMutation = useMutation({
    mutationFn: async (data: {
      returnMethod: string
      returnedBy: string
      returnSenderSignature?: string
      returnReceiverSignature?: string
    }) => {
      const res = await fetch(`/api/repairs/${ticketId}/return`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'ล้มเหลว')
      }
      return res.json()
    },
    onSuccess: (updated) => {
      setTicket(updated)
      setShowReturnModal(false)
      setReturnMethod('')
      setReturnedBy('')
      toast.success('ส่งคืนครุภัณฑ์เรียบร้อยแล้ว')
      onUpdate()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const closeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/repairs/${ticketId}/close`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'ล้มเหลว')
      }
      return res.json()
    },
    onSuccess: (updated) => {
      setTicket(updated)
      setShowCloseConfirm(false)
      toast.success('ปิดงานเรียบร้อยแล้ว')
      onUpdate()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async (data: { cancelReason: string }) => {
      const res = await fetch(`/api/repairs/${ticketId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'ล้มเหลว')
      }
      return res.json()
    },
    onSuccess: (updated) => {
      setTicket(updated)
      setShowCancelModal(false)
      setCancelReason('')
      toast.success('ยกเลิกใบแจ้งซ่อมเรียบร้อยแล้ว')
      onUpdate()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  // ---------- handlers ----------
  const handleAccept = () => {
    if (!acceptReceiver.trim()) {
      toast.error('กรุณาระบุชื่อผู้รับเรื่อง')
      return
    }
    const sig = receiverSignatureRef.current?.toDataURL() || undefined
    acceptMutation.mutate({ receivedBy: acceptReceiver.trim(), receiverSignature: sig })
  }

  const handleEstimate = () => {
    const rc = parseFloat(estRepairCost)
    const lc = parseFloat(estLaborCost)
    if (isNaN(rc) || isNaN(lc)) {
      toast.error('กรุณาระบุค่าอะไหล่และค่าแรงงานให้ถูกต้อง')
      return
    }
    estimateMutation.mutate({
      repairCost: rc,
      laborCost: lc,
      costStatus: estCostStatus,
    })
  }

  const handleReturn = () => {
    if (!returnMethod) {
      toast.error('กรุณาเลือกวิธีการส่งคืน')
      return
    }
    if (!returnedBy.trim()) {
      toast.error('กรุณาระบุชื่อผู้ส่งคืน')
      return
    }
    const senderSig = returnSenderSignatureRef.current?.toDataURL() || undefined
    const receiverSig = returnReceiverSignatureRef.current?.toDataURL() || undefined
    returnMutation.mutate({
      returnMethod,
      returnedBy: returnedBy.trim(),
      returnSenderSignature: senderSig,
      returnReceiverSignature: receiverSig,
    })
  }

  const handleCancel = () => {
    if (!cancelReason.trim()) {
      toast.error('กรุณาระบุเหตุผลการยกเลิก')
      return
    }
    cancelMutation.mutate({ cancelReason: cancelReason.trim() })
  }

  const handlePrint = (type: 'repair' | 'return') => {
    setPrintType(type)
    setTimeout(() => {
      window.print()
    }, 300)
  }

  // ---------- computed ----------
  const isAnyMutationLoading =
    acceptMutation.isPending ||
    progressMutation.isPending ||
    estimateMutation.isPending ||
    returnMutation.isPending ||
    closeMutation.isPending ||
    cancelMutation.isPending

  const estTotal = (parseFloat(estRepairCost) || 0) + (parseFloat(estLaborCost) || 0)

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="mx-auto max-w-4xl p-4 text-center md:p-6">
        <p className="text-muted-foreground">ไม่พบข้อมูลใบแจ้งซ่อม</p>
        <Button variant="outline" className="mt-4" onClick={onClose}>
          <ArrowLeft className="size-4" />
          กลับ
        </Button>
      </div>
    )
  }

  const currentConfig = statusConfig[ticket.status] || statusConfig.pending
  const timelineIndex = getTimelineIndex(ticket.status)

  return (
    <div className="no-print">
      <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
        {/* ========== HEADER ========== */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0" aria-label="กลับ">
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold md:text-2xl">{ticket.ticketNo}</h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="size-3.5" />
                <span>{formatDate(ticket.createdAt)}</span>
              </div>
            </div>
          </div>
          <Badge className={cn('px-3 py-1 text-sm font-medium', currentConfig.color)} variant="outline">
            {iconMap[currentConfig.icon]}
            {currentConfig.label}
          </Badge>
        </div>

        {/* ========== CANCEL REASON (if cancelled) ========== */}
        {ticket.status === 'cancelled' && ticket.cancelReason && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" />
              <div>
                <p className="font-semibold text-red-700">เหตุผลการยกเลิก</p>
                <p className="mt-1 text-sm text-red-600">{ticket.cancelReason}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ========== INFO SECTION ========== */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ข้อมูลใบแจ้งซ่อม</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">ชื่ออุปกรณ์ / สถานที่</p>
                <p className="mt-0.5 font-medium">{ticket.assetName}</p>
              </div>
              {ticket.asset?.assetCode && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">หมายเลขครุภัณฑ์</p>
                  <p className="mt-0.5 font-medium">{ticket.asset.assetCode}</p>
                </div>
              )}
              {ticket.asset?.category && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">หมวดหมู่</p>
                  <p className="mt-0.5 font-medium">{ticket.asset.category}</p>
                </div>
              )}
              {ticket.asset?.location && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">สถานที่ตั้ง</p>
                  <p className="mt-0.5 flex items-center gap-1 font-medium">
                    <MapPin className="size-3.5" />
                    {ticket.asset.location.buildingName} {ticket.asset.location.roomName}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">รายละเอียดปัญหา</p>
                <p className="mt-0.5 whitespace-pre-wrap">{ticket.problemDetails || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">ผู้แจ้ง</p>
                <p className="mt-0.5 flex items-center gap-1 font-medium">
                  <User className="size-3.5" />
                  {ticket.reporterName || '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ========== ACCEPTANCE INFO ========== */}
        {ticket.receivedBy && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ข้อมูลการรับเรื่อง</CardTitle>
              <CardDescription>รับเรื่องเมื่อ {formatDate(ticket.receivedAt)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="text-muted-foreground">ผู้รับเรื่อง: </span>
                  <span className="font-medium">{ticket.receivedBy}</span>
                </span>
              </div>
              {ticket.receiverSignature && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">ลายเซ็นผู้รับ</p>
                  <img
                    src={ticket.receiverSignature}
                    alt="ลายเซ็นผู้รับ"
                    className="h-20 rounded border border-gray-200 bg-white object-contain p-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ========== COST ESTIMATE ========== */}
        {(ticket.repairCost != null || ticket.laborCost != null || ticket.costStatus) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Banknote className="size-4" />
                ข้อมูลค่าใช้จ่าย
              </CardTitle>
              {ticket.costStatus && (
                <CardDescription>
                  สถานะ:{' '}
                  <span
                    className={cn(
                      'font-medium',
                      ticket.costStatus === 'approved' && 'text-emerald-600',
                      ticket.costStatus === 'rejected' && 'text-red-600',
                      ticket.costStatus === 'pending' && 'text-amber-600'
                    )}
                  >
                    {costStatusLabel[ticket.costStatus] || ticket.costStatus}
                  </span>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">ค่าอะไหล่</p>
                  <p className="mt-1 text-lg font-bold">{formatCurrency(ticket.repairCost)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">ค่าแรงงาน</p>
                  <p className="mt-1 text-lg font-bold">{formatCurrency(ticket.laborCost)}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3 text-center">
                  <p className="text-xs text-muted-foreground">รวมทั้งหมด</p>
                  <p className="mt-1 text-lg font-bold text-primary">
                    {formatCurrency(
                      ticket.totalCost ??
                        (ticket.repairCost != null && ticket.laborCost != null
                          ? ticket.repairCost + ticket.laborCost
                          : null)
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ========== RETURN INFO ========== */}
        {ticket.returnedBy && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PackageOpen className="size-4" />
                ข้อมูลการส่งคืน
              </CardTitle>
              <CardDescription>
                ส่งคืนเมื่อ {formatDate(ticket.returnedAt)} • วิธี: {ticket.returnMethod}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="text-muted-foreground">ผู้ส่งคืน: </span>
                  <span className="font-medium">{ticket.returnedBy}</span>
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {ticket.returnSenderSignature && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">ลายเซ็นผู้ส่งคืน</p>
                    <img
                      src={ticket.returnSenderSignature}
                      alt="ลายเซ็นผู้ส่งคืน"
                      className="h-20 rounded border border-gray-200 bg-white object-contain p-1"
                    />
                  </div>
                )}
                {ticket.returnReceiverSignature && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">ลายเซ็นผู้รับคืน</p>
                    <img
                      src={ticket.returnReceiverSignature}
                      alt="ลายเซ็นผู้รับคืน"
                      className="h-20 rounded border border-gray-200 bg-white object-contain p-1"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ========== STATUS TIMELINE ========== */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">สถานะการดำเนินการ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {statusTimeline.map((step, idx) => {
                const cfg = statusConfig[step]
                const isCompleted = ticket.status !== 'cancelled' && idx <= timelineIndex
                const isCurrent = ticket.status !== 'cancelled' && idx === timelineIndex
                const isCancelled = ticket.status === 'cancelled'

                return (
                  <div key={step} className="flex flex-1 flex-col items-center">
                    <div className="flex w-full items-center">
                      {idx > 0 && (
                        <div
                          className={cn(
                            'mr-2 h-0.5 flex-1',
                            isCancelled ? 'bg-gray-200' : idx <= timelineIndex ? 'bg-emerald-400' : 'bg-gray-200'
                          )}
                        />
                      )}
                      <div
                        className={cn(
                          'flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                          isCurrent && 'border-primary bg-primary text-primary-foreground',
                          isCompleted && !isCurrent && 'border-emerald-400 bg-emerald-50 text-emerald-600',
                          !isCompleted && !isCurrent && 'border-gray-200 bg-gray-50 text-gray-400'
                        )}
                      >
                        {iconMap[cfg.icon]}
                      </div>
                      {idx < statusTimeline.length - 1 && (
                        <div
                          className={cn(
                            'ml-2 h-0.5 flex-1',
                            isCancelled ? 'bg-gray-200' : idx < timelineIndex ? 'bg-emerald-400' : 'bg-gray-200'
                          )}
                        />
                      )}
                    </div>
                    <p
                      className={cn(
                        'mt-2 text-center text-xs font-medium',
                        isCurrent && 'text-primary',
                        isCompleted && !isCurrent && 'text-emerald-600',
                        !isCompleted && !isCurrent && 'text-gray-400'
                      )}
                    >
                      {cfg.label}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* ========== ACTION BUTTONS ========== */}
        {ticket.status !== 'cancelled' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">การดำเนินการ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {/* PENDING */}
                {ticket.status === 'pending' && (
                  <Button
                    onClick={() => {
                      setAcceptReceiver('')
                      setShowAcceptModal(true)
                    }}
                    className="w-full sm:w-auto"
                    disabled={isAnyMutationLoading}
                  >
                    <CheckCircle className="size-4" />
                    รับเรื่อง
                  </Button>
                )}

                {/* ACCEPTED */}
                {ticket.status === 'accepted' && (
                  <>
                    <Button onClick={() => setShowStartRepairConfirm(true)} className="w-full sm:w-auto" disabled={isAnyMutationLoading}>
                      <Wrench className="size-4" />
                      เริ่มซ่อม
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setCancelReason('')
                        setShowCancelModal(true)
                      }}
                      className="w-full sm:w-auto"
                      disabled={isAnyMutationLoading}
                    >
                      <XCircle className="size-4" />
                      ยกเลิก
                    </Button>
                  </>
                )}

                {/* IN PROGRESS */}
                {ticket.status === 'in_progress' && (
                  <>
                    <Button
                      onClick={() => {
                        setEstRepairCost('')
                        setEstLaborCost('')
                        setEstCostStatus('pending')
                        setShowEstimateModal(true)
                      }}
                      className="w-full sm:w-auto"
                      disabled={isAnyMutationLoading}
                    >
                      <Banknote className="size-4" />
                      เสนอราคา
                    </Button>
                    <Button
                      onClick={() => {
                        setReturnMethod('')
                        setReturnedBy('')
                        setShowReturnModal(true)
                      }}
                      className="w-full sm:w-auto"
                      disabled={isAnyMutationLoading}
                    >
                      <PackageOpen className="size-4" />
                      ส่งคืน
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setCancelReason('')
                        setShowCancelModal(true)
                      }}
                      className="w-full sm:w-auto"
                      disabled={isAnyMutationLoading}
                    >
                      <XCircle className="size-4" />
                      ยกเลิก
                    </Button>
                  </>
                )}

                {/* RETURNED */}
                {ticket.status === 'returned' && (
                  <>
                    <Button onClick={() => setShowCloseConfirm(true)} className="w-full sm:w-auto" disabled={isAnyMutationLoading}>
                      <CheckCircle2 className="size-4" />
                      ปิดงาน
                    </Button>
                    <Button variant="outline" onClick={() => handlePrint('return')} className="w-full sm:w-auto">
                      <Printer className="size-4" />
                      ปริ้นใบส่งคืน
                    </Button>
                  </>
                )}

                {/* CLOSED */}
                {ticket.status === 'closed' && (
                  <Button variant="outline" onClick={() => handlePrint('repair')} className="w-full sm:w-auto">
                    <Printer className="size-4" />
                    ปริ้นใบแจ้งซ่อม
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ========== ACCEPT MODAL ========== */}
      <Dialog open={showAcceptModal} onOpenChange={setShowAcceptModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>รับเรื่องแจ้งซ่อม</DialogTitle>
            <DialogDescription>กรุณากรอกข้อมูลผู้รับเรื่องและลงลายเซ็น</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="accept-receiver">
                ชื่อผู้รับเรื่อง <span className="text-destructive">*</span>
              </Label>
              <Input
                id="accept-receiver"
                placeholder="ระบุชื่อผู้รับเรื่อง"
                value={acceptReceiver}
                onChange={(e) => setAcceptReceiver(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>ลายเซ็นผู้รับ</Label>
              <SignaturePad ref={receiverSignatureRef} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcceptModal(false)} disabled={acceptMutation.isPending}>
              ยกเลิก
            </Button>
            <Button onClick={handleAccept} disabled={acceptMutation.isPending}>
              {acceptMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              ยืนยันรับเรื่อง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== ESTIMATE MODAL ========== */}
      <Dialog open={showEstimateModal} onOpenChange={setShowEstimateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เสนอราคาซ่อม</DialogTitle>
            <DialogDescription>กรุณาระบุค่าอะไหล่ ค่าแรงงาน และสถานะการอนุมัติ</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="est-repair-cost">
                ค่าอะไหล่ (บาท) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="est-repair-cost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={estRepairCost}
                onChange={(e) => setEstRepairCost(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="est-labor-cost">
                ค่าแรงงาน (บาท) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="est-labor-cost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={estLaborCost}
                onChange={(e) => setEstLaborCost(e.target.value)}
              />
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">รวมทั้งหมด</p>
              <p className="mt-1 text-xl font-bold">{formatCurrency(estTotal || null)}</p>
            </div>
            <div className="space-y-2">
              <Label>
                สถานะการอนุมัติ <span className="text-destructive">*</span>
              </Label>
              <Select value={estCostStatus} onValueChange={setEstCostStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">รออนุมัติ</SelectItem>
                  <SelectItem value="approved">อนุมัติ</SelectItem>
                  <SelectItem value="rejected">ไม่อนุมัติ</SelectItem>
                </SelectContent>
              </Select>
              {estCostStatus === 'rejected' && (
                <p className="text-xs text-amber-600">
                  ⚠️ เลือก &quot;ไม่อนุมัติ&quot; จะทำให้ใบแจ้งซ่อมถูกยกเลิกโดยอัตโนมัติ
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEstimateModal(false)} disabled={estimateMutation.isPending}>
              ยกเลิก
            </Button>
            <Button onClick={handleEstimate} disabled={estimateMutation.isPending}>
              {estimateMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== RETURN MODAL ========== */}
      <Dialog open={showReturnModal} onOpenChange={setShowReturnModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>ส่งคืนครุภัณฑ์</DialogTitle>
            <DialogDescription>กรุณากรอกข้อมูลการส่งคืนและลงลายเซ็น</DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto py-2">
            <div className="space-y-2">
              <Label>
                วิธีส่งคืน <span className="text-destructive">*</span>
              </Label>
              <Select value={returnMethod} onValueChange={setReturnMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="เลือกวิธีส่งคืน" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="หน่วยงานมารับเอง">หน่วยงานมารับเอง</SelectItem>
                  <SelectItem value="ช่างไปส่งคืน">ช่างไปส่งคืน</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="return-by">
                ชื่อผู้ส่งคืน <span className="text-destructive">*</span>
              </Label>
              <Input
                id="return-by"
                placeholder="ระบุชื่อผู้ส่งคืน"
                value={returnedBy}
                onChange={(e) => setReturnedBy(e.target.value)}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>ลายเซ็นผู้ส่ง</Label>
              <SignaturePad ref={returnSenderSignatureRef} />
            </div>
            <div className="space-y-2">
              <Label>ลายเซ็นผู้รับคืน</Label>
              <SignaturePad ref={returnReceiverSignatureRef} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnModal(false)} disabled={returnMutation.isPending}>
              ยกเลิก
            </Button>
            <Button onClick={handleReturn} disabled={returnMutation.isPending}>
              {returnMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              ยืนยันส่งคืน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== CANCEL MODAL ========== */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ยกเลิกใบแจ้งซ่อม</DialogTitle>
            <DialogDescription>การยกเลิกจะไม่สามารถกู้คืนได้ กรุณาระบุเหตุผล</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">
                เหตุผลการยกเลิก <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="cancel-reason"
                placeholder="ระบุเหตุผล เช่น อะไหล่หายาก, ค่าซ่อมสูงกว่าราคาเครื่อง"
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelModal(false)} disabled={cancelMutation.isPending}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              ยืนยันยกเลิก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== START REPAIR CONFIRM ========== */}
      <AlertDialog open={showStartRepairConfirm} onOpenChange={setShowStartRepairConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการเริ่มซ่อม</AlertDialogTitle>
            <AlertDialogDescription>ต้องการเริ่มดำเนินการซ่อม {ticket.assetName} หรือไม่?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={progressMutation.isPending}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={() => progressMutation.mutate()} disabled={progressMutation.isPending}>
              {progressMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              ยืนยัน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========== CLOSE CONFIRM ========== */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการปิดงาน</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการปิดงานซ่อม {ticket.assetName} ({ticket.ticketNo}) หรือไม่? การปิดงานจะไม่สามารถกู้คืนได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closeMutation.isPending}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending}>
              {closeMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              ยืนยันปิดงาน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========== PRINT CONTENT (hidden, shown only during print) ========== */}
      <PrintContent ticket={ticket} printType={printType} />

      {/* ========== PRINT STYLES ========== */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            background: white !important;
            z-index: 99999 !important;
            padding: 24px !important;
          }
        }
      `}</style>
    </div>
  )
}

// ==================== PRINT CONTENT SUB-COMPONENT ====================

function PrintContent({
  ticket,
  printType,
}: {
  ticket: RepairTicket
  printType: 'repair' | 'return'
}) {
  return (
    <div className="print-only hidden" aria-hidden="true">
      <div className="space-y-6">
        {/* Print Header */}
        <div className="text-center">
          <h1 className="text-xl font-bold">
            {printType === 'return'
              ? 'ใบส่งคืนครุภัณฑ์ / Return Receipt'
              : 'ใบแจ้งซ่อมอุปกรณ์ / Repair Ticket'}
          </h1>
          <Separator className="mx-auto mt-3 max-w-xs" />
        </div>

        {/* Ticket Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">เลขที่: </span>
            <span className="font-medium">{ticket.ticketNo}</span>
          </div>
          <div>
            <span className="text-muted-foreground">สถานะ: </span>
            <span className="font-medium">{statusConfig[ticket.status]?.label || ticket.status}</span>
          </div>
          <div>
            <span className="text-muted-foreground">วันที่แจ้ง: </span>
            <span className="font-medium">{formatDate(ticket.createdAt)}</span>
          </div>
          {ticket.receivedAt && (
            <div>
              <span className="text-muted-foreground">วันที่รับ: </span>
              <span className="font-medium">{formatDate(ticket.receivedAt)}</span>
            </div>
          )}
          {ticket.returnedAt && (
            <div>
              <span className="text-muted-foreground">วันที่ส่งคืน: </span>
              <span className="font-medium">{formatDate(ticket.returnedAt)}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Asset Info */}
        <div className="space-y-2 text-sm">
          <h2 className="font-semibold">ข้อมูลอุปกรณ์</h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground">ชื่ออุปกรณ์: </span>
              <span className="font-medium">{ticket.assetName}</span>
            </div>
            {ticket.asset?.assetCode && (
              <div>
                <span className="text-muted-foreground">หมายเลขครุภัณฑ์: </span>
                <span className="font-medium">{ticket.asset.assetCode}</span>
              </div>
            )}
            {ticket.asset?.category && (
              <div>
                <span className="text-muted-foreground">หมวดหมู่: </span>
                <span className="font-medium">{ticket.asset.category}</span>
              </div>
            )}
            {ticket.asset?.location && (
              <div>
                <span className="text-muted-foreground">สถานที่: </span>
                <span className="font-medium">
                  {ticket.asset.location.buildingName} {ticket.asset.location.roomName}
                </span>
              </div>
            )}
          </div>
          <div>
            <span className="text-muted-foreground">รายละเอียดปัญหา: </span>
            <span className="font-medium">{ticket.problemDetails || '-'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">ผู้แจ้ง: </span>
            <span className="font-medium">{ticket.reporterName || '-'}</span>
          </div>
        </div>

        {/* Acceptance Info */}
        {ticket.receivedBy && (
          <>
            <Separator />
            <div className="space-y-2 text-sm">
              <h2 className="font-semibold">ข้อมูลการรับเรื่อง</h2>
              <div>
                <span className="text-muted-foreground">ผู้รับเรื่อง: </span>
                <span className="font-medium">{ticket.receivedBy}</span>
              </div>
              {ticket.receiverSignature && (
                <div>
                  <p className="mb-1 text-muted-foreground">ลายเซ็นผู้รับ:</p>
                  <img
                    src={ticket.receiverSignature}
                    alt="ลายเซ็นผู้รับ"
                    className="h-16 rounded border bg-white object-contain p-1"
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* Cost Info */}
        {(ticket.repairCost != null || ticket.laborCost != null) && (
          <>
            <Separator />
            <div className="space-y-2 text-sm">
              <h2 className="font-semibold">รายละเอียดค่าใช้จ่าย</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-muted-foreground">ค่าอะไหล่: </span>
                  <span className="font-medium">{formatCurrency(ticket.repairCost)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">ค่าแรงงาน: </span>
                  <span className="font-medium">{formatCurrency(ticket.laborCost)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">รวมทั้งหมด: </span>
                  <span className="font-bold">
                    {formatCurrency(
                      ticket.totalCost ??
                        (ticket.repairCost != null && ticket.laborCost != null
                          ? ticket.repairCost + ticket.laborCost
                          : null)
                    )}
                  </span>
                </div>
              </div>
              {ticket.costStatus && (
                <div>
                  <span className="text-muted-foreground">สถานะอนุมัติ: </span>
                  <span className="font-medium">
                    {costStatusLabel[ticket.costStatus] || ticket.costStatus}
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Return Info */}
        {ticket.returnedBy && (
          <>
            <Separator />
            <div className="space-y-2 text-sm">
              <h2 className="font-semibold">ข้อมูลการส่งคืน</h2>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">วิธีส่งคืน: </span>
                  <span className="font-medium">{ticket.returnMethod}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">ผู้ส่งคืน: </span>
                  <span className="font-medium">{ticket.returnedBy}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {ticket.returnSenderSignature && (
                  <div>
                    <p className="mb-1 text-muted-foreground">ลายเซ็นผู้ส่งคืน:</p>
                    <img
                      src={ticket.returnSenderSignature}
                      alt="ลายเซ็นผู้ส่งคืน"
                      className="h-16 rounded border bg-white object-contain p-1"
                    />
                  </div>
                )}
                {ticket.returnReceiverSignature && (
                  <div>
                    <p className="mb-1 text-muted-foreground">ลายเซ็นผู้รับคืน:</p>
                    <img
                      src={ticket.returnReceiverSignature}
                      alt="ลายเซ็นผู้รับคืน"
                      className="h-16 rounded border bg-white object-contain p-1"
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Cancel Reason */}
        {ticket.cancelReason && (
          <>
            <Separator />
            <div className="text-sm">
              <span className="text-muted-foreground">เหตุผลการยกเลิก: </span>
              <span className="font-medium text-red-600">{ticket.cancelReason}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
