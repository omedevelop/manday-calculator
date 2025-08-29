import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { projectSchema } from '@/lib/validations'
import { getProject, updateProject, deleteProject } from '@/lib/database'
import { ZodError } from 'zod'

/**
 * Helper function to build update data object from validated input
 * Reduces cognitive complexity by extracting conditional field mapping logic
 */
function buildUpdateData(validatedData: any) {
  const updateData: any = {}
  
  // Map each field if it exists in the validated data
  const fieldMappings = [
    'name', 'client', 'currencyCode', 'currencySymbol', 'hoursPerDay',
    'pricingMode', 'fxNote', 'workingWeek', 'startDate', 'endDate'
  ]
  
  // Handle simple field mappings
  fieldMappings.forEach(field => {
    if (validatedData[field]) {
      updateData[field] = validatedData[field]
    }
  })
  
  // Handle fields that can be explicitly set to false/0/null
  const nullableFields = [
    'taxEnabled', 'taxPercent', 'proposedPrice', 'targetRoiPercent',
    'targetMarginPercent', 'executionDays', 'bufferDays', 'finalDays',
    'calendarMode'
  ]
  
  nullableFields.forEach(field => {
    if (validatedData[field] !== undefined) {
      updateData[field] = validatedData[field]
    }
  })
  
  return updateData
}

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
    
    // Build update data using helper function
    const updateData = buildUpdateData(validatedData)
    
    // Update project
    const project = await updateProject(params.id, updateData)

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
