export const revalidate = 60
import { NextRequest, NextResponse } from 'next/server'
import { projectSchema } from '@/lib/validations'
import { calculateTotals } from '@/lib/calculations'
import { getProjects, createProject, upsertProjectSummary } from '@/lib/database'

export async function GET() {
  try {
    const projects = await getProjects()

    const res = NextResponse.json(projects)
    res.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    return res
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = projectSchema.parse(body)
    
    // Create project
    const project = await createProject({
      name: validatedData.name,
      client: validatedData.client,
      currencyCode: validatedData.currencyCode,
      currencySymbol: validatedData.currencySymbol,
      hoursPerDay: validatedData.hoursPerDay,
      taxEnabled: validatedData.taxEnabled,
      taxPercent: validatedData.taxPercent,
      pricingMode: validatedData.pricingMode,
      proposedPrice: validatedData.proposedPrice,
      targetRoiPercent: validatedData.targetRoiPercent,
      targetMarginPercent: validatedData.targetMarginPercent,
      fxNote: validatedData.fxNote,
      executionDays: validatedData.executionDays,
      bufferDays: validatedData.bufferDays,
      finalDays: validatedData.finalDays,
      calendarMode: validatedData.calendarMode,
      startDate: validatedData.startDate ? validatedData.startDate : null,
      endDate: validatedData.endDate ? validatedData.endDate : null,
      workingWeek: validatedData.workingWeek,
    })

    // Calculate initial summary if people exist
    if (project.people && project.people.length > 0) {
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

      await upsertProjectSummary({
        projectId: project.id,
        subtotal: totals.subtotal,
        tax: totals.tax,
        cost: totals.cost,
        proposedPrice: totals.proposed,
        roiPercent: totals.roiPercent,
        marginPercent: totals.marginPercent,
        currencyCode: project.currencyCode ?? 'THB',
      })
    }

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      )
    }
    
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
