'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  onTicketClick: (ticketId: string) => void
}

// สถานะ 6 ขั้น (เพิ่ม cancelled)
const statusConfig: Record<string, { label: string; color: string }> = {
  pending:     { label: 'รอรับเรื่อง',   color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  accepted:    { label: 'รับเรื่องแล้ว', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  in_progress: { label: 'กำลังซ่อม',    color: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300' },
  returned:    { label: 'ส่งคืนแล้ว',   color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  closed:      { label: 'ปิดงาน',       color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  cancelled:   { label: 'ยกเลิก',       color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function RepairList({ refreshTrigger, onTicketClick }: RepairListProps) {
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
                <button
                  key={ticket.id}
                  onClick={() => onTicketClick(ticket.id)}
                  className="w-full text-left p-4 rounded-lg border hover:bg-accent/50 hover:border-primary/30 active:scale-[0.99] transition-all space-y-3 cursor-pointer"
                >
                  {/* Header: ticket_no + status */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-sm">{ticket.ticketNo}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* ข้อมูลอุปกรณ์ */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium truncate">📦 {ticket.assetName}</p>
                    {ticket.asset && (
                      <p className="text-xs text-muted-foreground truncate">
                        🔖 {ticket.asset.assetCode}
                        {ticket.asset.location && ` • 📍 ${ticket.asset.location.buildingName}, ${ticket.asset.location.roomName}`}
                      </p>
                    )}
                  </div>

                  {/* ปัญหา */}
                  {ticket.problemDetails && (
                    <p className="text-sm text-muted-foreground line-clamp-2">⚠️ {ticket.problemDetails}</p>
                  )}

                  {/* Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-1 border-t">
                    <span className="truncate">👤 {ticket.reporterName || '-'}</span>
                    <span className="whitespace-nowrap">{formatDate(ticket.createdAt)}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
