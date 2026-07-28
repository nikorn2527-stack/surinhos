import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/assets?q=searchterm - ค้นหาครุภัณฑ์จาก asset_code หรือ name (เชื่อม location)
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim() || ''

    const assets = await db.asset.findMany({
      where: q
        ? {
            AND: [
              { status: 'ปกติ' },
              {
                OR: [
                  { assetCode: { contains: q } },
                  { name: { contains: q } },
                ],
              },
            ],
          }
        : { status: 'ปกติ' },
      include: {
        location: {
          select: { buildingName: true, roomName: true },
        },
      },
      orderBy: { assetCode: 'asc' },
      take: 20,
    })

    return NextResponse.json(assets)
  } catch (error) {
    console.error('Error searching assets:', error)
    return NextResponse.json({ error: 'Failed to search assets' }, { status: 500 })
  }
}
