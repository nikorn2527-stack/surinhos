'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Wrench } from 'lucide-react'

interface Location {
  buildingName: string
  roomName: string
}

interface Asset {
  assetCode: string
  name: string
  category: string
  location: Location | null
}

interface Repair {
  id: string
  ticketNo: string
  assetId: string | null
  assetName: string
  problemDetails: string | null
  reporterName: string | null
  status: string
  createdAt: string
  updatedAt: string
  asset: Asset | null
}

interface RepairListProps {
  refreshTrigger: number
}

// สถานะ 5 ขั้น ตามต้นฉบับ surinhos
const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  pending:     { label: 'รอรับเรื่อง',   variant: 'secondary', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  accepted:    { label: 'รับเรื่องแล้ว', variant: 'default',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  in_progress: { label: 'กำลังซ่อม',    variant: 'default',   color: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300' },
  returned:    { label: 'ส่งคืนแล้ว',   variant: 'default',   color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  closed:      { label: 'ปิดงาน',       variant: 'outline',   color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function RepairList({ refreshTrigger }: RepairListProps) {
  const { data: tickets = [], isLoading } = useQuery<Repair[]>({
    queryKey: ['repairs-list', refreshTrigger],
    queryFn: async () => {
      const res = await fetch('/api/repairs')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wrench className="h-4 w-4 text-emerald-600" />
          รายการแจ้งซ่อม
          <span className="text-sm font-normal text-muted-foreground">({tickets.length} รายการ)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Wrench className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">📋 ยังไม่มีรายการแจ้งซ่อม</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {tickets.map((ticket) => {
              const status = statusConfig[ticket.status] || statusConfig.pending
              return (
                <div
                  key={ticket.id}
                  className="p-4 rounded-lg border hover:bg-accent/30 transition-colors space-y-3"
                >
                  {/* Header: ticket_no + status */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-sm">{ticket.ticketNo}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* ข้อมูลอุปกรณ์ */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium">📦 {ticket.assetName}</p>
                    {ticket.asset && (
                      <p className="text-xs text-muted-foreground">
                        🔖 {ticket.asset.assetCode}
                        {ticket.asset.location && ` • 📍 ${ticket.asset.location.buildingName}, ${ticket.asset.location.roomName}`}
                      </p>
                    )}
                  </div>

                  {/* ปัญหา */}
                  {ticket.problemDetails && (
                    <p className="text-sm text-muted-foreground">⚠️ {ticket.problemDetails}</p>
                  )}

                  {/* Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-1 border-t">
                    <span>👤 ผู้แจ้ง: {ticket.reporterName || '-'}</span>
                    <span>{formatDate(ticket.createdAt)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
