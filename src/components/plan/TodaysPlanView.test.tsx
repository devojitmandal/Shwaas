import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TodaysPlanView from './TodaysPlanView';
import { generateFallbackPlan } from '@/lib/plan/planSchema';
import { DEFAULT_HOUSEHOLD_PROFILE } from '@/lib/validation/profileSchema';

describe('TodaysPlanView Component', () => {
  const mockPlan = generateFallbackPlan({
    cityName: 'Delhi, India',
    profile: DEFAULT_HOUSEHOLD_PROFILE,
    exposure: {
      baselineDose: 180,
      mitigatedDose: 70,
      reductionPercentage: 61,
      totalInhaledMassUg: 245.5,
      avoidedInhaledMassUg: 150.2,
      potentialReductionPercent: 61,
      naqiCategory: 'Very Poor',
      dominantSource: 'Outdoor commute',
      lifestyleComparisonMessage: 'Exceeds WHO 24h intake',
    },
    bestWindow: {
      startTime: '2026-11-21T13:00:00Z',
      endTime: '2026-11-21T15:00:00Z',
      averageAqi: 180,
      category: 'Moderate',
      isSafe: false,
      advisory: 'Best midday window',
    },
    worstWindow: {
      startTime: '2026-11-21T07:00:00Z',
      endTime: '2026-11-21T09:00:00Z',
      averageAqi: 360,
      category: 'Very Poor',
      isSafe: false,
      advisory: 'Peak morning inversion',
    },
    language: 'en',
  });

  it('renders "Gemini 3.8 + Deterministic Engine" badge when source is gemini_personalized', () => {
    render(
      <TodaysPlanView
        plan={mockPlan}
        source="gemini_personalized"
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText('Gemini 3.8 + Deterministic Engine')).toBeInTheDocument();
  });

  it('renders "Rule-based plan" badge when source is deterministic fallback', () => {
    render(
      <TodaysPlanView
        plan={mockPlan}
        source="deterministic_engine_fallback"
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText('Rule-based plan')).toBeInTheDocument();
    expect(screen.queryByText('Gemini 3.8 + Deterministic Engine')).not.toBeInTheDocument();
  });
});
