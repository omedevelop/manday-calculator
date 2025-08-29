import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { teamMemberSchema } from '@/lib/validations'

export async function GET() {
  try {
    const teamMembers = await prisma.teamMember.findMany({
      include: {
        role: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(teamMembers)
  } catch (error) {
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
    const validatedData = teamMemberSchema.parse(body)
    
    // Create team member
    const teamMember = await prisma.teamMember.create({
      data: {
        name: validatedData.name,
        roleId: validatedData.roleId,
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
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
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
