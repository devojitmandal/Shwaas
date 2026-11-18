import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import WhatIfSimulator from './WhatIfSimulator';
import { ExposureProfile } from '@/lib/exposure/engine';

describe('WhatIfSimulator Interactive Component', () => {
  const mockProfile: ExposureProfile = {
    currentAqi: 350,
    pm25Concentration: 210,
    timeOutdoorsHours: 2,
    commuteType: 'two_wheeler',
    maskType: 'none',
    indoorHours: 22,
    hasPurifier: false,
    cookingFuel: 'lpg_electric',
    ventilationStrategy: 'windows_open',
    vulnerableMembers: { hasKids: true, hasElderly: false },
  };

  it('renders simulator and updates live dose comparison when quick scenario is triggered', () => {
    render(<WhatIfSimulator currentProfile={mockProfile} />);

    expect(screen.getByText('Simulate Interventions & Measure Gain')).toBeInTheDocument();

    // Click quick scenario: "Metro + N95 Respirator"
    const metroBtn = screen.getByText('Metro + N95 Respirator');
    fireEvent.click(metroBtn);

    // Verify status updates with reduction
    const statusBox = screen.getByRole('status');
    expect(statusBox.textContent).toContain('Inhaled Dose');
  });
});
