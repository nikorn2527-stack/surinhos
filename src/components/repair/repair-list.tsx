'use client'

import { useQuery } from '@tanstack/react-query'
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

const statusDot: Record<string, string> = {
  pending: 'bg-amber-400',
  accepted: 'bg-blue-400',
  in_progress: 'bg-violet-400',
  returned: 'bg-emerald-400',
  closed: 'bg-gray-400',
  cancelled: 'bg-red-400',
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
      <div className="space-y-1.5 px-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-10 text-gray-300">
        <Wrench className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">📋 ยังไม่มีรายการแจ้งซ่อม</p>
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {tickets.map((ticket) => (
        <button
          key={ticket.id}
          onClick={() => onTicketClick(ticket.id)}
          className="ticket-row w-full text-left px-3 py-3 rounded-lg group"
        >
          {/* Row header: dot + ticket number + date */}
          <div className="flex items-center gap-3 mb-1">
            <div className={`status-dot ${statusDot[ticket.status] || 'bg-gray-400'}`} />
            <span className="text-[13px] font-semibold text-gray-800 font-mono">
              {ticket.ticketNo}
            </span>
            <span className="ml-auto text-[11px] text-gray-400">
              {formatDate(ticket.createdAt).split(' ')[0]}
            </span>
          </div>
          {/* Asset info */}
          <div className="pl-5">
            <p className="text-[13px] text-gray-700 truncate">
              {ticket.assetName}
            </p>
            <p className="text-[11px] text-gray-400 truncate mt-0.5">
              {ticket.asset?.assetCode || '-'}
              {ticket.asset?.location
                ? ` · ${ticket.asset.location.buildingName}, ${ticket.asset.location.roomName}`
                : ''}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}
