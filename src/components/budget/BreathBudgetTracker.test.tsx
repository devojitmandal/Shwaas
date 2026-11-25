import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BreathBudgetTracker from './BreathBudgetTracker';

describe('BreathBudgetTracker Component', () => {
  it('syncs baseline activity ledger with updated household profile props without remounting', () => {
    const { rerender } = render(
      <BreathBudgetTracker
        currentAqi={300}
        pm25={180}
        hasPurifier={false}
        maskType="none"
        commuteType="two_wheeler"
        numKids={1}
        numElderly={0}
        outdoorHours={2}
      />
    );

    // Initially no N95 on morning commute and no HEPA purifier on night sleep
    expect(screen.getAllByRole('button', { name: /\+ Put on N95 mask/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /\+ Turn on HEPA purifier/i })).toBeInTheDocument();

    // Household profile updated in modal: N95 + HEPA purifier enabled
    rerender(
      <BreathBudgetTracker
        currentAqi={300}
        pm25={180}
        hasPurifier={true}
        maskType="n95_kn95"
        commuteType="metro_bus_transit"
        numKids={1}
        numElderly={0}
        outdoorHours={2}
      />
    );

    expect(screen.getByRole('button', { name: /N95 Fitted/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /HEPA Purifier Active/i })).toBeInTheDocument();
  });
});
