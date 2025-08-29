import { Decimal } from 'decimal.js';
import { CalculationInput, CalculationResult, PricingMode } from './types';

/**
 * Calculate project totals based on pricing mode and person rows
 * Uses Decimal.js for precise financial calculations
 */
export function calculateTotals(input: CalculationInput): CalculationResult {
  const {
    rows,
    taxEnabled,
    taxPercent,
    pricingMode,
    proposed,
    targetROI,
    targetMargin
  } = input;

  // Calculate subtotal from person rows (minimize Decimal allocations)
  let subtotal = new Decimal(0);
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.nonBillable) continue;

    const pricePerDay = new Decimal(row.pricePerDay);
    const effectiveDays = new Decimal(row.allocatedDays)
      .mul(row.utilizationPercent)
      .div(100);

    let rowCost = pricePerDay.mul(effectiveDays);
    const weekend = row.weekendMultiplier ?? null;
    const holiday = row.holidayMultiplier ?? null;

    if (weekend !== null) rowCost = rowCost.mul(weekend);
    if (holiday !== null) rowCost = rowCost.mul(holiday);

    subtotal = subtotal.plus(rowCost);
  }

  // Calculate tax
  const tax = taxEnabled
    ? subtotal.mul(new Decimal(taxPercent).div(100))
    : new Decimal(0);

  // Calculate total cost
  const cost = subtotal.plus(tax);

  // Calculate proposed price based on pricing mode
  let proposedPrice: Decimal;
  
  switch (pricingMode) {
    case 'DIRECT':
      proposedPrice = proposed ? new Decimal(proposed) : cost;
      break;
      
    case 'ROI': {
      if (!targetROI) {
        proposedPrice = cost;
      } else {
        const roiFactor = new Decimal(1).plus(new Decimal(targetROI).div(100));
        proposedPrice = cost.mul(roiFactor);
      }
      break;
    }

    case 'MARGIN': {
      if (!targetMargin) {
        proposedPrice = cost;
      } else {
        const marginDivisor = new Decimal(1).minus(new Decimal(targetMargin).div(100));
        proposedPrice = cost.div(marginDivisor);
      }
      break;
    }
      
    default:
      proposedPrice = cost;
  }

  // Calculate ROI and Margin percentages
  const roiPercent = cost.isZero() 
    ? new Decimal(0)
    : proposedPrice.minus(cost).div(cost).mul(100);
    
  const marginPercent = proposedPrice.isZero()
    ? new Decimal(0)
    : proposedPrice.minus(cost).div(proposedPrice).mul(100);

  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    cost: Number(cost.toFixed(2)),
    proposed: Number(proposedPrice.toFixed(2)),
    roiPercent: Number(roiPercent.toFixed(2)),
    marginPercent: Number(marginPercent.toFixed(2))
  };
}

/**
 * Calculate business days between two dates (excluding weekends and holidays)
 */
export function calculateBusinessDays(
  startDate: Date,
  endDate: Date,
  workingWeek: 'MON_FRI' | 'MON_SAT' | 'SUN_THU' = 'MON_FRI',
  holidays: Date[] = []
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let businessDays = 0;
  const current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    const isWeekend = workingWeek === 'MON_FRI' 
      ? dayOfWeek === 0 || dayOfWeek === 6
      : workingWeek === 'MON_SAT'
      ? dayOfWeek === 0
      : dayOfWeek === 6;
      
    const isHoliday = holidays.some(holiday => 
      holiday.toDateString() === current.toDateString()
    );
    
    if (!isWeekend && !isHoliday) {
      businessDays++;
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return businessDays;
}

/**
 * Validate calculation input
 */
export function validateCalculationInput(input: CalculationInput): string[] {
  const errors: string[] = [];
  
  if (input.rows.length === 0) {
    errors.push('At least one person row is required');
  }
  
  for (let i = 0; i < input.rows.length; i++) {
    const row = input.rows[i];
    
    if (row.pricePerDay <= 0) {
      errors.push(`Row ${i + 1}: Price per day must be greater than 0`);
    }
    
    if (row.allocatedDays < 0) {
      errors.push(`Row ${i + 1}: Allocated days cannot be negative`);
    }
    
    if (row.utilizationPercent < 0 || row.utilizationPercent > 100) {
      errors.push(`Row ${i + 1}: Utilization must be between 0 and 100`);
    }
    
    if (row.weekendMultiplier !== null && row.weekendMultiplier !== undefined) {
      if (row.weekendMultiplier < 0) {
        errors.push(`Row ${i + 1}: Weekend multiplier cannot be negative`);
      }
    }
    
    if (row.holidayMultiplier !== null && row.holidayMultiplier !== undefined) {
      if (row.holidayMultiplier < 0) {
        errors.push(`Row ${i + 1}: Holiday multiplier cannot be negative`);
      }
    }
  }
  
  if (input.taxEnabled && (input.taxPercent < 0 || input.taxPercent > 100)) {
    errors.push('Tax percentage must be between 0 and 100');
  }
  
  if (input.pricingMode === 'ROI' && input.targetROI !== null && input.targetROI !== undefined) {
    if (input.targetROI < 0) {
      errors.push('Target ROI cannot be negative');
    }
  }
  
  if (input.pricingMode === 'MARGIN' && input.targetMargin !== null && input.targetMargin !== undefined) {
    if (input.targetMargin < 0 || input.targetMargin >= 100) {
      errors.push('Target margin must be between 0 and 100');
    }
  }
  
  return errors;
}
