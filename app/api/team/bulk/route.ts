import { NextRequest, NextResponse } from 'next/server'
import { bulkUpdateTeamMembers, bulkDeleteTeamMembers } from '@/lib/database'
import { BulkActionSchema } from '@/lib/validators/team'
import { ZodError } from 'zod'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ids } = BulkActionSchema.parse(body)

    let result: { affected: number }

    switch (action) {
      case 'activate':
        result = await bulkUpdateTeamMembers(ids, { status: 'ACTIVE' })
        break

      case 'deactivate':
        result = await bulkUpdateTeamMembers(ids, { status: 'INACTIVE' })
        break

      case 'delete':
        result = await bulkDeleteTeamMembers(ids)
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
      affected: result.affected
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    if (error instanceof Error && error.message.includes('referenced by projects')) {
      const referencedMembers = (error as any).referencedMembers || []
      return NextResponse.json(
        { 
          error: 'Cannot delete team members',
          message: 'Some team members are referenced by projects. Please deactivate them instead.',
          code: 'REFERENCED_BY_PROJECTS',
          referencedMembers
        },
        { status: 409 }
      )
    }
    
    console.error('Error performing bulk action:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    )
  }
}
