import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  client: z.string().min(1, 'Client name is required'),
  currencyCode: z.string().min(3, 'Currency code must be at least 3 characters'),
  currencySymbol: z.string().min(1, 'Currency symbol is required'),
  hoursPerDay: z.number().min(1, 'Hours per day must be at least 1').max(24, 'Hours per day cannot exceed 24'),
  taxEnabled: z.boolean(),
  taxPercent: z.number().min(0, 'Tax percentage cannot be negative').max(100, 'Tax percentage cannot exceed 100').optional(),
  pricingMode: z.enum(['DIRECT', 'ROI', 'MARGIN']),
  proposedPrice: z.number().min(0, 'Proposed price cannot be negative').optional(),
  targetRoiPercent: z.number().min(0, 'Target ROI cannot be negative').optional(),
  targetMarginPercent: z.number().min(0, 'Target margin cannot be negative').max(99.99, 'Target margin cannot exceed 99.99%').optional(),
  fxNote: z.string().optional(),
  executionDays: z.number().min(0, 'Execution days cannot be negative'),
  bufferDays: z.number().min(0, 'Buffer days cannot be negative'),
  finalDays: z.number().min(0, 'Final days cannot be negative'),
  calendarMode: z.boolean(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  workingWeek: z.enum(['MON_FRI', 'MON_SAT', 'SUN_THU']),
});

export const projectPersonSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  teamMemberId: z.string().optional(),
  personLabel: z.string().min(1, 'Person label is required'),
  roleId: z.string().optional(),
  level: z.enum(['TEAM_LEAD', 'SENIOR', 'JUNIOR']).optional(),
  rateSource: z.enum(['RATE_CARD', 'CUSTOM']),
  pricePerDay: z.number().min(0.01, 'Price per day must be greater than 0'),
  allocatedDays: z.number().min(0, 'Allocated days cannot be negative'),
  utilizationPercent: z.number().min(0, 'Utilization cannot be negative').max(100, 'Utilization cannot exceed 100%'),
  nonBillable: z.boolean(),
  weekendMultiplier: z.number().min(0, 'Weekend multiplier cannot be negative').optional(),
  holidayMultiplier: z.number().min(0, 'Holiday multiplier cannot be negative').optional(),
  notes: z.string().optional(),
});

export const projectHolidaySchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  date: z.string().datetime(),
  name: z.string().min(1, 'Holiday name is required'),
  treatment: z.enum(['EXCLUDE', 'BILLABLE_MULTIPLIER', 'INFO']),
  holidayMultiplier: z.number().min(0, 'Holiday multiplier cannot be negative').optional(),
});

export const rateCardTierSchema = z.object({
  roleId: z.string().min(1, 'Role ID is required'),
  level: z.enum(['TEAM_LEAD', 'SENIOR', 'JUNIOR']),
  pricePerDay: z.number().min(0, 'Price per day cannot be negative'),
  active: z.boolean(),
});

export const teamMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  roleId: z.string().optional(),
  level: z.enum(['TEAM_LEAD', 'SENIOR', 'JUNIOR']).optional(),
  defaultRatePerDay: z.number().min(0, 'Default rate cannot be negative'),
  notes: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export const projectTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  payload: z.record(z.any()),
});

export const csvImportSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 5 * 1024 * 1024,
    'File size must be less than 5MB'
  ),
  projectId: z.string().min(1, 'Project ID is required'),
});

export const icsImportSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 5 * 1024 * 1024,
    'File size must be less than 5MB'
  ),
  projectId: z.string().min(1, 'Project ID is required'),
});

// Sanitize CSV data to prevent injection attacks
export function sanitizeCsvData(data: string[][]): string[][] {
  return data.map(row => 
    row.map(cell => {
      const trimmed = cell.trim();
      // Prefix cells starting with =, +, -, @ with single quote to prevent formula injection
      if (trimmed.startsWith('=') || trimmed.startsWith('+') || trimmed.startsWith('-') || trimmed.startsWith('@')) {
        return `'${trimmed}`;
      }
      return trimmed;
    })
  );
}
