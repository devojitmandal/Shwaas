import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CurrentAqiCard from './CurrentAqiCard';

describe('CurrentAqiCard Accessibility and Display', () => {
  it('renders NAQI value, category, pollutant concentrations and dominant driver', () => {
    render(
      <CurrentAqiCard
        cityName="Delhi, India"
        aqi={320}
        pm25={185}
        pm10={260}
        dominantPollutant="PM2.5"
        category="Very Poor"
        chipBg="#DC2626"
        textColor="#FFFFFF"
        description="Respiratory illness on prolonged exposure."
        timestamp="2026-11-19T08:00:00"
      />
    );

    expect(screen.getByText('Delhi, India')).toBeInTheDocument();
    expect(screen.getByText('320')).toBeInTheDocument();
    expect(screen.getByText('Very Poor')).toBeInTheDocument();
    expect(screen.getByText('185')).toBeInTheDocument();
    expect(screen.getByText('260')).toBeInTheDocument();
    expect(screen.getByText('PM2.5')).toBeInTheDocument();

    // Verify accessibility status label exists and contains category
    const statusChip = screen.getByRole('status');
    expect(statusChip).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Very Poor')
    );
  });
});
