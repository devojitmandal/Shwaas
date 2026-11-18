import { describe, it, expect } from 'vitest';
import {
  householdProfileSchema,
  DEFAULT_HOUSEHOLD_PROFILE,
  validateHouseholdProfile,
} from './profileSchema';

describe('Household Profile Zod Schema Validation', () => {
  it('validates a valid household profile', () => {
    const validData = {
      numKids: 2,
      numElderly: 1,
      commuteType: 'two_wheeler',
      cookingFuel: 'lpg_electric',
      hasPurifier: true,
      hasMasks: true,
      maskType: 'n95_kn95',
      outdoorHours: 2.5,
      ventilationStrategy: 'sealed_windows',
    };

    const parsed = householdProfileSchema.parse(validData);
    expect(parsed.numKids).toBe(2);
    expect(parsed.numElderly).toBe(1);
    expect(parsed.hasPurifier).toBe(true);
  });

  it('rejects invalid or negative numeric inputs', () => {
    const invalidData = {
      ...DEFAULT_HOUSEHOLD_PROFILE,
      numKids: -1,
    };

    const result = validateHouseholdProfile(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects outdoor hours exceeding 24', () => {
    const invalidData = {
      ...DEFAULT_HOUSEHOLD_PROFILE,
      outdoorHours: 28,
    };

    const result = validateHouseholdProfile(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects unauthorized commute or fuel types', () => {
    const invalidCommute = {
      ...DEFAULT_HOUSEHOLD_PROFILE,
      commuteType: 'helicopter',
    };

    const result = validateHouseholdProfile(invalidCommute);
    expect(result.success).toBe(false);
  });
});
