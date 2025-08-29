import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { TeamQuerySchema } from '@/lib/validators/team'
import { ZodError } from 'zod'

export const runtime = 'nodejs'

const SORTABLE_FIELDS = ['name', 'roleName', 'level', 'defaultRatePerDay', 'status', 'createdAt']

function sanitizeCSVCell(value: string): string {
  if (!value) return ''
  
  const trimmed = value.toString().trim()
  
  // Prefix cells starting with =, +, -, @ with single quote to prevent CSV injection
  if (trimmed.startsWith('=') || trimmed.startsWith('+') || trimmed.startsWith('-') || trimmed.startsWith('@')) {
    return `'${trimmed}`
  }
  
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (trimmed.includes(',') || trimmed.includes('"') || trimmed.includes('\n')) {
    return `"${trimmed.replace(/"/g, '""')}"`
  }
  
  return trimmed
}

function formatCSVRow(data: string[]): string {
  return data.map(sanitizeCSVCell).join(',') + '\n'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const {
      search,
      status,
      roleId,
      level,
      sort
    } = TeamQuerySchema.omit({ page: true, size: true }).parse(queryParams)

    // Build where clause (same logic as main API)
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

    // Fetch all matching team members
    const teamMembers = await prisma.teamMember.findMany({
      where,
      include: {
        role: true,
      },
      orderBy,
    })

    // Create CSV content
    let csvContent = ''
    
    // Add headers
    csvContent += formatCSVRow([
      'name',
      'role',
      'level', 
      'defaultRatePerDay',
      'notes',
      'status'
    ])
    
    // Add data rows
    for (const member of teamMembers) {
      csvContent += formatCSVRow([
        member.name,
        member.roleName,
        member.level,
        member.defaultRatePerDay.toString(),
        member.notes || '',
        member.status
      ])
    }

    // Create response with proper headers for file download
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="team-members-${new Date().toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

    return response
    
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error exporting CSV:', error)
    return NextResponse.json(
      { error: 'Failed to export CSV' },
      { status: 500 }
    )
  }
}
