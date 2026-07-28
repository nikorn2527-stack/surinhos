import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT /api/repairs/[id]/return - ส่งคืนครุภัณฑ์ (in_progress → returned)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { returnMethod, returnedBy, returnSenderSignature, returnReceiverSignature } = body

    if (!returnMethod || !returnedBy) {
      return NextResponse.json(
        { error: 'กรุณาระบุวิธีการส่งคืนและผู้ที่ส่งคืน' },
        { status: 400 }
      )
    }

    const ticket = await db.repairTicket.findUnique({ where: { id } })

    if (!ticket) {
      return NextResponse.json({ error: 'ไม่พบใบแจ้งซ่อม' }, { status: 404 })
    }

    if (ticket.status !== 'in_progress') {
      return NextResponse.json(
        { error: `ไม่สามารถส่งคืนได้ เนื่องจากสถานะปัจจุบันคือ "${ticket.status}" (ต้องเป็น "in_progress")` },
        { status: 409 }
      )
    }

    const updated = await db.repairTicket.update({
      where: { id },
      data: {
        status: 'returned',
        returnMethod,
        returnedBy,
        returnedAt: new Date(),
        ...(returnSenderSignature && { returnSenderSignature }),
        ...(returnReceiverSignature && { returnReceiverSignature }),
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
    console.error('Error returning repair:', error)
    return NextResponse.json({ error: 'Failed to return repair' }, { status: 500 })
  }
}
