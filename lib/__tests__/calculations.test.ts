import { calculateTotals, calculateBusinessDays, validateCalculationInput } from '../calculations';
import { CalculationInput, PricingMode } from '../types';

describe('calculateTotals', () => {
  const baseInput: CalculationInput = {
    rows: [
      {
        pricePerDay: 100,
        allocatedDays: 10,
        utilizationPercent: 100,
        nonBillable: false
      }
    ],
    taxEnabled: false,
    taxPercent: 0,
    pricingMode: 'DIRECT'
  };

  test('should calculate basic totals correctly', () => {
    const result = calculateTotals(baseInput);
    
    expect(result.subtotal).toBe(1000);
    expect(result.tax).toBe(0);
    expect(result.cost).toBe(1000);
    expect(result.proposed).toBe(1000);
    expect(result.roiPercent).toBe(0);
    expect(result.marginPercent).toBe(0);
  });

  test('should handle tax calculation', () => {
    const input = { ...baseInput, taxEnabled: true, taxPercent: 7 };
    const result = calculateTotals(input);
    
    expect(result.subtotal).toBe(1000);
    expect(result.tax).toBe(70);
    expect(result.cost).toBe(1070);
    expect(result.proposed).toBe(1070);
  });

  test('should handle ROI pricing mode', () => {
    const input = { ...baseInput, pricingMode: 'ROI' as PricingMode, targetROI: 20 };
    const result = calculateTotals(input);
    
    expect(result.subtotal).toBe(1000);
    expect(result.cost).toBe(1000);
    expect(result.proposed).toBe(1200);
    expect(result.roiPercent).toBe(20);
  });

  test('should handle margin pricing mode', () => {
    const input = { ...baseInput, pricingMode: 'MARGIN' as PricingMode, targetMargin: 25 };
    const result = calculateTotals(input);
    
    expect(result.subtotal).toBe(1000);
    expect(result.cost).toBe(1000);
    expect(result.proposed).toBe(1333.33);
    expect(result.marginPercent).toBe(25);
  });

  test('should handle non-billable rows', () => {
    const input = {
      ...baseInput,
      rows: [
        { ...baseInput.rows[0], nonBillable: true },
        { ...baseInput.rows[0], pricePerDay: 200, allocatedDays: 5 }
      ]
    };
    const result = calculateTotals(input);
    
    expect(result.subtotal).toBe(1000); // Only the second row
    expect(result.cost).toBe(1000);
  });

  test('should handle multipliers', () => {
    const input = {
      ...baseInput,
      rows: [
        {
          ...baseInput.rows[0],
          weekendMultiplier: 1.5,
          holidayMultiplier: 2
        }
      ]
    };
    const result = calculateTotals(input);
    
    expect(result.subtotal).toBe(3000); // 1000 * 1.5 * 2
  });

  test('should handle utilization percentage', () => {
    const input = {
      ...baseInput,
      rows: [
        { ...baseInput.rows[0], utilizationPercent: 80 }
      ]
    };
    const result = calculateTotals(input);
    
    expect(result.subtotal).toBe(800); // 100 * 10 * 0.8
  });

  test('should handle direct pricing with proposed amount', () => {
    const input = { ...baseInput, proposed: 1500 };
    const result = calculateTotals(input);
    
    expect(result.proposed).toBe(1500);
    expect(result.roiPercent).toBe(50);
    expect(result.marginPercent).toBe(33.33);
  });
});

describe('calculateBusinessDays', () => {
  test('should calculate business days for Monday-Friday week', () => {
    const start = new Date('2024-01-01'); // Monday
    const end = new Date('2024-01-05');   // Friday
    
    const result = calculateBusinessDays(start, end, 'MON_FRI');
    expect(result).toBe(5);
  });

  test('should exclude weekends', () => {
    const start = new Date('2024-01-01'); // Monday
    const end = new Date('2024-01-07');   // Sunday
    
    const result = calculateBusinessDays(start, end, 'MON_FRI');
    expect(result).toBe(5); // Monday to Friday only
  });

  test('should handle Monday-Saturday week', () => {
    const start = new Date('2024-01-01'); // Monday
    const end = new Date('2024-01-06');   // Saturday
    
    const result = calculateBusinessDays(start, end, 'MON_SAT');
    expect(result).toBe(6); // Monday to Saturday
  });

  test('should exclude holidays', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-05');
    const holidays = [new Date('2024-01-02')]; // Wednesday
    
    const result = calculateBusinessDays(start, end, 'MON_FRI', holidays);
    expect(result).toBe(4); // Monday, Tuesday, Thursday, Friday
  });
});

describe('validateCalculationInput', () => {
  test('should validate empty rows', () => {
    const input = { ...baseInput, rows: [] };
    const errors = validateCalculationInput(input);
    
    expect(errors).toContain('At least one person row is required');
  });

  test('should validate price per day', () => {
    const input = {
      ...baseInput,
      rows: [{ ...baseInput.rows[0], pricePerDay: 0 }]
    };
    const errors = validateCalculationInput(input);
    
    expect(errors).toContain('Row 1: Price per day must be greater than 0');
  });

  test('should validate allocated days', () => {
    const input = {
      ...baseInput,
      rows: [{ ...baseInput.rows[0], allocatedDays: -1 }]
    };
    const errors = validateCalculationInput(input);
    
    expect(errors).toContain('Row 1: Allocated days cannot be negative');
  });

  test('should validate utilization percentage', () => {
    const input = {
      ...baseInput,
      rows: [{ ...baseInput.rows[0], utilizationPercent: 150 }]
    };
    const errors = validateCalculationInput(input);
    
    expect(errors).toContain('Row 1: Utilization must be between 0 and 100');
  });

  test('should validate tax percentage', () => {
    const input = { ...baseInput, taxEnabled: true, taxPercent: 150 };
    const errors = validateCalculationInput(input);
    
    expect(errors).toContain('Tax percentage must be between 0 and 100');
  });

  test('should validate target ROI', () => {
    const input = { ...baseInput, pricingMode: 'ROI' as PricingMode, targetROI: -10 };
    const errors = validateCalculationInput(input);
    
    expect(errors).toContain('Target ROI cannot be negative');
  });

  test('should validate target margin', () => {
    const input = { ...baseInput, pricingMode: 'MARGIN' as PricingMode, targetMargin: 100 };
    const errors = validateCalculationInput(input);
    
    expect(errors).toContain('Target margin must be between 0 and 100');
  });

  test('should return no errors for valid input', () => {
    const errors = validateCalculationInput(baseInput);
    expect(errors).toHaveLength(0);
  });
});
