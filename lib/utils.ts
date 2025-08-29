import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currencySymbol: string = '฿'): string {
  return `${currencySymbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

export function formatDays(days: number): string {
  return days === 1 ? '1 day' : `${days} days`
}

export function getRoleLevelColor(level: string): string {
  switch (level) {
    case 'TEAM_LEAD':
      return 'text-purple-600 bg-purple-100'
    case 'SENIOR':
      return 'text-blue-600 bg-blue-100'
    case 'JUNIOR':
      return 'text-green-600 bg-green-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'text-green-600 bg-green-100'
    case 'INACTIVE':
      return 'text-red-600 bg-red-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export function getHolidayTreatmentColor(treatment: string): string {
  switch (treatment) {
    case 'EXCLUDE':
      return 'text-red-600 bg-red-100'
    case 'BILLABLE_MULTIPLIER':
      return 'text-blue-600 bg-blue-100'
    case 'INFO':
      return 'text-gray-600 bg-gray-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function parseCSV(text: string): string[][] {
  const lines = text.split('\n')
  return lines
    .filter(line => line.trim())
    .map(line => {
      const result = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      
      result.push(current.trim())
      return result
    })
}

export function parseICS(text: string): Array<{ date: Date; name: string }> {
  const events: Array<{ date: Date; name: string }> = []
  const lines = text.split('\n')
  
  let currentEvent: { date?: Date; name?: string } = {}
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (line.startsWith('BEGIN:VEVENT')) {
      currentEvent = {}
    } else if (line.startsWith('END:VEVENT')) {
      if (currentEvent.date && currentEvent.name) {
        events.push({
          date: currentEvent.date,
          name: currentEvent.name
        })
      }
      currentEvent = {}
    } else if (line.startsWith('DTSTART')) {
      const dateStr = line.split(':')[1]
      if (dateStr) {
        const year = parseInt(dateStr.substr(0, 4))
        const month = parseInt(dateStr.substr(4, 2)) - 1
        const day = parseInt(dateStr.substr(6, 2))
        currentEvent.date = new Date(year, month, day)
      }
    } else if (line.startsWith('SUMMARY')) {
      currentEvent.name = line.split(':')[1] || 'Untitled Event'
    }
  }
  
  return events
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
