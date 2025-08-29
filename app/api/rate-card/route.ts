export const revalidate = 300
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rateCardTierSchema } from '@/lib/validations'

export async function GET() {
  try {
    const rateCard = await prisma.rateCardRole.findMany({
      include: {
        tiers: {
          where: { active: true },
          orderBy: { level: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    const res = NextResponse.json(rateCard)
    res.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    return res
  } catch (error) {
    console.error('Error fetching rate card:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rate card' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Expected array of rate card tiers' },
        { status: 400 }
      )
    }

    const results = []

    for (const tierData of body) {
      const validatedData = rateCardTierSchema.parse(tierData)
      
      const result = await prisma.rateCardTier.upsert({
        where: {
          roleId_level: {
            roleId: validatedData.roleId,
            level: validatedData.level,
          },
        },
        update: {
          pricePerDay: validatedData.pricePerDay,
          active: validatedData.active,
        },
        create: {
          roleId: validatedData.roleId,
          level: validatedData.level,
          pricePerDay: validatedData.pricePerDay,
          active: validatedData.active,
        },
      })
      
      results.push(result)
    }

    return NextResponse.json(results)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      )
    }
    
    console.error('Error updating rate card:', error)
    return NextResponse.json(
      { error: 'Failed to update rate card' },
      { status: 500 }
    )
  }
}
