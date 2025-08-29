import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
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

    // Check if team member exists
    const existingMember = await prisma.teamMember.findUnique({
      where: { id: params.id }
    })

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    // Update team member
    const teamMember = await prisma.teamMember.update({
      where: { id: params.id },
      data: {
        name: validatedData.name,
        roleId: validatedData.roleId,
        roleName: validatedData.roleName,
        level: validatedData.level,
        defaultRatePerDay: validatedData.defaultRatePerDay,
        notes: validatedData.notes,
        status: validatedData.status,
      },
      include: {
        role: true,
      },
    })

    return NextResponse.json(teamMember)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
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
    // Check if team member exists
    const existingMember = await prisma.teamMember.findUnique({
      where: { id: params.id },
      include: {
        projectPeople: true
      }
    })

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    // Check if team member is referenced by any projects
    if (existingMember.projectPeople.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete team member',
          message: 'This team member is referenced by one or more projects. Please deactivate the member instead.',
          code: 'REFERENCED_BY_PROJECTS'
        },
        { status: 409 }
      )
    }

    // Delete team member
    await prisma.teamMember.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting team member:', error)
    return NextResponse.json(
      { error: 'Failed to delete team member' },
      { status: 500 }
    )
  }
}
