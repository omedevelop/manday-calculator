import { 
  parseCSV, 
  validateCSVHeaders, 
  sanitizeCSVCell, 
  formatCSVRow, 
  arrayToCSV,
  validateCSVFile
} from '../utils/csv'

describe('CSV Utilities', () => {
  describe('parseCSV', () => {
    it('should parse simple CSV content', () => {
      const csv = 'name,role,level\nJohn Doe,Developer,Senior\nJane Smith,Designer,Junior'
      const result = parseCSV(csv)
      
      expect(result).toEqual([
        ['name', 'role', 'level'],
        ['John Doe', 'Developer', 'Senior'],
        ['Jane Smith', 'Designer', 'Junior']
      ])
    })

    it('should handle quoted fields with commas', () => {
      const csv = 'name,role,notes\n"Doe, John",Developer,"Experienced, reliable"'
      const result = parseCSV(csv)
      
      expect(result).toEqual([
        ['name', 'role', 'notes'],
        ['Doe, John', 'Developer', 'Experienced, reliable']
      ])
    })

    it('should ignore empty lines', () => {
      const csv = 'name,role\n\nJohn,Dev\n\nJane,Design\n'
      const result = parseCSV(csv)
      
      expect(result).toEqual([
        ['name', 'role'],
        ['John', 'Dev'],
        ['Jane', 'Design']
      ])
    })
  })

  describe('validateCSVHeaders', () => {
    it('should validate correct headers', () => {
      const headers = ['name', 'role', 'level']
      const expected = ['name', 'role', 'level', 'notes']
      const result = validateCSVHeaders(headers, expected, 3)
      
      expect(result.valid).toBe(true)
      expect(result.missing).toEqual(['notes'])
      expect(result.extra).toEqual([])
    })

    it('should detect missing required headers', () => {
      const headers = ['name', 'level']
      const expected = ['name', 'role', 'level']
      const result = validateCSVHeaders(headers, expected)
      
      expect(result.valid).toBe(false)
      expect(result.missing).toEqual(['role'])
    })

    it('should handle case insensitive headers', () => {
      const headers = ['Name', 'ROLE', 'Level']
      const expected = ['name', 'role', 'level']
      const result = validateCSVHeaders(headers, expected)
      
      expect(result.valid).toBe(true)
    })
  })

  describe('sanitizeCSVCell', () => {
    it('should prefix dangerous characters', () => {
      expect(sanitizeCSVCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)")
      expect(sanitizeCSVCell('+1+1')).toBe("'+1+1")
      expect(sanitizeCSVCell('-5')).toBe("'-5")
      expect(sanitizeCSVCell('@user')).toBe("'@user")
    })

    it('should handle normal values', () => {
      expect(sanitizeCSVCell('John Doe')).toBe('John Doe')
      expect(sanitizeCSVCell('123')).toBe('123')
      expect(sanitizeCSVCell('')).toBe('')
      expect(sanitizeCSVCell(null)).toBe('')
    })
  })

  describe('formatCSVRow', () => {
    it('should format simple row', () => {
      const data = ['John Doe', 'Developer', 'Senior']
      expect(formatCSVRow(data)).toBe('John Doe,Developer,Senior')
    })

    it('should quote fields with commas', () => {
      const data = ['Doe, John', 'Developer', 'Notes with, comma']
      expect(formatCSVRow(data)).toBe('"Doe, John",Developer,"Notes with, comma"')
    })

    it('should escape quotes', () => {
      const data = ['John "Johnny" Doe', 'Developer']
      expect(formatCSVRow(data)).toBe('"John ""Johnny"" Doe",Developer')
    })

    it('should handle dangerous characters', () => {
      const data = ['=SUM(A1)', 'Developer']
      expect(formatCSVRow(data)).toBe("'=SUM(A1),Developer")
    })
  })

  describe('arrayToCSV', () => {
    it('should convert array of objects to CSV', () => {
      const data = [
        { name: 'John', role: 'Dev', level: 'Senior' },
        { name: 'Jane', role: 'Design', level: 'Junior' }
      ]
      const headers = ['name', 'role', 'level'] as const
      const result = arrayToCSV(data, headers)
      
      expect(result).toBe('name,role,level\nJohn,Dev,Senior\nJane,Design,Junior\n')
    })

    it('should work without headers', () => {
      const data = [{ name: 'John', role: 'Dev' }]
      const headers = ['name', 'role'] as const
      const result = arrayToCSV(data, headers, { includeHeaders: false })
      
      expect(result).toBe('John,Dev\n')
    })
  })

  describe('validateCSVFile', () => {
    it('should validate CSV file type', () => {
      const csvFile = new File(['content'], 'test.csv', { type: 'text/csv' })
      const result = validateCSVFile(csvFile)
      
      expect(result.valid).toBe(true)
    })

    it('should reject non-CSV files', () => {
      const txtFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      const result = validateCSVFile(txtFile)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid file type')
    })

    it('should accept CSV files by extension', () => {
      const csvFile = new File(['content'], 'test.csv', { type: 'application/octet-stream' })
      const result = validateCSVFile(csvFile)
      
      expect(result.valid).toBe(true)
    })
  })
})
