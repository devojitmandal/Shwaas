import {
  CommuteType,
  MaskType,
  MaskFitQuality,
  ActivityIntensity,
  BREATHING_RATES,
  MASK_PENETRATION_FACTORS,
  calculateIndoorMassBalance,
} from './engine';

export const REFERENCE_DAILY_MASS_UG = 216; // 24h at 15 µg/m³ with 0.6 m³/h sedentary rate = 216 µg
export const BUDGET_SCALE_POINTS = 100; // 100 relative points = 216 µg reference intake
export const UG_PER_BUDGET_POINT = REFERENCE_DAILY_MASS_UG / BUDGET_SCALE_POINTS; // 2.16 µg per point

export interface BudgetActivity {
  id: string;
  name: string;
  timeOfDay: string; // e.g. "08:30"
  scheduledHour: number; // 0 to 23
  durationMinutes: number;
  intensity: ActivityIntensity;
  isIndoor?: boolean;
  maskType?: MaskType;
  maskFit?: MaskFitQuality;
  commuteType?: CommuteType;
  hasPurifier?: boolean;
}

export interface BudgetActivityItemResult {
  id: string;
  name: string;
  timeOfDay: string;
  scheduledHour: number;
  durationMinutes: number;
  intensity: ActivityIntensity;
  inhaledMassUg: number; // Inhaled particulate mass in µg
  unmitigatedMassUg: number; // Inhaled mass if no mask/purifier was used
  mitigatedMassAvoidedUg: number; // Mass avoided due to mask or indoor filtration
  pointsSpent: number; // Relative planning points
  pointsAvoided: number; // Relative points avoided via active intervention
  appliedConcentrationUgM3: number; // Ambient PM2.5 concentration for that hour
  explanation: string;
}

export interface BreathBudgetResult {
  referenceScaleDescription: string;
  totalInhaledMassUg: number;
  totalAvoidedMassUg: number;
  netPointsSpent: number;
  remainingPoints: number;
  percentageOfReferenceIntake: number;
  budgetStatus: 'Within Reference Range' | 'Moderate Elevation' | 'Severe Particle Burden';
  statusColor: string;
  statusTextColor: string;
  items: BudgetActivityItemResult[];
  calculationAssumptions: string[];
}

export interface CalculateBudgetParams {
  currentAqi: number;
  currentPm25: number;
  hourlyPm25Forecast?: number[]; // array of 24 hourly PM2.5 concentrations
  hasPurifier: boolean;
  maskType: MaskType;
  activities: BudgetActivity[];
}

export function calculateBreathBudget(params: CalculateBudgetParams): BreathBudgetResult {
  const { currentPm25, hourlyPm25Forecast = [], activities } = params;

  let totalInhaledMass = 0;
  let totalAvoidedMass = 0;
  const items: BudgetActivityItemResult[] = [];

  activities.forEach((act) => {
    const hours = Math.max(0, act.durationMinutes / 60);
    // Retrieve forecast PM2.5 for this scheduled hour, fallback to currentPm25
    const hourIdx = Math.max(0, Math.min(23, act.scheduledHour ?? 12));
    const ambientPm25 =
      hourlyPm25Forecast.length > hourIdx
        ? Math.max(5, hourlyPm25Forecast[hourIdx])
        : Math.max(5, currentPm25);

    const breathingRate = BREATHING_RATES[act.intensity] ?? BREATHING_RATES.moderate_commute;

    let inhaledMassUg = 0;
    let unmitigatedMassUg = 0;
    let mitigatedMassAvoidedUg = 0;
    let explanation = '';

    if (act.isIndoor) {
      // Indoor mass-balance estimation
      const balance = calculateIndoorMassBalance(
        ambientPm25,
        {
          roomAreaSqM: 16,
          ceilingHeightM: 2.8,
          hasPurifier: !!act.hasPurifier,
          ventilationStrategy: 'sealed_windows',
          cookingFuel: 'lpg_electric',
        },
        hours
      );

      inhaledMassUg = hours * balance.estimatedIndoorConcentration * breathingRate;
      unmitigatedMassUg = hours * balance.unmitigatedIndoorConcentration * breathingRate;
      mitigatedMassAvoidedUg = Math.max(0, unmitigatedMassUg - inhaledMassUg);

      if (act.hasPurifier && mitigatedMassAvoidedUg > 0) {
        explanation = `HEPA filtration avoided an estimated ${Math.round(mitigatedMassAvoidedUg)} µg of indoor particulate intake during this ${act.durationMinutes}-min rest.`;
      } else {
        explanation = `Indoor infiltration resulted in ~${Math.round(inhaledMassUg)} µg intake at indoor concentration of ~${Math.round(balance.estimatedIndoorConcentration)} µg/m³.`;
      }
    } else {
      // Outdoor activity
      const fit = act.maskFit || 'typical_fit';
      const maskPen = MASK_PENETRATION_FACTORS[act.maskType || 'none']?.[fit] ?? 1.0;

      let transitFactor = 1.0;
      if (act.commuteType === 'car_ac') transitFactor = 0.40;
      if (act.commuteType === 'metro_bus_transit') transitFactor = 0.50;

      const effectiveConc = ambientPm25 * maskPen * transitFactor;
      inhaledMassUg = hours * effectiveConc * breathingRate;

      // Counterfactual unmitigated outdoor intake (no mask, open commute)
      unmitigatedMassUg = hours * ambientPm25 * breathingRate;
      mitigatedMassAvoidedUg = Math.max(0, unmitigatedMassUg - inhaledMassUg);

      if (mitigatedMassAvoidedUg > 0) {
        explanation = `Protection (mask/transit filtration) avoided ~${Math.round(mitigatedMassAvoidedUg)} µg of outdoor intake.`;
      } else {
        explanation = `Unfiltered ambient exposure during ${act.timeOfDay} (ambient PM2.5: ${Math.round(ambientPm25)} µg/m³).`;
      }
    }

    totalInhaledMass += inhaledMassUg;
    totalAvoidedMass += mitigatedMassAvoidedUg;

    const pointsSpent = Math.max(0, Math.round(inhaledMassUg / UG_PER_BUDGET_POINT));
    const pointsAvoided = Math.max(0, Math.round(mitigatedMassAvoidedUg / UG_PER_BUDGET_POINT));

    items.push({
      id: act.id,
      name: act.name,
      timeOfDay: act.timeOfDay,
      scheduledHour: hourIdx,
      durationMinutes: act.durationMinutes,
      intensity: act.intensity,
      inhaledMassUg: Math.round(inhaledMassUg * 10) / 10,
      unmitigatedMassUg: Math.round(unmitigatedMassUg * 10) / 10,
      mitigatedMassAvoidedUg: Math.round(mitigatedMassAvoidedUg * 10) / 10,
      pointsSpent,
      pointsAvoided,
      appliedConcentrationUgM3: Math.round(ambientPm25),
      explanation,
    });
  });

  const netPointsSpent = Math.round(totalInhaledMass / UG_PER_BUDGET_POINT);
  const remainingPoints = Math.max(0, BUDGET_SCALE_POINTS - netPointsSpent);
  const percentageOfReferenceIntake = Math.round((netPointsSpent / BUDGET_SCALE_POINTS) * 100);

  let budgetStatus: BreathBudgetResult['budgetStatus'] = 'Within Reference Range';
  let statusColor = '#15803D'; // Green
  let statusTextColor = '#FFFFFF';

  if (percentageOfReferenceIntake > 160) {
    budgetStatus = 'Severe Particle Burden';
    statusColor = '#7F1D1D'; // Dark Red
    statusTextColor = '#FFFFFF';
  } else if (percentageOfReferenceIntake > 100) {
    budgetStatus = 'Moderate Elevation';
    statusColor = '#D97706'; // Amber
    statusTextColor = '#0F172A';
  }

  const calculationAssumptions = [
    'Relative planning index (100 points = equivalent particulate intake of an entire 24h day at WHO 15 µg/m³ guideline).',
    'This is a decision-support exposure management model, NOT a personal or medical safety limit (PM2.5 has no zero-risk threshold).',
    'Breathing rates: sleep (0.45 m³/h), sedentary (0.60 m³/h), transit (0.90 m³/h), commute (1.40 m³/h), exercise (2.20 m³/h).',
    'Purifiers reduce future indoor concentration during operation; they do NOT reverse previously inhaled pollution.',
    'N95 protection accounts for real-world face-seal leakage uncertainty (typical fit provides ~75–85% effective reduction).',
  ];

  return {
    referenceScaleDescription:
      'Relative Daily Exposure-Management Index (100 pts = baseline equivalent of 24h at WHO 15 µg/m³ guideline)',
    totalInhaledMassUg: Math.round(totalInhaledMass * 10) / 10,
    totalAvoidedMassUg: Math.round(totalAvoidedMass * 10) / 10,
    netPointsSpent,
    remainingPoints,
    percentageOfReferenceIntake,
    budgetStatus,
    statusColor,
    statusTextColor,
    items,
    calculationAssumptions,
  };
}
