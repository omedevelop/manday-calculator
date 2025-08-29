import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { BulkActionSchema } from '@/lib/validators/team'
import { ZodError } from 'zod'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ids } = BulkActionSchema.parse(body)

    let result: any

    switch (action) {
      case 'activate':
        result = await prisma.teamMember.updateMany({
          where: { id: { in: ids } },
          data: { status: 'ACTIVE' }
        })
        break

      case 'deactivate':
        result = await prisma.teamMember.updateMany({
          where: { id: { in: ids } },
          data: { status: 'INACTIVE' }
        })
        break

      case 'delete':
        // Check if any members are referenced by projects
        const membersWithProjects = await prisma.teamMember.findMany({
          where: { 
            id: { in: ids },
            projectPeople: { some: {} }
          },
          select: { id: true, name: true }
        })

        if (membersWithProjects.length > 0) {
          return NextResponse.json(
            { 
              error: 'Cannot delete team members',
              message: 'Some team members are referenced by projects. Please deactivate them instead.',
              code: 'REFERENCED_BY_PROJECTS',
              referencedMembers: membersWithProjects
            },
            { status: 409 }
          )
        }

        result = await prisma.teamMember.deleteMany({
          where: { id: { in: ids } }
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      action,
      affected: result.count
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error performing bulk action:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    )
  }
}
