import { NextRequest, NextResponse } from 'next/server'
import { projectSchema } from '@/lib/validations'
import { getProject, updateProject, deleteProject } from '@/lib/database'
import { ZodError } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await getProject(params.id)

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(project)
  } catch (error) {
    if (error instanceof Error && error.message === 'Project not found') {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }
    
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = projectSchema.partial().parse(body)
    
    // Update project
    const project = await updateProject(params.id, {
      ...(validatedData.name && { name: validatedData.name }),
      ...(validatedData.client && { client: validatedData.client }),
      ...(validatedData.currencyCode && { currencyCode: validatedData.currencyCode }),
      ...(validatedData.currencySymbol && { currencySymbol: validatedData.currencySymbol }),
      ...(validatedData.hoursPerDay && { hoursPerDay: validatedData.hoursPerDay }),
      ...(validatedData.taxEnabled !== undefined && { taxEnabled: validatedData.taxEnabled }),
      ...(validatedData.taxPercent !== undefined && { taxPercent: validatedData.taxPercent }),
      ...(validatedData.pricingMode && { pricingMode: validatedData.pricingMode }),
      ...(validatedData.proposedPrice !== undefined && { proposedPrice: validatedData.proposedPrice }),
      ...(validatedData.targetRoiPercent !== undefined && { targetRoiPercent: validatedData.targetRoiPercent }),
      ...(validatedData.targetMarginPercent !== undefined && { targetMarginPercent: validatedData.targetMarginPercent }),
      ...(validatedData.fxNote !== undefined && { fxNote: validatedData.fxNote }),
      ...(validatedData.executionDays !== undefined && { executionDays: validatedData.executionDays }),
      ...(validatedData.bufferDays !== undefined && { bufferDays: validatedData.bufferDays }),
      ...(validatedData.finalDays !== undefined && { finalDays: validatedData.finalDays }),
      ...(validatedData.calendarMode !== undefined && { calendarMode: validatedData.calendarMode }),
      ...(validatedData.startDate !== undefined && { startDate: validatedData.startDate }),
      ...(validatedData.endDate !== undefined && { endDate: validatedData.endDate }),
      ...(validatedData.workingWeek && { workingWeek: validatedData.workingWeek }),
    })

    return NextResponse.json(project)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    if (error instanceof Error && error.message === 'Project not found') {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }
    
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteProject(params.id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Project not found') {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }
    
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
