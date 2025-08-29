import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { projectSchema } from '@/lib/validations'
import { calculateTotals } from '@/lib/calculations'

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        people: {
          include: {
            teamMember: true,
            role: true,
          },
        },
        holidays: true,
        summary: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json(projects)
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
    const project = await prisma.project.create({
      data: {
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
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        workingWeek: validatedData.workingWeek,
      },
      include: {
        people: true,
        holidays: true,
      },
    })

    // Calculate initial summary if people exist
    if (project.people.length > 0) {
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

      await prisma.projectSummary.create({
        data: {
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
