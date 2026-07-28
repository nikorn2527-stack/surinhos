import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/repairs - ดึงรายการแจ้งซ่อมทั้งหมด
export async function GET() {
  try {
    const tickets = await db.repairTicket.findMany({
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
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tickets)
  } catch (error) {
    console.error('Error fetching repairs:', error)
    return NextResponse.json({ error: 'Failed to fetch repairs' }, { status: 500 })
  }
}

// POST /api/repairs - สร้างใบแจ้งซ่อมใหม่ (สถานะ: pending)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assetCode, assetName, problemDetails, reporterName, photos } = body

    if (!assetName || !reporterName) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      )
    }

    // สร้างเลข Ticket (รูปแบบ: RPR-YYMMDD-NNN)
    const today = new Date()
    const yy = String(today.getFullYear()).slice(-2)
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const dateStr = `${yy}${mm}${dd}`

    const countResult = await db.repairTicket.count({
      where: {
        ticketNo: { startsWith: `RPR-${dateStr}-` },
      },
    })

    const nextSeq = String(countResult + 1).padStart(3, '0')
    const ticketNo = `RPR-${dateStr}-${nextSeq}`

    // หา asset_id ถ้ามี assetCode
    let assetId: string | null = null
    if (assetCode) {
      const asset = await db.asset.findUnique({ where: { assetCode } })
      if (asset) {
        assetId = asset.id
      }
    }

    const ticket = await db.repairTicket.create({
      data: {
        ticketNo,
        assetId,
        assetName,
        problemDetails,
        reporterName,
        photos: photos || null,
        status: 'pending',
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

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error('Error creating repair:', error)
    return NextResponse.json({ error: 'Failed to create repair' }, { status: 500 })
  }
}
