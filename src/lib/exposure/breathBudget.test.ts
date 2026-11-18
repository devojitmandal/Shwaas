import { describe, it, expect } from 'vitest';
import {
  calculateBreathBudget,
  DEFAULT_DAILY_ALLOWANCE_POINTS,
} from './breathBudget';

describe('Breath Budget Calculator', () => {
  it('calculates initial baseline budget and identifies particle overdraft', () => {
    const budget = calculateBreathBudget({
      currentAqi: 350,
      pm25: 200,
      hasPurifier: false,
      maskType: 'none',
      activities: [
        {
          id: '1',
          name: 'Morning Two-Wheeler Commute',
          timeOfDay: '08:00',
          durationMinutes: 45,
          isPeakInversion: true,
          maskType: 'none',
          commuteType: 'two_wheeler',
        },
        {
          id: '2',
          name: 'Evening Market Walk',
          timeOfDay: '18:30',
          durationMinutes: 40,
          isPeakInversion: true,
          maskType: 'none',
          commuteType: 'walk',
        },
        {
          id: '3',
          name: 'Indoor Sleep (No Purifier, Windows Open)',
          timeOfDay: '22:00',
          durationMinutes: 480,
          isPeakInversion: false,
          isIndoor: true,
          hasPurifier: false,
        },
      ],
    });

    expect(budget.dailyAllowancePoints).toBe(DEFAULT_DAILY_ALLOWANCE_POINTS);
    expect(budget.totalSpentPoints).toBeGreaterThan(DEFAULT_DAILY_ALLOWANCE_POINTS);
    expect(budget.budgetStatus).toBe('Overdraft / Severe Hazard');
    expect(budget.items.length).toBe(3);
  });

  it('applies N95 discount to outdoor activities and purifier refund for indoor rest', () => {
    const budget = calculateBreathBudget({
      currentAqi: 350,
      pm25: 200,
      hasPurifier: true,
      maskType: 'n95_kn95',
      activities: [
        {
          id: '1',
          name: 'Morning Commute with N95',
          timeOfDay: '08:00',
          durationMinutes: 45,
          isPeakInversion: true,
          maskType: 'n95_kn95',
          commuteType: 'metro_bus_transit',
        },
        {
          id: '2',
          name: 'Clean-Room Rest with HEPA Purifier',
          timeOfDay: '22:00',
          durationMinutes: 480,
          isPeakInversion: false,
          isIndoor: true,
          hasPurifier: true,
        },
      ],
    });

    // The outdoor commute with N95 + metro should cost vastly fewer points
    const commuteItem = budget.items.find((i) => i.id === '1');
    expect(commuteItem?.pointsCost).toBeLessThan(15);

    // Indoor rest with purifier gives a purifier refund/credit
    const indoorItem = budget.items.find((i) => i.id === '2');
    expect(indoorItem?.pointsRefund).toBeGreaterThan(0);
    expect(budget.netPointsSpent).toBeLessThan(budget.totalSpentPoints);
  });
});
