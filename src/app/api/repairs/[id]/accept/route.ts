import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT /api/repairs/[id]/accept - รับเรื่องแจ้งซ่อม (pending → accepted)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { receivedBy, receiverSignature } = body

    if (!receivedBy) {
      return NextResponse.json(
        { error: 'กรุณาระบุชื่อผู้รับเรื่อง' },
        { status: 400 }
      )
    }

    const ticket = await db.repairTicket.findUnique({ where: { id } })

    if (!ticket) {
      return NextResponse.json({ error: 'ไม่พบใบแจ้งซ่อม' }, { status: 404 })
    }

    if (ticket.status !== 'pending') {
      return NextResponse.json(
        { error: `ไม่สามารถรับเรื่องได้ เนื่องจากสถานะปัจจุบันคือ "${ticket.status}" (ต้องเป็น "pending")` },
        { status: 409 }
      )
    }

    const updated = await db.repairTicket.update({
      where: { id },
      data: {
        status: 'accepted',
        receivedBy,
        receivedAt: new Date(),
        ...(receiverSignature && { receiverSignature }),
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
    console.error('Error accepting repair:', error)
    return NextResponse.json({ error: 'Failed to accept repair' }, { status: 500 })
  }
}
