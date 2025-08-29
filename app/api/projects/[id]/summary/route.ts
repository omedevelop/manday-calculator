import { NextRequest, NextResponse } from 'next/server'
import { calculateTotals } from '@/lib/calculations'
import { getProjectSummary, upsertProjectSummary } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await getProjectSummary(params.id)

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Calculate totals
    const calculationInput = {
      rows: project.people.map((person: any) => ({
        pricePerDay: Number(person.pricePerDay),
        allocatedDays: Number(person.allocatedDays),
        utilizationPercent: Number(person.utilizationPercent),
        nonBillable: person.nonBillable,
        weekendMultiplier: person.weekendMultiplier ? Number(person.weekendMultiplier) : null,
        holidayMultiplier: person.holidayMultiplier ? Number(person.holidayMultiplier) : null,
      })),
      taxEnabled: project.taxEnabled ?? false,
      taxPercent: Number(project.taxPercent ?? 0),
      pricingMode: project.pricingMode ?? 'DIRECT',
      proposed: project.proposedPrice ? Number(project.proposedPrice) : null,
      targetROI: project.targetRoiPercent ? Number(project.targetRoiPercent) : null,
      targetMargin: project.targetMarginPercent ? Number(project.targetMarginPercent) : null,
    }

    const totals = calculateTotals(calculationInput)

    // Update or create summary
    const summary = await upsertProjectSummary({
      projectId: project.id,
      subtotal: totals.subtotal,
      tax: totals.tax,
      cost: totals.cost,
      proposedPrice: totals.proposed,
      roiPercent: totals.roiPercent,
      marginPercent: totals.marginPercent,
      currencyCode: project.currencyCode ?? 'THB',
    })

    return NextResponse.json({
      ...summary,
      calculationInput,
      totals,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Project not found') {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }
    
    console.error('Error calculating project summary:', error)
    return NextResponse.json(
      { error: 'Failed to calculate project summary' },
      { status: 500 }
    )
  }
}
