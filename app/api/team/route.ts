import { NextRequest, NextResponse } from 'next/server'
import { getTeamMembers, createTeamMember } from '@/lib/database'
import { TeamMemberCreateSchema, TeamQuerySchema } from '@/lib/validators/team'
import { ZodError } from 'zod'

export const runtime = 'nodejs'
export const revalidate = 120

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const {
      search,
      status,
      roleId,
      level,
      page,
      size,
      sort
    } = TeamQuerySchema.parse(queryParams)

    const response = await getTeamMembers({
      search,
      status,
      roleId,
      level,
      page,
      size,
      sort
    })

    const res = NextResponse.json(response)
    res.headers.set('Cache-Control', 's-maxage=120, stale-while-revalidate=600')
    return res
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }
    
    // Return empty result on any error to keep UI responsive
    console.error('Error fetching team members:', error)
    const res = NextResponse.json({
      data: [],
      pagination: { page: 1, size: 25, total: 0, pages: 0 }
    })
    res.headers.set('Cache-Control', 's-maxage=15, stale-while-revalidate=60')
    return res
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = TeamMemberCreateSchema.parse(body)
    
    // Create team member
    const teamMember = await createTeamMember({
      name: validatedData.name,
      roleId: validatedData.roleId,
      roleName: validatedData.roleName,
      level: validatedData.level,
      defaultRatePerDay: validatedData.defaultRatePerDay,
      notes: validatedData.notes,
      status: validatedData.status,
    })

    return NextResponse.json(teamMember, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating team member:', error)
    return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 }
    )
  }
}
