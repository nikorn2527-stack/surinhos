'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Wrench, Clock, CheckCircle2, AlertTriangle, Ban, Loader2 } from 'lucide-react'

interface Repair {
  id: string
  ticketNo: string
  assetId: string
  problemCategory: string
  description: string
  urgency: string
  reporterName: string
  reporterPhone: string
  reporterDept: string
  status: string
  notes: string | null
  createdAt: string
  updatedAt: string
  asset: {
    assetNo: string
    name: string
    location: string
  }
}

interface RepairListProps {
  refreshTrigger: number
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  pending: { label: 'รอดำเนินการ', variant: 'secondary', icon: Clock },
  in_progress: { label: 'กำลังดำเนินการ', variant: 'default', icon: Loader2 },
  completed: { label: 'ดำเนินการเสร็จสิ้น', variant: 'outline', icon: CheckCircle2 },
  cancelled: { label: 'ยกเลิก', variant: 'destructive', icon: Ban },
}

const urgencyConfig: Record<string, { label: string; color: string }> = {
  'ปกติ': { label: 'ปกติ', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  'ด่วน': { label: 'ด่วน', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  'ด่วนที่สุด': { label: 'ด่วนที่สุด', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function RepairList({ refreshTrigger }: RepairListProps) {
  const { data: repairs = [], isLoading } = useQuery<Repair[]>({
    queryKey: ['repairs-list', refreshTrigger],
    queryFn: async () => {
      const res = await fetch('/api/repairs')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
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
          <span className="text-sm font-normal text-muted-foreground">({repairs.length} รายการ)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {repairs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Wrench className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">ยังไม่มีรายการแจ้งซ่อม</p>
          </div>
        ) : (
          <div className="space-y-3">
            {repairs.map((repair) => {
              const status = statusConfig[repair.status] || statusConfig.pending
              const urgency = urgencyConfig[repair.urgency] || urgencyConfig['ปกติ']
              const StatusIcon = status.icon

              return (
                <div
                  key={repair.id}
                  className="p-4 rounded-lg border hover:bg-accent/30 transition-colors space-y-3"
                >
                  {/* Header Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{repair.ticketNo}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${urgency.color}`}>
                        <AlertTriangle className="h-3 w-3" />
                        {urgency.label}
                      </span>
                    </div>
                    <Badge variant={status.variant} className="gap-1">
                      <StatusIcon className={`h-3 w-3 ${repair.status === 'in_progress' ? 'animate-spin' : ''}`} />
                      {status.label}
                    </Badge>
                  </div>

                  {/* Asset Info */}
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <span className="font-medium text-foreground">{repair.asset.name}</span>
                    <span className="mx-1">•</span>
                    <span>{repair.asset.assetNo}</span>
                    <span className="mx-1">•</span>
                    <span>{repair.asset.location}</span>
                  </div>

                  {/* Problem */}
                  <div className="text-sm">
                    <Badge variant="outline" className="text-xs mr-2">{repair.problemCategory}</Badge>
                    <span className="text-muted-foreground">{repair.description}</span>
                  </div>

                  {/* Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-1 border-t">
                    <span>แจ้งโดย: {repair.reporterName} ({repair.reporterDept})</span>
                    <span>{formatDate(repair.createdAt)}</span>
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
