'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Wrench, ClipboardList, AlertCircle, CheckCircle2, Loader2, Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Toaster } from '@/components/ui/sonner'
import { RepairForm } from '@/components/repair/repair-form'
import { RepairList } from '@/components/repair/repair-list'

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

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const { data: repairs = [] } = useQuery<Repair[]>({
    queryKey: ['repairs', refreshTrigger],
    queryFn: async () => {
      const res = await fetch('/api/repairs')
      return res.json()
    },
  })

  const stats = {
    total: repairs.length,
    pending: repairs.filter((r) => r.status === 'pending').length,
    inProgress: repairs.filter((r) => r.status === 'in_progress').length,
    completed: repairs.filter((r) => r.status === 'completed').length,
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
              <h1 className="text-lg font-bold leading-tight">ระบบแจ้งซ่อมอุปกรณ์</h1>
              <p className="text-xs text-muted-foreground leading-tight">Repair Tracking System</p>
            </div>
          </div>
          <RepairForm onSubmit={handleRepairSubmitted} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">ทั้งหมด</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">รอดำเนินการ</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-sky-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                  <p className="text-xs text-muted-foreground">กำลังดำเนินการ</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                  <p className="text-xs text-muted-foreground">เสร็จสิ้น</p>
                </div>
              </div>
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
