'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Wrench, ArrowLeft, Building2, Loader2, Search } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

const statusDot: Record<string, string> = {
  pending: 'bg-amber-400',
  accepted: 'bg-blue-400',
  in_progress: 'bg-violet-400',
  returned: 'bg-emerald-400',
  closed: 'bg-gray-400',
  cancelled: 'bg-red-400',
}

const statusBg: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600',
  accepted: 'bg-blue-50 text-blue-600',
  in_progress: 'bg-violet-50 text-violet-600',
  returned: 'bg-emerald-50 text-emerald-600',
  closed: 'bg-gray-50 text-gray-600',
  cancelled: 'bg-red-50 text-red-600',
}

const shortLabel: Record<string, string> = {
  pending: 'รอ',
  accepted: 'รับ',
  in_progress: 'ซ่อม',
  returned: 'ส่ง',
  closed: 'ปิด',
  cancelled: 'ยก',
}

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: tickets = [] } = useQuery<Repair[]>({
    queryKey: ['repairs-stats', refreshTrigger],
    queryFn: async () => {
      const res = await fetch('/api/repairs')
      return res.json()
    },
  })

  const filteredTickets = searchQuery
    ? tickets.filter(
        (t) =>
          t.ticketNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.status.includes(searchQuery.toLowerCase())
      )
    : tickets

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

  return (
    <div className="app-shell">
      {/* ===== SIDEBAR ===== */}
      <aside className="app-sidebar bg-white">
        {/* Desktop header */}
        <div className="app-header-desktop items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-sm">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-gray-900 leading-tight">ระบบแจ้งซ่อม</h1>
              <p className="text-[11px] text-gray-400 leading-tight">Surinhos Asset Management</p>
            </div>
          </div>
          <RepairForm onSubmit={handleRepairSubmitted} />
        </div>

        {/* Mobile header */}
        <div className="app-header-mobile items-center justify-between px-4 h-14 border-b border-gray-100 sticky top-0 bg-white z-30">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <Wrench className="h-3.5 w-3.5 text-white" />
            </div>
            <h1 className="text-sm font-bold">ระบบแจ้งซ่อม</h1>
          </div>
          <RepairForm onSubmit={handleRepairSubmitted} />
        </div>

        {/* Stats */}
        <div className="px-4 lg:px-5 pt-4 pb-2">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { k: 'total', v: stats.total, label: 'ทั้งหมด', cls: 'bg-gray-50 text-gray-800' },
              { k: 'pending', v: stats.pending, label: shortLabel.pending, cls: statusBg.pending },
              { k: 'accepted', v: stats.accepted, label: shortLabel.accepted, cls: statusBg.accepted },
              { k: 'inProgress', v: stats.inProgress, label: shortLabel.in_progress, cls: statusBg.in_progress },
              { k: 'returned', v: stats.returned, label: shortLabel.returned, cls: statusBg.returned },
              { k: 'closed', v: stats.closed, label: shortLabel.closed, cls: statusBg.closed },
              { k: 'cancelled', v: stats.cancelled, label: shortLabel.cancelled, cls: statusBg.cancelled },
            ]
              .filter((s) => s.v > 0)
              .map((s) => (
                <div key={s.k} className="flex flex-col items-center px-3 py-1.5 rounded-lg shrink-0 min-w-[44px]">
                  <span className="text-base font-bold">{s.v}</span>
                  <span className="text-[10px] text-gray-400">{s.label}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 lg:px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
            <Input
              placeholder="ค้นหาเลขที่, สถานะ..."
              className="pl-9 h-9 text-sm border-gray-200 bg-gray-50/50 focus:ring-emerald-500/20 focus:border-emerald-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Ticket list (sidebar only for desktop, or main for mobile) */}
        <div className="sidebar-list px-2 lg:px-3 pb-4 flex-1">
          <RepairList
            refreshTrigger={refreshTrigger}
            onTicketClick={(id) => setSelectedTicketId(id)}
          />
        </div>

        {/* Mobile footer */}
        <div className="app-footer-mobile items-center justify-center py-3 border-t border-gray-100 text-[11px] text-gray-400">
          <Building2 className="h-3 w-3 mr-1" />
          Surinhos Repair Tracking · © {new Date().getFullYear()}
        </div>
      </aside>

      {/* ===== DETAIL PANEL (desktop) ===== */}
      {selectedTicketId && (
        <main className="app-main" id="detail-area">
          <div className="app-header-desktop items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>รายการแจ้งซ่อม</span>
              <span className="text-gray-300">›</span>
              <span className="text-gray-700 font-medium">{selectedTicketId.slice(0, 8)}...</span>
            </div>
          </div>
          <div className="p-6 lg:p-8">
            <TicketDetail
              ticketId={selectedTicketId}
              onClose={() => setSelectedTicketId(null)}
              onUpdate={handleTicketUpdated}
            />
          </div>
        </main>
      )}

      {!selectedTicketId && (
        <main className="app-main flex items-center justify-center bg-gray-50/50">
          <div className="text-center text-gray-300">
            <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">เลือกรายการเพื่อดูรายละเอียด</p>
          </div>
        </main>
      )}

      {/* Desktop footer */}
      <div className="hidden lg:flex items-center justify-between px-8 py-3 border-t border-gray-100 text-[11px] text-gray-400 bg-white app-footer-desktop">
        <div className="flex items-center gap-1.5">
          <Building2 className="h-3 w-3" />
          <span>Surinhos Repair Tracking System</span>
        </div>
        <span>&copy; {new Date().getFullYear()}</span>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  )
}
