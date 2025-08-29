export const revalidate = 300
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getRateCardRoles } from '@/lib/database'
import { rateCardTierSchema } from '@/lib/validations'

export async function GET() {
  try {
    const rateCard = await getRateCardRoles()

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

    const { supabase } = await import('@/lib/database')
    const results = []

    for (const tierData of body) {
      const validatedData = rateCardTierSchema.parse(tierData)
      
      // Try to update existing tier
      const { data: existingTier } = await supabase
        .from('rate_card_tiers')
        .select('id')
        .eq('roleId', validatedData.roleId)
        .eq('level', validatedData.level)
        .single()

      let result
      if (existingTier) {
        // Update existing
        const { data, error } = await supabase
          .from('rate_card_tiers')
          .update({
            pricePerDay: validatedData.pricePerDay,
            active: validatedData.active,
          })
          .eq('id', existingTier.id)
          .select()
          .single()

        if (error) throw error
        result = data
      } else {
        // Create new
        const { data, error } = await supabase
          .from('rate_card_tiers')
          .insert({
            roleId: validatedData.roleId,
            level: validatedData.level,
            pricePerDay: validatedData.pricePerDay,
            active: validatedData.active,
          })
          .select()
          .single()

        if (error) throw error
        result = data
      }
      
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
