import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT /api/repairs/[id]/close - ปิดงาน (returned → closed)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const ticket = await db.repairTicket.findUnique({ where: { id } })

    if (!ticket) {
      return NextResponse.json({ error: 'ไม่พบใบแจ้งซ่อม' }, { status: 404 })
    }

    if (ticket.status !== 'returned') {
      return NextResponse.json(
        { error: `ไม่สามารถปิดงานได้ เนื่องจากสถานะปัจจุบันคือ "${ticket.status}" (ต้องเป็น "returned")` },
        { status: 409 }
      )
    }

    const updated = await db.repairTicket.update({
      where: { id },
      data: {
        status: 'closed',
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
    console.error('Error closing repair:', error)
    return NextResponse.json({ error: 'Failed to close repair' }, { status: 500 })
  }
}
