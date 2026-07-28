import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/repairs - List all repairs with asset info
export async function GET() {
  try {
    const repairs = await db.repair.findMany({
      include: {
        asset: {
          select: {
            assetNo: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(repairs)
  } catch (error) {
    console.error('Error fetching repairs:', error)
    return NextResponse.json({ error: 'Failed to fetch repairs' }, { status: 500 })
  }
}

// POST /api/repairs - Create a new repair ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { assetId, problemCategory, description, urgency, reporterName, reporterPhone, reporterDept } = body

    // Validate required fields
    if (!assetId || !problemCategory || !description || !reporterName || !reporterPhone || !reporterDept) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      )
    }

    // Verify asset exists
    const asset = await db.asset.findUnique({ where: { id: assetId } })
    if (!asset) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลครุภัณฑ์ที่เลือก' },
        { status: 404 }
      )
    }

    // Generate ticket number: RPR-YYYY-NNN
    const now = new Date()
    const year = now.getFullYear()
    const count = await db.repair.count({
      where: {
        createdAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
    })
    const ticketNo = `RPR-${year}-${String(count + 1).padStart(3, '0')}`

    const repair = await db.repair.create({
      data: {
        ticketNo,
        assetId,
        problemCategory,
        description,
        urgency: urgency || 'ปกติ',
        reporterName,
        reporterPhone,
        reporterDept,
        status: 'pending',
      },
      include: {
        asset: {
          select: {
            assetNo: true,
            name: true,
            location: true,
          },
        },
      },
    })

    return NextResponse.json(repair, { status: 201 })
  } catch (error) {
    console.error('Error creating repair:', error)
    return NextResponse.json({ error: 'Failed to create repair' }, { status: 500 })
  }
}
