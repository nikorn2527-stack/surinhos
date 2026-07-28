import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/assets?q=searchterm - Search assets by asset number or name
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim() || ''

    const assets = await db.asset.findMany({
      where: q
        ? {
            AND: [
              { status: 'active' },
              {
                OR: [
                  { assetNo: { contains: q } },
                  { name: { contains: q } },
                ],
              },
            ],
          }
        : { status: 'active' },
      orderBy: { assetNo: 'asc' },
      take: 20,
    })

    return NextResponse.json(assets)
  } catch (error) {
    console.error('Error searching assets:', error)
    return NextResponse.json({ error: 'Failed to search assets' }, { status: 500 })
  }
}
