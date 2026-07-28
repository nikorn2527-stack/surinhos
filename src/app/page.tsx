'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Wrench, Clock, CheckCircle2, Loader2, Building2, ClipboardCheck, PackageReturn } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Toaster } from '@/components/ui/sonner'
import { RepairForm } from '@/components/repair/repair-form'
import { RepairList } from '@/components/repair/repair-list'

interface Repair {
  id: string
  ticketNo: string
  status: string
  createdAt: string
}

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

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
  }

  const handleRepairSubmitted = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">🔧 ระบบแจ้งซ่อม (Repair Tracking)</h1>
              <p className="text-xs text-muted-foreground leading-tight">Surinhos Asset Management</p>
            </div>
          </div>
          <RepairForm onSubmit={handleRepairSubmitted} />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6">
        {/* Stats — สถานะ 5 ขั้น + ทั้งหมด */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="border-l-4 border-l-gray-400">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">ทั้งหมด</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-400">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">รอรับเรื่อง</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-400">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{stats.accepted}</p>
              <p className="text-xs text-muted-foreground">รับเรื่องแล้ว</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-violet-400">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{stats.inProgress}</p>
              <p className="text-xs text-muted-foreground">กำลังซ่อม</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-400">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{stats.returned}</p>
              <p className="text-xs text-muted-foreground">ส่งคืนแล้ว</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-gray-400">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{stats.closed}</p>
              <p className="text-xs text-muted-foreground">ปิดงาน</p>
            </CardContent>
          </Card>
        </div>

        {/* Repair List */}
        <RepairList refreshTrigger={refreshTrigger} />
      </main>

      {/* Footer */}
      <footer className="border-t py-4 mt-auto">
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
