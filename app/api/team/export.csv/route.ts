import { NextRequest, NextResponse } from 'next/server'
import { getTeamMembers } from '@/lib/database'
import { TeamQuerySchema } from '@/lib/validators/team'
import { ZodError } from 'zod'

export const runtime = 'nodejs'

// Constants for CSV export
const MAX_EXPORT_SIZE = 10000 // Maximum number of records to export

function sanitizeCSVCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  
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

function formatCSVRow(data: (string | number | null | undefined)[]): string {
  return data.map(sanitizeCSVCell).join(',') + '\n'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    // Parse and validate query parameters
    const {
      search,
      status,
      roleId,
      level,
      sort
    } = TeamQuerySchema.omit({ page: true, size: true }).parse(queryParams)

    // Fetch all matching team members using the same logic as the main API
    const result = await getTeamMembers({
      search,
      status,
      roleId,
      level,
      page: 1,
      size: MAX_EXPORT_SIZE,
      sort
    })
    
    const teamMembers = result.data
    
    // Check if we hit the export limit
    if (teamMembers.length >= MAX_EXPORT_SIZE) {
      return NextResponse.json(
        { 
          error: 'Export size limit exceeded', 
          message: `Cannot export more than ${MAX_EXPORT_SIZE} records. Please apply filters to reduce the result set.` 
        },
        { status: 413 }
      )
    }

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
        member.defaultRatePerDay,
        member.notes,
        member.status || 'ACTIVE'
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
