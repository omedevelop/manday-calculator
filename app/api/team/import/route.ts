import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { TeamMemberCSVRowSchema } from '@/lib/validators/team'
import { ZodError } from 'zod'

export const runtime = 'nodejs'

interface CSVParseResult {
  valid: any[]
  invalid: Array<{ row: number; data: any; errors: string[] }>
}

function parseCSV(csvContent: string): string[][] {
  const lines = csvContent.split('\n').filter(line => line.trim())
  return lines.map(line => {
    // Simple CSV parser - handles quoted fields
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    fields.push(current.trim())
    return fields.map(field => field.replace(/^"|"$/g, '')) // Remove surrounding quotes
  })
}

function validateCSVData(rows: string[][]): CSVParseResult {
  const result: CSVParseResult = { valid: [], invalid: [] }
  
  // Skip header row
  const dataRows = rows.slice(1)
  
  dataRows.forEach((row, index) => {
    try {
      const [name, role, level, defaultRatePerDay, notes = '', status = 'ACTIVE'] = row
      
      const validatedData = TeamMemberCSVRowSchema.parse({
        name,
        role,
        level,
        defaultRatePerDay,
        notes,
        status
      })
      
      result.valid.push({
        ...validatedData,
        roleName: validatedData.role,
        row: index + 2 // +2 because we skip header and use 1-based indexing
      })
    } catch (error) {
      let errors: string[] = []
      if (error instanceof ZodError) {
        errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      } else {
        errors = [error instanceof Error ? error.message : 'Unknown error']
      }
      
      result.invalid.push({
        row: index + 2,
        data: row,
        errors
      })
    }
  })
  
  return result
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const commit = request.nextUrl.searchParams.get('commit') === 'true'
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // Validate file type and size
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only CSV files are allowed.' },
        { status: 400 }
      )
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }
    
    const csvContent = await file.text()
    const rows = parseCSV(csvContent)
    
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty' },
        { status: 400 }
      )
    }
    
    if (rows.length > 5000) {
      return NextResponse.json(
        { error: 'Too many rows. Maximum is 5000 rows.' },
        { status: 400 }
      )
    }
    
    // Validate CSV headers
    const expectedHeaders = ['name', 'role', 'level', 'defaultRatePerDay', 'notes', 'status']
    const headers = rows[0].map(h => h.toLowerCase().trim())
    const hasValidHeaders = expectedHeaders.slice(0, 4).every(h => headers.includes(h))
    
    if (!hasValidHeaders) {
      return NextResponse.json(
        { 
          error: 'Invalid CSV headers',
          expected: expectedHeaders,
          received: headers
        },
        { status: 400 }
      )
    }
    
    const parseResult = validateCSVData(rows)
    
    if (!commit) {
      // Preview mode - return validation results
      return NextResponse.json({
        preview: true,
        summary: {
          total: rows.length - 1,
          valid: parseResult.valid.length,
          invalid: parseResult.invalid.length
        },
        validSample: parseResult.valid.slice(0, 20),
        invalidSample: parseResult.invalid.slice(0, 20)
      })
    }
    
    // Commit mode - create team members
    if (parseResult.valid.length === 0) {
      return NextResponse.json(
        { error: 'No valid rows to import' },
        { status: 400 }
      )
    }
    
    const created = []
    const errors = []
    
    for (const memberData of parseResult.valid) {
      try {
        const teamMember = await prisma.teamMember.create({
          data: {
            name: memberData.name,
            roleId: null, // Will be set if role exists
            roleName: memberData.roleName,
            level: memberData.level,
            defaultRatePerDay: memberData.defaultRatePerDay,
            notes: memberData.notes || null,
            status: memberData.status,
          },
          include: {
            role: true,
          },
        })
        
        created.push(teamMember)
      } catch (error) {
        errors.push({
          row: memberData.row,
          name: memberData.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({
      preview: false,
      summary: {
        total: rows.length - 1,
        valid: parseResult.valid.length,
        invalid: parseResult.invalid.length,
        created: created.length,
        failed: errors.length
      },
      created: created.length,
      errors: errors.length > 0 ? errors : undefined,
      invalidRows: parseResult.invalid.length > 0 ? parseResult.invalid : undefined
    })
    
  } catch (error) {
    console.error('Error importing CSV:', error)
    return NextResponse.json(
      { error: 'Failed to import CSV' },
      { status: 500 }
    )
  }
}
