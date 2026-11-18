import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TimeWindowsCard from './TimeWindowsCard';
import { OutdoorWindow } from '@/lib/api/openMeteo';

describe('TimeWindowsCard Component', () => {
  const mockBestWindow: OutdoorWindow = {
    startTime: '2026-11-19T13:00',
    endTime: '2026-11-19T15:00',
    averageAqi: 120,
    averagePm25: 65,
    category: 'Moderate',
    advisory: 'Best afternoon window with solar thermal mixing.',
    reasoning: ['Boundary-layer expansion', 'Wind speed 14 km/h'],
    isSafe: false,
  };

  const mockWorstWindow: OutdoorWindow = {
    startTime: '2026-11-19T06:00',
    endTime: '2026-11-19T09:00',
    averageAqi: 360,
    averagePm25: 220,
    category: 'Very Poor',
    advisory: 'Severe nocturnal inversion smog trap.',
    reasoning: ['Low boundary layer', 'Radiation fog'],
    isSafe: false,
  };

  it('renders standard best and worst outdoor activity time windows', () => {
    render(<TimeWindowsCard bestWindow={mockBestWindow} worstWindow={mockWorstWindow} />);

    expect(screen.getByText(/Cleanest Activity Window/i)).toBeInTheDocument();
    expect(screen.getByText(/Peak Inversion Smog Trap/i)).toBeInTheDocument();
    expect(screen.getByText(/Boundary-layer expansion/i)).toBeInTheDocument();
  });

  it('displays prominent severe smog lockout alert when noSafeWindowAvailable is true', () => {
    render(
      <TimeWindowsCard
        bestWindow={mockBestWindow}
        worstWindow={mockWorstWindow}
        noSafeWindowAvailable={true}
        alertHeadline="Hazardous Inversion Lockout"
      />
    );

    const alertBanner = screen.getByRole('alert');
    expect(alertBanner).toBeInTheDocument();
    expect(screen.getByText(/Hazardous Inversion Lockout/i)).toBeInTheDocument();
    expect(screen.getByText(/least-polluted interval/i)).toBeInTheDocument();
  });
});
