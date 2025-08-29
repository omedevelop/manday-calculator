import { NextRequest, NextResponse } from 'next/server'
import { updateTeamMember, deleteTeamMember } from '@/lib/database'
import { TeamMemberUpdateSchema } from '@/lib/validators/team'
import { ZodError } from 'zod'

export const runtime = 'edge'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = TeamMemberUpdateSchema.parse({ ...body, id: params.id })

    // Update team member
    const teamMember = await updateTeamMember(params.id, {
      name: validatedData.name,
      roleId: validatedData.roleId,
      roleName: validatedData.roleName,
      level: validatedData.level,
      defaultRatePerDay: validatedData.defaultRatePerDay,
      notes: validatedData.notes,
      status: validatedData.status,
    })

    return NextResponse.json(teamMember)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    if (error instanceof Error && error.message.includes('No rows')) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }
    
    console.error('Error updating team member:', error)
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete team member (includes reference check)
    await deleteTeamMember(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('referenced by projects')) {
        return NextResponse.json(
          { 
            error: 'Cannot delete team member',
            message: 'This team member is referenced by one or more projects. Please deactivate the member instead.',
            code: 'REFERENCED_BY_PROJECTS'
          },
          { status: 409 }
        )
      }
      
      if (error.message.includes('No rows')) {
        return NextResponse.json(
          { error: 'Team member not found' },
          { status: 404 }
        )
      }
    }
    
    console.error('Error deleting team member:', error)
    return NextResponse.json(
      { error: 'Failed to delete team member' },
      { status: 500 }
    )
  }
}
