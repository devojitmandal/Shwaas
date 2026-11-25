import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyImpactDashboard from './MyImpactDashboard';
import { ExposureResult } from '@/lib/exposure/engine';

describe('MyImpactDashboard Component', () => {
  const mockExposure: ExposureResult = {
    totalInhaledMassUg: 520,
    outdoorInhaledMassUg: 280,
    indoorInhaledMassUg: 240,
    baselineDose: 450,
    outdoorDose: 200,
    indoorDose: 250,
    indoorConcentration: 35,
    optimizedInhaledMassUg: 130,
    avoidedInhaledMassUg: 390,
    potentialReductionPercent: 75,
    naqiCategory: 'Very Poor',
    healthRiskTier: 'Severe Hazard',
    vulnerabilityAlert: true,
    recommendedInterventions: [
      'Wear a snug-fitting N95/FFP2 respirator outdoors.',
    ],
    uncertaintyRating: 'Configurable Estimate',
    dataProvenance: 'Modeled via Open-Meteo ambient estimates.',
  };

  it('renders quantified particulate avoidance metrics and city name', () => {
    render(<MyImpactDashboard exposure={mockExposure} cityName="Delhi" />);

    expect(screen.getByText(/Quantified Pollution Avoidance for Delhi/i)).toBeInTheDocument();
    expect(screen.getByText(/Intake Avoided per Day/i)).toBeInTheDocument();
    expect(screen.getByText(/Baseline Routine \(Unmitigated\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Shwaas Optimized Protocol/i)).toBeInTheDocument();
  });
});
