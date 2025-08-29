/**
 * Utility functions for CSV parsing and validation
 */

export interface CSVParseOptions {
  hasHeader?: boolean
  delimiter?: string
  maxRows?: number
}

export interface CSVParseResult<T> {
  data: T[]
  errors: Array<{
    row: number
    field?: string
    message: string
    data?: any
  }>
  summary: {
    totalRows: number
    validRows: number
    invalidRows: number
  }
}

/**
 * Parse CSV content into rows
 */
export function parseCSV(csvContent: string, options: CSVParseOptions = {}): string[][] {
  const { delimiter = ',' } = options
  const lines = csvContent.split('\n').filter(line => line.trim())
  
  return lines.map(line => {
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === delimiter && !inQuotes) {
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

/**
 * Validate CSV headers against expected headers
 */
export function validateCSVHeaders(
  headers: string[], 
  expected: string[], 
  requiredCount?: number
): { valid: boolean; missing: string[]; extra: string[] } {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim())
  const normalizedExpected = expected.map(h => h.toLowerCase())
  
  const missing = normalizedExpected.filter(h => !normalizedHeaders.includes(h))
  const extra = normalizedHeaders.filter(h => !normalizedExpected.includes(h))
  
  const requiredHeaders = requiredCount ? normalizedExpected.slice(0, requiredCount) : normalizedExpected
  const valid = requiredHeaders.every(h => normalizedHeaders.includes(h))
  
  return { valid, missing, extra }
}

/**
 * Sanitize CSV cell value to prevent injection attacks
 */
export function sanitizeCSVCell(value: any): string {
  if (value == null) return ''
  
  const stringValue = String(value).trim()
  
  // Prefix cells starting with =, +, -, @ with single quote to prevent CSV injection
  if (stringValue.startsWith('=') || stringValue.startsWith('+') || 
      stringValue.startsWith('-') || stringValue.startsWith('@')) {
    return `'${stringValue}`
  }
  
  return stringValue
}

/**
 * Format data as CSV row
 */
export function formatCSVRow(data: any[]): string {
  return data.map(cell => {
    const sanitized = sanitizeCSVCell(cell)
    
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (sanitized.includes(',') || sanitized.includes('"') || sanitized.includes('\n')) {
      return `"${sanitized.replace(/"/g, '""')}"`
    }
    
    return sanitized
  }).join(',')
}

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  headers: (keyof T)[],
  options: { includeHeaders?: boolean } = {}
): string {
  const { includeHeaders = true } = options
  let csv = ''
  
  if (includeHeaders) {
    csv += formatCSVRow(headers as string[]) + '\n'
  }
  
  for (const row of data) {
    const values = headers.map(header => row[header])
    csv += formatCSVRow(values) + '\n'
  }
  
  return csv
}

/**
 * Validate file constraints for CSV upload
 */
export function validateCSVFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
    return { valid: false, error: 'Invalid file type. Only CSV files are allowed.' }
  }
  
  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'File size too large. Maximum size is 5MB.' }
  }
  
  return { valid: true }
}
