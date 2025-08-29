export type PricingMode = 'DIRECT' | 'ROI' | 'MARGIN';

export type RoleLevel = 'TEAM_LEAD' | 'SENIOR' | 'JUNIOR';

export type MemberStatus = 'ACTIVE' | 'INACTIVE';

export type HolidayTreatment = 'EXCLUDE' | 'BILLABLE_MULTIPLIER' | 'INFO';

export type RateSource = 'RATE_CARD' | 'CUSTOM';

export type WorkingWeek = 'MON_FRI' | 'MON_SAT' | 'SUN_THU';

export interface PersonRow {
  id?: string;
  pricePerDay: number;
  allocatedDays: number;
  utilizationPercent: number;
  nonBillable?: boolean;
  weekendMultiplier?: number | null;
  holidayMultiplier?: number | null;
}

export interface CalculationInput {
  rows: PersonRow[];
  taxEnabled: boolean;
  taxPercent: number;
  pricingMode: PricingMode;
  proposed?: number | null;
  targetROI?: number | null;
  targetMargin?: number | null;
}

export interface CalculationResult {
  subtotal: number;
  tax: number;
  cost: number;
  proposed: number;
  roiPercent: number;
  marginPercent: number;
}

export interface ProjectSettings {
  currencyCode: string;
  currencySymbol: string;
  hoursPerDay: number;
  taxEnabled: boolean;
  taxPercent: number;
  pricingMode: PricingMode;
  proposedPrice?: number;
  targetRoiPercent?: number;
  targetMarginPercent?: number;
}

export interface DayConfiguration {
  executionDays: number;
  bufferDays: number;
  finalDays: number;
}

export interface RateCardRole {
  id: string;
  name: string;
  tiers: RateCardTier[];
}

export interface RateCardTier {
  id: string;
  roleId: string;
  level: RoleLevel;
  pricePerDay: number;
  active: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  roleId?: string;
  level?: RoleLevel;
  defaultRatePerDay: number;
  notes?: string;
  status: MemberStatus;
}

export interface ProjectPerson {
  id?: string;
  projectId: string;
  teamMemberId?: string;
  personLabel: string;
  roleId?: string;
  level?: RoleLevel;
  rateSource: RateSource;
  pricePerDay: number;
  allocatedDays: number;
  utilizationPercent: number;
  nonBillable: boolean;
  weekendMultiplier?: number;
  holidayMultiplier?: number;
  notes?: string;
}

export interface ProjectHoliday {
  id?: string;
  projectId: string;
  date: Date;
  name: string;
  treatment: HolidayTreatment;
  holidayMultiplier?: number;
}

export interface Project {
  id?: string;
  name: string;
  client: string;
  currencyCode: string;
  currencySymbol: string;
  hoursPerDay: number;
  taxEnabled: boolean;
  taxPercent?: number;
  pricingMode: PricingMode;
  proposedPrice?: number;
  targetRoiPercent?: number;
  targetMarginPercent?: number;
  fxNote?: string;
  executionDays: number;
  bufferDays: number;
  finalDays: number;
  calendarMode: boolean;
  startDate?: Date;
  endDate?: Date;
  workingWeek: WorkingWeek;
  people: ProjectPerson[];
  holidays: ProjectHoliday[];
}
