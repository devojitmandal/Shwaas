import { CommuteType, MaskType, MASK_PENETRATION_FACTORS, COMMUTE_FACTORS } from './engine';

export const DEFAULT_DAILY_ALLOWANCE_POINTS = 100;

export interface BudgetActivity {
  id: string;
  name: string;
  timeOfDay: string; // e.g. "08:00"
  durationMinutes: number;
  isPeakInversion: boolean; // morning 6-9 AM or late night
  isIndoor?: boolean;
  maskType?: MaskType;
  commuteType?: CommuteType;
  hasPurifier?: boolean;
}

export interface BudgetActivityItemResult {
  id: string;
  name: string;
  timeOfDay: string;
  durationMinutes: number;
  pointsCost: number; // Raw points spent
  pointsRefund: number; // Purifier or protective rebate
  netCost: number; // pointsCost - pointsRefund
  explanation: string;
}

export interface BreathBudgetResult {
  dailyAllowancePoints: number;
  totalSpentPoints: number;
  totalRefundPoints: number;
  netPointsSpent: number;
  remainingPoints: number;
  percentageUsed: number;
  budgetStatus: 'Within Safe Allowance' | 'Moderate Deficit' | 'Overdraft / Severe Hazard';
  statusColor: string;
  statusTextColor: string;
  items: BudgetActivityItemResult[];
}

export interface CalculateBudgetParams {
  currentAqi: number;
  pm25: number;
  hasPurifier: boolean;
  maskType: MaskType;
  activities: BudgetActivity[];
}

// 1 Breath Point ≈ 3.6 µg·h/m³ of inhaled particulate mass
const POINT_CONVERSION_FACTOR = 3.6;

export function calculateBreathBudget(params: CalculateBudgetParams): BreathBudgetResult {
  const { pm25, activities } = params;
  const cOut = Math.max(10, pm25);

  let totalSpent = 0;
  let totalRefund = 0;
  const items: BudgetActivityItemResult[] = [];

  activities.forEach((act) => {
    const hours = act.durationMinutes / 60;
    let pointsCost = 0;
    let pointsRefund = 0;
    let explanation = '';

    if (act.isIndoor) {
      // Indoor living activity
      const unmitigatedConc = cOut * 0.85; // Natural infiltration
      const rawDose = hours * unmitigatedConc;
      pointsCost = Math.round(rawDose / POINT_CONVERSION_FACTOR);

      if (act.hasPurifier) {
        // Purifier clears 75% of particulate
        const purifiedConc = cOut * 0.55 * 0.25;
        const mitigatedDose = hours * purifiedConc;
        const savedDose = rawDose - mitigatedDose;
        pointsRefund = Math.round(savedDose / POINT_CONVERSION_FACTOR);
        explanation = `HEPA air cleaning refunded ${pointsRefund} breath points by filtering indoor air.`;
      } else {
        explanation = `Seeped smog indoors consumed ${pointsCost} points over ${act.durationMinutes} min.`;
      }
    } else {
      // Outdoor activity
      const maskPen = MASK_PENETRATION_FACTORS[act.maskType || 'none'] ?? 1.0;
      const commuteMult = COMMUTE_FACTORS[act.commuteType || 'walk'] ?? 1.35;
      const inversionPenalty = act.isPeakInversion ? 1.25 : 1.0;

      const dose = hours * cOut * maskPen * commuteMult * inversionPenalty;
      pointsCost = Math.max(1, Math.round(dose / POINT_CONVERSION_FACTOR));

      const savings =
        maskPen < 1.0
          ? Math.round((hours * cOut * (1 - maskPen) * commuteMult) / POINT_CONVERSION_FACTOR)
          : 0;

      if (savings > 0) {
        explanation = `N95 protection saved ~${savings} points against roadway vehicular exhaust.`;
      } else if (act.isPeakInversion) {
        explanation = `Peak morning/night inversion penalty (+25% particle density).`;
      } else {
        explanation = `Afternoon travel during solar convective dispersion.`;
      }
    }

    const netCost = Math.max(0, pointsCost - pointsRefund);
    totalSpent += pointsCost;
    totalRefund += pointsRefund;

    items.push({
      id: act.id,
      name: act.name,
      timeOfDay: act.timeOfDay,
      durationMinutes: act.durationMinutes,
      pointsCost,
      pointsRefund,
      netCost,
      explanation,
    });
  });

  const netPointsSpent = Math.max(0, totalSpent - totalRefund);
  const remainingPoints = Math.max(0, DEFAULT_DAILY_ALLOWANCE_POINTS - netPointsSpent);
  const percentageUsed = Math.round((netPointsSpent / DEFAULT_DAILY_ALLOWANCE_POINTS) * 100);

  let budgetStatus: BreathBudgetResult['budgetStatus'] = 'Within Safe Allowance';
  let statusColor = '#15803D'; // Green
  let statusTextColor = '#FFFFFF';

  if (percentageUsed > 160) {
    budgetStatus = 'Overdraft / Severe Hazard';
    statusColor = '#7F1D1D'; // Dark Red
    statusTextColor = '#FFFFFF';
  } else if (percentageUsed > 100) {
    budgetStatus = 'Moderate Deficit';
    statusColor = '#D97706'; // Amber
    statusTextColor = '#0F172A';
  }

  return {
    dailyAllowancePoints: DEFAULT_DAILY_ALLOWANCE_POINTS,
    totalSpentPoints: totalSpent,
    totalRefundPoints: totalRefund,
    netPointsSpent,
    remainingPoints,
    percentageUsed,
    budgetStatus,
    statusColor,
    statusTextColor,
    items,
  };
}
