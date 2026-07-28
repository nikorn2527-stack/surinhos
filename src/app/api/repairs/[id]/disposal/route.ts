import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// สถานะที่สามารถตีแทงจำหน่ายได้: pending, accepted, in_progress
const DISPOSABLE_STATUSES = ['pending', 'accepted', 'in_progress']

// PUT /api/repairs/[id]/disposal - ตีแทงจำหน่ายครุภัณฑ์ (งานภาครัฐ)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      disposalReason,
      disposalMethod,
      disposalValue,
      disposalApprovedBy,
      disposalComRef,
    } = body

    if (!disposalReason || !disposalMethod) {
      return NextResponse.json(
        { error: 'กรุณาระบุเหตุผลและวิธีจำหน่าย' },
        { status: 400 }
      )
    }

    const validMethods = ['จำหน่าย/ชำระ', 'ทำลาย', 'บริจาค']
    if (!validMethods.includes(disposalMethod)) {
      return NextResponse.json(
        { error: `วิธีจำหน่ายไม่ถูกต้อง ต้องเป็น: ${validMethods.join(', ')}` },
        { status: 400 }
      )
    }

    const ticket = await db.repairTicket.findUnique({ where: { id } })

    if (!ticket) {
      return NextResponse.json({ error: 'ไม่พบใบแจ้งซ่อม' }, { status: 404 })
    }

    if (!DISPOSABLE_STATUSES.includes(ticket.status)) {
      return NextResponse.json(
        {
          error: `ไม่สามารถตีแทงจำหน่ายได้ เนื่องจากสถานะปัจจุบันคือ "${ticket.status}" (ทำได้เฉพาะ pending, accepted, in_progress)`,
        },
        { status: 409 }
      )
    }

    const updated = await db.repairTicket.update({
      where: { id },
      data: {
        status: 'disposed',
        disposalStatus: 'pending_review',
        disposalReason,
        disposalMethod,
        disposalValue: disposalValue != null ? Number(disposalValue) : null,
        disposalApprovedBy: disposalApprovedBy || null,
        disposalComRef: disposalComRef || null,
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
    console.error('Error disposing asset:', error)
    return NextResponse.json({ error: 'Failed to dispose asset' }, { status: 500 })
  }
}

// PATCH /api/repairs/[id]/disposal - อัพเดทสถานะตีแทงจำหน่าย
// (เช่น อนุมัติ, จำหน่ายเสร็จ)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { disposalStatus } = body

    if (!disposalStatus || !['pending_review', 'approved', 'disposed'].includes(disposalStatus)) {
      return NextResponse.json(
        { error: 'สถานะไม่ถูกต้อง ต้องเป็น: pending_review, approved, disposed' },
        { status: 400 }
      )
    }

    const ticket = await db.repairTicket.findUnique({ where: { id } })

    if (!ticket) {
      return NextResponse.json({ error: 'ไม่พบใบแจ้งซ่อม' }, { status: 404 })
    }

    if (ticket.status !== 'disposed') {
      return NextResponse.json(
        { error: 'ใบแจ้งซ่อมนี้ไม่ได้อยู่ในสถานะตีแทงจำหน่าย' },
        { status: 409 }
      )
    }

    const updated = await db.repairTicket.update({
      where: { id },
      data: {
        disposalStatus,
        // ถ้าจำหน่ายแล้ว อัพเดทสถานะที่ Asset ด้วย
        ...(disposalStatus === 'disposed' && ticket.assetId ? {
          asset: {
            update: {
              status: 'จำหน่ายแล้ว',
            },
          },
        } : {}),
      },
      include: {
        asset: {
          select: {
            assetCode: true,
            name: true,
            category: true,
            status: true,
            location: {
              select: { buildingName: true, roomName: true },
            },
          },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating disposal status:', error)
    return NextResponse.json({ error: 'Failed to update disposal status' }, { status: 500 })
  }
}
