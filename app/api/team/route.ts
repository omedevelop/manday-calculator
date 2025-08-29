import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { TeamMemberCreateSchema, TeamQuerySchema } from '@/lib/validators/team'
import { ZodError } from 'zod'

export const runtime = 'edge'
export const revalidate = 120

const SORTABLE_FIELDS = ['name', 'roleName', 'level', 'defaultRatePerDay', 'status', 'createdAt']

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

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { roleName: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (status) {
      where.status = status
    }
    
    if (roleId) {
      where.roleId = roleId
    }
    
    if (level) {
      where.level = level
    }

    // Parse sort parameter
    let orderBy: any = { name: 'asc' } // default sort
    if (sort) {
      const [field, direction] = sort.split(':')
      if (SORTABLE_FIELDS.includes(field) && ['asc', 'desc'].includes(direction)) {
        orderBy = { [field]: direction }
      }
    }

    // Calculate pagination
    const skip = (page - 1) * size

    // Execute queries
    const [teamMembers, total] = await Promise.all([
      prisma.teamMember.findMany({
        where,
        include: {
          role: true,
        },
        orderBy,
        skip,
        take: size,
      }),
      prisma.teamMember.count({ where })
    ])

    const response = {
      data: teamMembers,
      pagination: {
        page,
        size,
        total,
        pages: Math.ceil(total / size)
      }
    }

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
    
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = TeamMemberCreateSchema.parse(body)
    
    // Create team member
    const teamMember = await prisma.teamMember.create({
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
