import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyImpactDashboard from './MyImpactDashboard';
import { ExposureResult } from '@/lib/exposure/engine';

describe('MyImpactDashboard Component', () => {
  const mockExposure: ExposureResult = {
    baselineDose: 450,
    outdoorDose: 200,
    indoorDose: 250,
    outdoorFractionPercent: 44,
    indoorFractionPercent: 56,
    healthRiskTier: 'Severe Hazard',
    naqiCategory: 'Very Poor',
    totalInhaledMassUg: 520,
    outdoorInhaledMassUg: 280,
    indoorInhaledMassUg: 240,
    optimizedInhaledMassUg: 130,
    avoidedInhaledMassUg: 390,
    potentialReductionPercent: 75,
    roomInfiltrationRatio: 0.55,
    cleanAirDeliveryCadre: 250,
    steadyStateIndoorPm25: 35,
    disclaimer: 'Shwaas provides decision-support exposure models; this is not medical advice.',
  };

  it('renders quantified particulate avoidance metrics and city name', () => {
    render(<MyImpactDashboard exposure={mockExposure} cityName="Delhi" />);

    expect(screen.getByText(/Quantified Pollution Avoidance for Delhi/i)).toBeInTheDocument();
    expect(screen.getByText(/Intake Avoided per Day/i)).toBeInTheDocument();
    expect(screen.getByText(/Baseline Routine \(Unmitigated\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Shwaas Optimized Protocol/i)).toBeInTheDocument();
  });
});
