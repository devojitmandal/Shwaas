import { describe, it, expect } from 'vitest';
import { planResponseSchema, generateFallbackPlan } from './planSchema';
import { calculateDailyExposure } from '../exposure/engine';
import { DEFAULT_HOUSEHOLD_PROFILE } from '../validation/profileSchema';

describe('Plan Schema & Deterministic Fallback Generator', () => {
  const mockExposure = calculateDailyExposure({
    ...DEFAULT_HOUSEHOLD_PROFILE,
    currentAqi: 360,
    pm25Concentration: 210,
    timeOutdoorsHours: 2,
    commuteType: 'two_wheeler',
    maskType: 'cloth_surgical',
    indoorHours: 22,
    hasPurifier: false,
    cookingFuel: 'lpg_electric',
    ventilationStrategy: 'windows_open',
    vulnerableMembers: { hasKids: true, hasElderly: false },
  });

  const mockBestWindow = {
    startTime: '2026-11-19T13:00',
    endTime: '2026-11-19T15:00',
    averageAqi: 120,
    category: 'Moderate' as const,
    advisory: 'Best afternoon window.',
  };

  const mockWorstWindow = {
    startTime: '2026-11-19T06:00',
    endTime: '2026-11-19T09:00',
    averageAqi: 410,
    category: 'Severe' as const,
    advisory: 'Peak morning smog inversion.',
  };

  it('generates a structurally valid fallback plan compliant with planResponseSchema', () => {
    const fallback = generateFallbackPlan({
      cityName: 'Delhi',
      profile: DEFAULT_HOUSEHOLD_PROFILE,
      exposure: mockExposure,
      bestWindow: mockBestWindow,
      worstWindow: mockWorstWindow,
    });

    const parsed = planResponseSchema.safeParse(fallback);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.headline).toContain('Delhi');
      expect(parsed.data.lowEmissionRoutine.length).toBeGreaterThan(0);
      expect(parsed.data.indoorAirHacks.length).toBeGreaterThan(0);
      expect(parsed.data.disclaimer).toContain('not medical advice');
    }
  });

  it('validates valid Gemini response structure correctly', () => {
    const sampleGeminiOutput = {
      headline: 'Targeted Smog Defense Strategy for Delhi',
      executiveSummary: 'Prioritize afternoon errand windows and deploy clean indoor air zones.',
      lowEmissionRoutine: [
        {
          title: 'Shift Morning Two-Wheeler Commute',
          action: 'Avoid travel between 6 AM and 9 AM; ride during midday or take the metro.',
          estimatedExposureReduction: 'Lowers outdoor particle ingestion by ~60%',
          timeOfDay: 'Morning Inversion',
          rationale: 'Avoids ground-level temperature inversion exhaust buildup.',
        },
      ],
      indoorAirHacks: [
        {
          title: 'DIY Box-Fan + MERV 13 Cleaner',
          instructions: 'Tape a 20x20 MERV-13 furnace filter to the intake of a box fan in the bedroom.',
          estimatedExposureReduction: 'Cuts indoor PM2.5 by ~70%',
          mythCheck: 'Myth: Wet towels trap fine PM2.5 particulate. Fact: Only HEPA/MERV 13 stops respirable aerosols.',
        },
      ],
      sensitiveGroupGuidance: {
        alertLevel: 'Severe Warning',
        advice: 'Keep children indoors; halt strenuous physical play.',
        vulnerableGroupsCovered: ['Children', 'Elderly'],
      },
      communityAction: 'Urge apartment RWA to distribute electric heaters to security guards to eliminate open waste burning.',
      disclaimer: 'Shwaas provides decision-support exposure models; this is not medical advice.',
    };

    const parseResult = planResponseSchema.safeParse(sampleGeminiOutput);
    expect(parseResult.success).toBe(true);
  });
});
