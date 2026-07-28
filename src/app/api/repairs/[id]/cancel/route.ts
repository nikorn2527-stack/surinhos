import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const CANCELLABLE_STATUSES = ['pending', 'accepted', 'in_progress']

// PUT /api/repairs/[id]/cancel - ยกเลิกใบแจ้งซ่อม (ไม่คุ้มซ่อม)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { cancelReason } = body

    if (!cancelReason) {
      return NextResponse.json(
        { error: 'กรุณาระบุเหตุผลการยกเลิก' },
        { status: 400 }
      )
    }

    const ticket = await db.repairTicket.findUnique({ where: { id } })

    if (!ticket) {
      return NextResponse.json({ error: 'ไม่พบใบแจ้งซ่อม' }, { status: 404 })
    }

    if (!CANCELLABLE_STATUSES.includes(ticket.status)) {
      return NextResponse.json(
        { error: `ไม่สามารถยกเลิกได้ เนื่องจากสถานะปัจจุบันคือ "${ticket.status}" (ยกเลิกได้เฉพาะ pending, accepted, in_progress)` },
        { status: 409 }
      )
    }

    const updated = await db.repairTicket.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelReason,
      },
      include: {
        asset: {
          select: {
            assetCode: true,
            name: true,
            category: true,
            location: {
              select: { buildingName: true, roomName: true },
            },
          },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error cancelling repair:', error)
    return NextResponse.json({ error: 'Failed to cancel repair' }, { status: 500 })
  }
}
