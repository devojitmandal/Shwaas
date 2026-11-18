import { z } from 'zod';

export const CommuteTypeEnum = z.enum([
  'walk',
  'bicycle',
  'two_wheeler',
  'car_open',
  'car_ac',
  'metro_bus_transit',
]);

export const CookingFuelEnum = z.enum(['lpg_electric', 'biomass_kerosene', 'wood']);

export const MaskTypeEnum = z.enum(['none', 'cloth_surgical', 'n95_kn95']);

export const VentilationStrategyEnum = z.enum([
  'windows_open',
  'sealed_windows',
  'timed_afternoon',
]);

export const householdProfileSchema = z.object({
  numKids: z.number().int().min(0, 'Must be at least 0').max(20, 'Maximum 20'),
  numElderly: z.number().int().min(0, 'Must be at least 0').max(20, 'Maximum 20'),
  commuteType: CommuteTypeEnum,
  cookingFuel: CookingFuelEnum,
  hasPurifier: z.boolean(),
  hasMasks: z.boolean(),
  maskType: MaskTypeEnum,
  outdoorHours: z.number().min(0, 'Cannot be negative').max(24, 'Maximum 24 hours per day'),
  ventilationStrategy: VentilationStrategyEnum,
});

export type HouseholdProfile = z.infer<typeof householdProfileSchema>;

export const DEFAULT_HOUSEHOLD_PROFILE: HouseholdProfile = {
  numKids: 1,
  numElderly: 0,
  commuteType: 'two_wheeler',
  cookingFuel: 'lpg_electric',
  hasPurifier: false,
  hasMasks: true,
  maskType: 'cloth_surgical',
  outdoorHours: 2.0,
  ventilationStrategy: 'windows_open',
};

const STORAGE_KEY = 'airwise_household_profile_v1';

export function validateHouseholdProfile(data: unknown) {
  return householdProfileSchema.safeParse(data);
}

export function loadProfileFromStorage(): HouseholdProfile {
  if (typeof window === 'undefined') return DEFAULT_HOUSEHOLD_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_HOUSEHOLD_PROFILE;
    const parsed = JSON.parse(raw);
    const result = householdProfileSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
    return DEFAULT_HOUSEHOLD_PROFILE;
  } catch (err) {
    console.error('Error loading household profile from localStorage:', err);
    return DEFAULT_HOUSEHOLD_PROFILE;
  }
}

export function saveProfileToStorage(profile: HouseholdProfile): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const validated = householdProfileSchema.parse(profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
    return true;
  } catch (err) {
    console.error('Error saving household profile to localStorage:', err);
    return false;
  }
}
