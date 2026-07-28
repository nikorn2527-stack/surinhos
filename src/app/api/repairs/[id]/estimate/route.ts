import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const VALID_COST_STATUSES = ['pending', 'approved', 'rejected']

// PUT /api/repairs/[id]/estimate - เสนอราคาซ่อม / อนุมัติค่าใช้จ่าย
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { repairCost, laborCost, costStatus } = body

    if (repairCost == null || laborCost == null || !costStatus) {
      return NextResponse.json(
        { error: 'กรุณาระบุค่าอะไหล่ ค่าแรง และสถานะอนุมัติให้ครบถ้วน' },
        { status: 400 }
      )
    }

    if (!VALID_COST_STATUSES.includes(costStatus)) {
      return NextResponse.json(
        { error: `costStatus ต้องเป็นหนึ่งใน ${VALID_COST_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const ticket = await db.repairTicket.findUnique({ where: { id } })

    if (!ticket) {
      return NextResponse.json({ error: 'ไม่พบใบแจ้งซ่อม' }, { status: 404 })
    }

    if (ticket.status !== 'in_progress') {
      return NextResponse.json(
        { error: `ไม่สามารถเสนอราคาได้ เนื่องจากสถานะปัจจุบันคือ "${ticket.status}" (ต้องเป็น "in_progress")` },
        { status: 409 }
      )
    }

    const rc = Number(repairCost)
    const lc = Number(laborCost)
    const tc = rc + lc

    const updateData: Record<string, unknown> = {
      repairCost: rc,
      laborCost: lc,
      totalCost: tc,
      costStatus,
    }

    // ถ้าประเมินราคาไม่อนุมัติ ให้ยกเลิกใบแจ้งซ่อม
    if (costStatus === 'rejected') {
      updateData.status = 'cancelled'
      updateData.cancelReason = 'เสนอราคาไม่อนุมัติ'
    }

    const updated = await db.repairTicket.update({
      where: { id },
      data: updateData,
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
    console.error('Error updating estimate:', error)
    return NextResponse.json({ error: 'Failed to update estimate' }, { status: 500 })
  }
}
