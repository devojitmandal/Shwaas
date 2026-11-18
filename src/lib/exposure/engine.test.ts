import { describe, it, expect } from 'vitest';
import {
  calculateDailyExposure,
  evaluateWhatIf,
  ExposureProfile,
} from './engine';

describe('Deterministic Exposure Engine', () => {
  const baseProfile: ExposureProfile = {
    currentAqi: 350, // Very Poor
    pm25Concentration: 200,
    timeOutdoorsHours: 2,
    commuteType: 'two_wheeler',
    maskType: 'none',
    indoorHours: 22,
    hasPurifier: false,
    cookingFuel: 'lpg_electric',
    ventilationStrategy: 'windows_open',
    vulnerableMembers: {
      hasKids: true,
      hasElderly: false,
    },
  };

  it('calculates baseline daily inhaled exposure dose deterministically', () => {
    const result = calculateDailyExposure(baseProfile);
    expect(result.baselineDose).toBeGreaterThan(0);
    expect(result.outdoorDose).toBeGreaterThan(0);
    expect(result.indoorDose).toBeGreaterThan(0);
    expect(result.baselineDose).toBeCloseTo(result.outdoorDose + result.indoorDose, 1);
    expect(result.naqiCategory).toBe('Very Poor');
  });

  it('reduces exposure significantly when N95 mask is worn outdoors', () => {
    const baseline = calculateDailyExposure(baseProfile);
    const withN95 = calculateDailyExposure({
      ...baseProfile,
      maskType: 'n95_kn95',
    });

    expect(withN95.outdoorDose).toBeLessThan(baseline.outdoorDose * 0.2); // >80% reduction in outdoor component
    expect(withN95.baselineDose).toBeLessThan(baseline.baselineDose);
  });

  it('reduces indoor exposure when HEPA purifier / DIY box-fan is running', () => {
    const baseline = calculateDailyExposure(baseProfile);
    const withPurifier = calculateDailyExposure({
      ...baseProfile,
      hasPurifier: true,
      ventilationStrategy: 'sealed_windows',
    });

    expect(withPurifier.indoorDose).toBeLessThan(baseline.indoorDose * 0.4); // >60% drop in indoor PM2.5 dose
  });

  it('evaluates what-if toggles accurately in real time', () => {
    const whatIfMetro = evaluateWhatIf(baseProfile, { commuteType: 'metro_bus_transit' });
    expect(whatIfMetro.doseReductionPercent).toBeGreaterThan(0);
    expect(whatIfMetro.newDose).toBeLessThan(whatIfMetro.originalDose);

    const whatIfN95 = evaluateWhatIf(baseProfile, { maskType: 'n95_kn95' });
    expect(whatIfN95.doseReductionPercent).toBeGreaterThan(0);

    const whatIfPurifier = evaluateWhatIf(baseProfile, { hasPurifier: true, ventilationStrategy: 'sealed_windows' });
    expect(whatIfPurifier.doseReductionPercent).toBeGreaterThan(30);
  });

  it('keys health risk tiers off NAQI categories and accounts for vulnerability', () => {
    const lowAqiProfile: ExposureProfile = {
      ...baseProfile,
      currentAqi: 45,
      pm25Concentration: 25,
      vulnerableMembers: { hasKids: false, hasElderly: false },
    };
    const lowResult = calculateDailyExposure(lowAqiProfile);
    expect(lowResult.healthRiskTier).toBe('Minimal');

    const highAqiProfile: ExposureProfile = {
      ...baseProfile,
      currentAqi: 420, // Severe
      pm25Concentration: 270,
      vulnerableMembers: { hasKids: true, hasElderly: true },
    };
    const highResult = calculateDailyExposure(highAqiProfile);
    expect(highResult.healthRiskTier).toBe('Critical Emergency');
    expect(highResult.vulnerabilityAlert).toBe(true);
  });

  it('handles edge cases gracefully (zero outdoor hours, zero indoor hours, extreme AQI)', () => {
    const zeroOutdoor = calculateDailyExposure({
      ...baseProfile,
      timeOutdoorsHours: 0,
      indoorHours: 24,
    });
    expect(zeroOutdoor.outdoorDose).toBe(0);
    expect(zeroOutdoor.baselineDose).toBe(zeroOutdoor.indoorDose);

    const extremeAqi = calculateDailyExposure({
      ...baseProfile,
      currentAqi: 650,
      pm25Concentration: 450,
    });
    expect(extremeAqi.naqiCategory).toBe('Severe');
    expect(extremeAqi.baselineDose).toBeGreaterThan(0);
  });
});
