import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/repairs/[id] - ดึงข้อมูลใบแจ้งซ่อมตาม ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const ticket = await db.repairTicket.findUnique({
      where: { id },
      include: {
        asset: {
          select: {
            assetCode: true,
            name: true,
            category: true,
            price: true,
            location: {
              select: { buildingName: true, roomName: true },
            },
          },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'ไม่พบใบแจ้งซ่อม' }, { status: 404 })
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Error fetching repair:', error)
    return NextResponse.json({ error: 'Failed to fetch repair' }, { status: 500 })
  }
}
