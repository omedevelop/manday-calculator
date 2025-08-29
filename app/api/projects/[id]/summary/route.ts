import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateTotals } from '@/lib/calculations'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        people: true,
        summary: true,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Calculate totals
    const calculationInput = {
      rows: project.people.map(person => ({
        pricePerDay: Number(person.pricePerDay),
        allocatedDays: Number(person.allocatedDays),
        utilizationPercent: Number(person.utilizationPercent),
        nonBillable: person.nonBillable,
        weekendMultiplier: person.weekendMultiplier ? Number(person.weekendMultiplier) : null,
        holidayMultiplier: person.holidayMultiplier ? Number(person.holidayMultiplier) : null,
      })),
      taxEnabled: project.taxEnabled,
      taxPercent: project.taxPercent || 0,
      pricingMode: project.pricingMode,
      proposed: project.proposedPrice ? Number(project.proposedPrice) : null,
      targetROI: project.targetRoiPercent ? Number(project.targetRoiPercent) : null,
      targetMargin: project.targetMarginPercent ? Number(project.targetMarginPercent) : null,
    }

    const totals = calculateTotals(calculationInput)

    // Update or create summary
    const summary = await prisma.projectSummary.upsert({
      where: { projectId: project.id },
      update: {
        subtotal: totals.subtotal,
        tax: totals.tax,
        cost: totals.cost,
        proposedPrice: totals.proposed,
        roiPercent: totals.roiPercent,
        marginPercent: totals.marginPercent,
        currencyCode: project.currencyCode,
      },
      create: {
        projectId: project.id,
        subtotal: totals.subtotal,
        tax: totals.tax,
        cost: totals.cost,
        proposedPrice: totals.proposed,
        roiPercent: totals.roiPercent,
        marginPercent: totals.marginPercent,
        currencyCode: project.currencyCode,
      },
    })

    return NextResponse.json({
      ...summary,
      calculationInput,
      totals,
    })
  } catch (error) {
    console.error('Error calculating project summary:', error)
    return NextResponse.json(
      { error: 'Failed to calculate project summary' },
      { status: 500 }
    )
  }
}
