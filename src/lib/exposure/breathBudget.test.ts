import { describe, it, expect } from 'vitest';
import {
  calculateBreathBudget,
  calculateMemberBudget,
  calculateHouseholdPerPersonBudgets,
} from './breathBudget';

describe('Scientifically Grounded Breath Budget Calculator', () => {
  const mockHourlyForecast = [
    250, 260, 270, 280, 290, 300, 310, 280, 220, 160, 110, 80, 55, 45, 50, 65, 95, 140, 200, 240, 260, 270, 260, 250,
  ]; // Peak morning/night inversion, afternoon dip at index 12-14

  it('calculates inhaled mass and relative planning score without claiming medical safety limits', () => {
    const budget = calculateBreathBudget({
      currentAqi: 350,
      currentPm25: 220,
      hourlyPm25Forecast: mockHourlyForecast,
      hasPurifier: false,
      maskType: 'none',
      activities: [
        {
          id: '1',
          name: 'Morning Commute at 8 AM',
          timeOfDay: '08:00',
          scheduledHour: 8,
          durationMinutes: 45,
          intensity: 'moderate_commute',
          commuteType: 'two_wheeler',
          maskType: 'none',
        },
      ],
    });

    expect(budget.referenceScaleDescription).toContain('Relative Daily Exposure-Management Index');
    expect(budget.calculationAssumptions).toContain(
      'This is a decision-support exposure management model, NOT a personal or medical safety limit (PM2.5 has no zero-risk threshold).'
    );
    expect(budget.totalInhaledMassUg).toBeGreaterThan(0);
    expect(budget.netPointsSpent).toBeGreaterThan(0);
  });

  it('proves that rescheduling an activity to a cleaner forecast hour reduces inhaled mass', () => {
    // 8 AM commute (PM2.5 = 220)
    const morningCommute = calculateBreathBudget({
      currentAqi: 350,
      currentPm25: 220,
      hourlyPm25Forecast: mockHourlyForecast,
      hasPurifier: false,
      maskType: 'none',
      activities: [
        {
          id: '1',
          name: 'Commute',
          timeOfDay: '08:00',
          scheduledHour: 8,
          durationMinutes: 60,
          intensity: 'moderate_commute',
          commuteType: 'walk',
          maskType: 'none',
        },
      ],
    });

    // Same walk shifted to 1 PM (hour 13, PM2.5 = 45)
    const afternoonWalk = calculateBreathBudget({
      currentAqi: 350,
      currentPm25: 220,
      hourlyPm25Forecast: mockHourlyForecast,
      hasPurifier: false,
      maskType: 'none',
      activities: [
        {
          id: '1',
          name: 'Commute',
          timeOfDay: '13:00',
          scheduledHour: 13,
          durationMinutes: 60,
          intensity: 'moderate_commute',
          commuteType: 'walk',
          maskType: 'none',
        },
      ],
    });

    expect(afternoonWalk.totalInhaledMassUg).toBeLessThan(morningCommute.totalInhaledMassUg * 0.3);
    expect(afternoonWalk.netPointsSpent).toBeLessThan(morningCommute.netPointsSpent);
  });

  it('models indoor filtration as exposure avoided during operation rather than a retroactive refund', () => {
    const budget = calculateBreathBudget({
      currentAqi: 300,
      currentPm25: 180,
      hourlyPm25Forecast: mockHourlyForecast,
      hasPurifier: true,
      maskType: 'none',
      activities: [
        {
          id: '1',
          name: 'Bedroom Sleep with Purifier',
          timeOfDay: '22:00',
          scheduledHour: 22,
          durationMinutes: 480,
          intensity: 'sleep_rest',
          isIndoor: true,
          hasPurifier: true,
        },
      ],
    });

    const item = budget.items[0];
    expect(item.mitigatedMassAvoidedUg).toBeGreaterThan(0);
    expect(item.explanation).toContain('HEPA filtration avoided an estimated');
    expect(item.explanation).not.toContain('refunded');
    expect(budget.totalAvoidedMassUg).toBeGreaterThan(0);
  });

  describe('Per-Person Age-Appropriate Household Member Budgets', () => {
    it('applies differing physiological inhalation rates and reference intakes for child, adult, and senior', () => {
      const adult = calculateMemberBudget({
        memberType: 'adult',
        label: 'Adult',
        ageCategory: '18–64 yrs',
        currentPm25: 200,
        hourlyPm25Forecast: mockHourlyForecast,
        outdoorHours: 2,
        maskType: 'none',
        commuteType: 'two_wheeler',
        hasPurifier: false,
      });

      const child = calculateMemberBudget({
        memberType: 'child',
        label: 'Child',
        ageCategory: 'Age < 12 yrs',
        currentPm25: 200,
        hourlyPm25Forecast: mockHourlyForecast,
        outdoorHours: 2,
        maskType: 'none',
        commuteType: 'two_wheeler',
        hasPurifier: false,
      });

      const senior = calculateMemberBudget({
        memberType: 'senior',
        label: 'Senior',
        ageCategory: 'Age 65+ yrs',
        currentPm25: 200,
        hourlyPm25Forecast: mockHourlyForecast,
        outdoorHours: 2,
        maskType: 'none',
        commuteType: 'two_wheeler',
        hasPurifier: false,
      });

      // Verify EPA minute volumes
      expect(adult.sedentaryBreathingRate).toBe(0.55);
      expect(adult.activeBreathingRate).toBe(1.40);
      expect(adult.referenceDailyMassUg).toBe(216);

      expect(child.sedentaryBreathingRate).toBe(0.35);
      expect(child.activeBreathingRate).toBe(0.85);
      expect(child.referenceDailyMassUg).toBe(144);

      expect(senior.sedentaryBreathingRate).toBe(0.45);
      expect(senior.activeBreathingRate).toBe(0.95);
      expect(senior.referenceDailyMassUg).toBe(172);

      // Child has lower absolute mass intake due to smaller lung volume
      expect(child.inhaledMassUg).toBeLessThan(adult.inhaledMassUg);
      expect(senior.inhaledMassUg).toBeLessThan(adult.inhaledMassUg);
    });

    it('reacts dynamically to what-if overrides across all household members', () => {
      const baseline = calculateHouseholdPerPersonBudgets(
        {
          numKids: 1,
          numElderly: 1,
          commuteType: 'two_wheeler',
          hasPurifier: false,
          maskType: 'none',
          outdoorHours: 2,
        },
        200,
        mockHourlyForecast
      );

      expect(baseline).toHaveLength(3); // Adult, Child, Senior

      const mitigated = calculateHouseholdPerPersonBudgets(
        {
          numKids: 1,
          numElderly: 1,
          commuteType: 'two_wheeler',
          hasPurifier: false,
          maskType: 'none',
          outdoorHours: 2,
        },
        200,
        mockHourlyForecast,
        {
          maskType: 'n95_kn95',
          hasPurifier: true,
          shiftedWindow: true,
        }
      );

      expect(mitigated).toHaveLength(3);

      // Every member should have strictly lower points and higher avoided mass under what-if mitigations
      mitigated.forEach((m, idx) => {
        expect(m.pointsSpent).toBeLessThan(baseline[idx].pointsSpent);
        expect(m.avoidedMassUg).toBeGreaterThan(0);
      });
    });

    it('generates only configured household members', () => {
      // Household with no kids and no elderly
      const solo = calculateHouseholdPerPersonBudgets(
        {
          numKids: 0,
          numElderly: 0,
          commuteType: 'metro_bus_transit',
          hasPurifier: true,
          maskType: 'n95_kn95',
          outdoorHours: 1,
        },
        150
      );

      expect(solo).toHaveLength(1);
      expect(solo[0].memberType).toBe('adult');
    });
  });
});
