import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT /api/repairs/[id]/progress - เริ่มดำเนินการซ่อม (accepted → in_progress)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { repairCost, laborCost, costStatus } = body

    const ticket = await db.repairTicket.findUnique({ where: { id } })

    if (!ticket) {
      return NextResponse.json({ error: 'ไม่พบใบแจ้งซ่อม' }, { status: 404 })
    }

    if (ticket.status !== 'accepted') {
      return NextResponse.json(
        { error: `ไม่สามารถเริ่มดำเนินการได้ เนื่องจากสถานะปัจจุบันคือ "${ticket.status}" (ต้องเป็น "accepted")` },
        { status: 409 }
      )
    }

    const rc = repairCost != null ? Number(repairCost) : null
    const lc = laborCost != null ? Number(laborCost) : null
    const tc = rc != null && lc != null ? rc + lc : rc != null ? rc : lc != null ? lc : null

    const updated = await db.repairTicket.update({
      where: { id },
      data: {
        status: 'in_progress',
        ...(rc != null && { repairCost: rc }),
        ...(lc != null && { laborCost: lc }),
        ...(tc != null && { totalCost: tc }),
        ...(costStatus && { costStatus }),
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
    console.error('Error updating repair progress:', error)
    return NextResponse.json({ error: 'Failed to update repair progress' }, { status: 500 })
  }
}
