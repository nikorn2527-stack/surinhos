'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Wrench, ArrowLeft, Building2, Clock, CheckCircle2, Loader2, XCircle, PackageReturn } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { RepairForm } from '@/components/repair/repair-form'
import { RepairList } from '@/components/repair/repair-list'
import TicketDetail from '@/components/repair/ticket-detail'

interface Repair {
  id: string
  ticketNo: string
  status: string
  createdAt: string
}

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)

  const { data: tickets = [] } = useQuery<Repair[]>({
    queryKey: ['repairs-stats', refreshTrigger],
    queryFn: async () => {
      const res = await fetch('/api/repairs')
      return res.json()
    },
  })

  const stats = {
    total: tickets.length,
    pending: tickets.filter((r) => r.status === 'pending').length,
    accepted: tickets.filter((r) => r.status === 'accepted').length,
    inProgress: tickets.filter((r) => r.status === 'in_progress').length,
    returned: tickets.filter((r) => r.status === 'returned').length,
    closed: tickets.filter((r) => r.status === 'closed').length,
    cancelled: tickets.filter((r) => r.status === 'cancelled').length,
  }

  const handleRepairSubmitted = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  const handleTicketUpdated = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  // Detail View
  if (selectedTicketId) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTicketId(null)}
              className="gap-1.5 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">กลับ</span>
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-emerald-600 flex items-center justify-center">
                <Wrench className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-sm">รายละเอียดใบแจ้งซ่อม</span>
            </div>
          </div>
        </header>

        {/* Ticket Detail */}
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 w-full">
          <TicketDetail
            ticketId={selectedTicketId}
            onClose={() => setSelectedTicketId(null)}
            onUpdate={handleTicketUpdated}
          />
        </main>

        {/* Footer */}
        <footer className="border-t py-3 mt-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              <span>Surinhos Repair Tracking System</span>
            </div>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </footer>

        <Toaster position="top-right" richColors />
      </div>
    )
  }

  // List View
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
              <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold leading-tight truncate">🔧 ระบบแจ้งซ่อม</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight hidden xs:block">Surinhos Asset Management</p>
            </div>
          </div>
          <RepairForm onSubmit={handleRepairSubmitted} />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 w-full space-y-4 sm:space-y-6">
        {/* Stats — สถานะ 6 ขั้น + ทั้งหมด */}
        <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
          <Card className="border-l-4 border-l-gray-400">
            <CardContent className="p-2 sm:p-3 text-center">
              <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">ทั้งหมด</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-400">
            <CardContent className="p-2 sm:p-3 text-center">
              <p className="text-lg sm:text-2xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">รอรับเรื่อง</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-400">
            <CardContent className="p-2 sm:p-3 text-center">
              <p className="text-lg sm:text-2xl font-bold text-blue-600">{stats.accepted}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">รับเรื่องแล้ว</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-violet-400">
            <CardContent className="p-2 sm:p-3 text-center">
              <p className="text-lg sm:text-2xl font-bold text-violet-600">{stats.inProgress}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">กำลังซ่อม</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-400 hidden sm:block">
            <CardContent className="p-2 sm:p-3 text-center">
              <p className="text-lg sm:text-2xl font-bold text-emerald-600">{stats.returned}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">ส่งคืนแล้ว</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-gray-400 hidden sm:block">
            <CardContent className="p-2 sm:p-3 text-center">
              <p className="text-lg sm:text-2xl font-bold">{stats.closed}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">ปิดงาน</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-400 hidden lg:block">
            <CardContent className="p-2 sm:p-3 text-center">
              <p className="text-lg sm:text-2xl font-bold text-red-600">{stats.cancelled}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">ยกเลิก</p>
            </CardContent>
          </Card>
        </div>

        {/* Mobile: แสดง stats ที่ซ่อน (returned, closed) บนมือถือ */}
        <div className="sm:hidden grid grid-cols-3 gap-2">
          <Card className="border-l-4 border-l-emerald-400">
            <CardContent className="p-2 text-center">
              <p className="text-lg font-bold text-emerald-600">{stats.returned}</p>
              <p className="text-[10px] text-muted-foreground">ส่งคืนแล้ว</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-gray-400">
            <CardContent className="p-2 text-center">
              <p className="text-lg font-bold">{stats.closed}</p>
              <p className="text-[10px] text-muted-foreground">ปิดงาน</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-400">
            <CardContent className="p-2 text-center">
              <p className="text-lg font-bold text-red-600">{stats.cancelled}</p>
              <p className="text-[10px] text-muted-foreground">ยกเลิก</p>
            </CardContent>
          </Card>
        </div>

        {/* Repair List */}
        <RepairList
          refreshTrigger={refreshTrigger}
          onTicketClick={(id) => setSelectedTicketId(id)}
        />
      </main>

      {/* Footer */}
      <footer className="border-t py-3 sm:py-4 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            <span>Surinhos Repair Tracking System</span>
          </div>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </footer>

      <Toaster position="top-right" richColors />
    </div>
  )
}
