import { describe, it, expect } from 'vitest';
import {
  calculateDailyExposure,
  calculateIndoorMassBalance,
  evaluateWhatIf,
  ExposureProfile,
} from './engine';

describe('Scientifically Accurate Deterministic Exposure Engine', () => {
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

  it('calculates physical inhaled PM2.5 mass intake in µg transparently', () => {
    const result = calculateDailyExposure(baseProfile);
    expect(result.totalInhaledMassUg).toBeGreaterThan(0);
    expect(result.outdoorInhaledMassUg).toBeGreaterThan(0);
    expect(result.indoorInhaledMassUg).toBeGreaterThan(0);
    expect(result.totalInhaledMassUg).toBeCloseTo(
      result.outdoorInhaledMassUg + result.indoorInhaledMassUg,
      1
    );
    expect(result.uncertaintyRating).toBe('Configurable Estimate');
    expect(result.dataProvenance).toBeDefined();
  });

  it('reduces outdoor inhaled mass when N95 mask is worn, accounting for realistic fit leakage', () => {
    const baseline = calculateDailyExposure(baseProfile);
    const withTypicalN95 = calculateDailyExposure({
      ...baseProfile,
      maskType: 'n95_kn95',
      maskFit: 'typical_fit',
    });
    const withTightN95 = calculateDailyExposure({
      ...baseProfile,
      maskType: 'n95_kn95',
      maskFit: 'tight_fit',
    });

    // Typical fit provides ~75-80% real world protection (not naive 100%)
    expect(withTypicalN95.outdoorInhaledMassUg).toBeLessThan(baseline.outdoorInhaledMassUg * 0.3);
    // Tight fit provides >90% protection
    expect(withTightN95.outdoorInhaledMassUg).toBeLessThan(withTypicalN95.outdoorInhaledMassUg);
  });

  it('models indoor PM2.5 concentration using physical single-zone mass-balance', () => {
    const balance = calculateIndoorMassBalance(
      200, // Outdoor PM2.5 = 200 µg/m³
      {
        roomAreaSqM: 16,
        ceilingHeightM: 2.8,
        cadrM3H: 250,
        hasPurifier: true,
        ventilationStrategy: 'sealed_windows',
        cookingFuel: 'lpg_electric',
      },
      20
    );

    // Filtered steady-state room concentration must be substantially lower than outdoor
    expect(balance.estimatedIndoorConcentration).toBeLessThan(200 * 0.25);
    // Counterfactual unmitigated concentration must be higher
    expect(balance.unmitigatedIndoorConcentration).toBeGreaterThan(balance.estimatedIndoorConcentration);
    // Avoided inhaled mass must be positive
    expect(balance.indoorExposureAvoidedPerDayUg).toBeGreaterThan(0);
  });

  it('evaluates what-if interventions deterministically with assumptions transparency', () => {
    const whatIfMetro = evaluateWhatIf(baseProfile, { commuteType: 'metro_bus_transit' });
    expect(whatIfMetro.doseReductionPercent).toBeGreaterThan(0);
    expect(whatIfMetro.avoidedMassUg).toBeGreaterThan(0);
    expect(whatIfMetro.assumptions.length).toBeGreaterThan(0);

    const whatIfN95 = evaluateWhatIf(baseProfile, { maskType: 'n95_kn95' });
    expect(whatIfN95.doseReductionPercent).toBeGreaterThan(0);
    expect(whatIfN95.verdict).toContain('µg avoided');
  });

  it('handles edge cases gracefully without NaN or negative values', () => {
    const zeroDuration = calculateDailyExposure({
      ...baseProfile,
      timeOutdoorsHours: 0,
      indoorHours: 24,
    });
    expect(zeroDuration.outdoorInhaledMassUg).toBe(0);
    expect(zeroDuration.totalInhaledMassUg).toBe(zeroDuration.indoorInhaledMassUg);

    const zeroPollution = calculateDailyExposure({
      ...baseProfile,
      currentAqi: 0,
      pm25Concentration: 0,
    });
    expect(zeroPollution.outdoorInhaledMassUg).toBe(0);
    expect(zeroPollution.healthRiskTier).toBe('Minimal');

    const extremePollution = calculateDailyExposure({
      ...baseProfile,
      currentAqi: 500,
      pm25Concentration: 600,
    });
    expect(extremePollution.healthRiskTier).toBe('Critical Emergency');
    expect(extremePollution.totalInhaledMassUg).toBeGreaterThan(500);
  });
});
