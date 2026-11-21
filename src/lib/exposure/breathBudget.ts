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

/**
 * Calculates time-resolved personal particulate intake (Breath Budget) across planned activities.
 *
 * Physical Model & Units:
 * - Inhaled Mass: Mass (µg) = PM2.5 Concentration (µg/m³) × Breathing Rate (m³/h) × Duration (h).
 * - Reference Intake Benchmark: 216 µg/day, corresponding to 24-hour sedentary breathing (0.60 m³/h,
 *   equivalent to 14.4 m³/day total inhalation) at the WHO 2021 24-hour guideline of 15 µg/m³.
 * - Relative Points: 100 points = 216 µg reference intake (2.16 µg per budget point).
 * - Breathing Rates: Derived from EPA Exposure Factors Handbook (2011) Table 6-1 (minute ventilation).
 *
 * @param params Calculation parameters including current PM2.5, hourly forecast, and activity schedule
 * @returns Comprehensive Breath Budget result with inhaled mass (µg), avoided mass (µg), and points
 */
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

// ==========================================
// PER-PERSON BREATH BUDGET MODEL
// ==========================================

export type HouseholdMemberType = 'child' | 'adult' | 'senior';

export interface WhatIfBudgetOverrides {
  maskType?: MaskType;
  hasPurifier?: boolean;
  commuteType?: CommuteType;
  shiftedWindow?: boolean; // shift errands to cleaner afternoon window
}

export interface MemberBudgetParams {
  memberType: HouseholdMemberType;
  label: string;
  ageCategory: string;
  currentPm25: number;
  hourlyPm25Forecast?: number[];
  outdoorHours: number;
  maskType: MaskType;
  commuteType: CommuteType;
  hasPurifier: boolean;
  whatIfOverrides?: WhatIfBudgetOverrides;
}

export interface MemberBudgetResult {
  memberType: HouseholdMemberType;
  label: string;
  ageCategory: string;
  sedentaryBreathingRate: number;
  activeBreathingRate: number;
  referenceDailyMassUg: number;
  inhaledMassUg: number;
  avoidedMassUg: number;
  pointsSpent: number;
  remainingPoints: number;
  percentageOfBudget: number;
  status: 'Within Reference Range' | 'Moderate Elevation' | 'Severe Particle Burden';
  statusColor: string;
  statusTextColor: string;
  vulnerabilityNote: string;
}

export const AGE_APPROPRIATE_RATES: Record<
  HouseholdMemberType,
  {
    sedentary: number;
    active: number;
    referenceDailyMassUg: number;
    vulnerabilityNote: string;
  }
> = {
  child: {
    sedentary: 0.35,
    active: 0.85,
    referenceDailyMassUg: 144, // 24h at 15 µg/m³ with child average 0.40 m³/h = 144 µg
    vulnerabilityNote: 'Developing respiratory airways. 1.3x higher aerosol surface deposition relative to lung capacity.',
  },
  adult: {
    sedentary: 0.55,
    active: 1.40,
    referenceDailyMassUg: 216, // 24h at 15 µg/m³ with adult average 0.60 m³/h = 216 µg
    vulnerabilityNote: 'Standard adult physiological baseline calibrated to EPA Exposure Factors Handbook.',
  },
  senior: {
    sedentary: 0.45,
    active: 0.95,
    referenceDailyMassUg: 172, // 24h at 15 µg/m³ with senior average 0.48 m³/h = 172 µg
    vulnerabilityNote: 'Reduced mucociliary clearance rate and elevated cardiovascular susceptibility to fine soot.',
  },
};

export function calculateMemberBudget(params: MemberBudgetParams): MemberBudgetResult {
  const {
    memberType,
    label,
    ageCategory,
    currentPm25,
    hourlyPm25Forecast = [],
    outdoorHours,
    maskType,
    commuteType,
    hasPurifier,
    whatIfOverrides = {},
  } = params;

  const rates = AGE_APPROPRIATE_RATES[memberType];

  // Resolve what-if interventions
  const activeMask: MaskType = whatIfOverrides.maskType ?? maskType;
  const activePurifier: boolean =
    whatIfOverrides.hasPurifier !== undefined ? whatIfOverrides.hasPurifier : hasPurifier;
  const activeCommute: CommuteType = whatIfOverrides.commuteType ?? commuteType;
  const isShifted: boolean = whatIfOverrides.shiftedWindow ?? false;

  const hoursOut = Math.max(0, Math.min(24, outdoorHours));
  const hoursIn = Math.max(0, 24 - hoursOut);

  // Scheduled outdoor ambient PM2.5 (13:00 for afternoon vs 08:00 morning peak)
  const outdoorHourIdx = isShifted ? 13 : 8;
  const ambientOutdoorPm25 =
    hourlyPm25Forecast.length > outdoorHourIdx
      ? Math.max(5, hourlyPm25Forecast[outdoorHourIdx])
      : Math.max(5, isShifted ? currentPm25 * 0.65 : currentPm25);

  // Mask penetration factor (accounting for typical 15-20% seal leakage for N95)
  const maskPen = MASK_PENETRATION_FACTORS[activeMask]?.['typical_fit'] ?? 1.0;

  // Commute corridor factor
  let transitMultiplier = 1.0;
  if (activeCommute === 'two_wheeler') transitMultiplier = 1.35;
  else if (activeCommute === 'car_ac') transitMultiplier = 0.35;
  else if (activeCommute === 'metro_bus_transit') transitMultiplier = 0.45;
  else if (activeCommute === 'walk') transitMultiplier = 1.10;

  const effectiveOutdoorConc = ambientOutdoorPm25 * maskPen * transitMultiplier;
  const outdoorInhaledMass = hoursOut * effectiveOutdoorConc * rates.active;

  // Indoor steady-state concentration via single-zone mass balance
  const indoorBalance = calculateIndoorMassBalance(
    Math.max(5, currentPm25),
    {
      roomAreaSqM: 16,
      ceilingHeightM: 2.8,
      hasPurifier: activePurifier,
      ventilationStrategy: 'sealed_windows',
      cookingFuel: 'lpg_electric',
    },
    hoursIn
  );

  const indoorInhaledMass = hoursIn * indoorBalance.estimatedIndoorConcentration * rates.sedentary;
  const totalInhaledMass = outdoorInhaledMass + indoorInhaledMass;

  // Unmitigated baseline counterfactual (open commute, morning trap, no mask, no purifier)
  const baselineOutdoorConc = Math.max(5, hourlyPm25Forecast[8] ?? currentPm25) * (commuteType === 'two_wheeler' ? 1.35 : 1.1);
  const unmitigatedOutdoorMass = hoursOut * baselineOutdoorConc * rates.active;
  const unmitigatedIndoorMass = hoursIn * indoorBalance.unmitigatedIndoorConcentration * rates.sedentary;
  const totalUnmitigatedMass = unmitigatedOutdoorMass + unmitigatedIndoorMass;

  const avoidedMass = Math.max(0, totalUnmitigatedMass - totalInhaledMass);

  // Points on relative 100-point scale for this member's reference
  const pointsSpent = Math.max(0, Math.round((totalInhaledMass / rates.referenceDailyMassUg) * 100));
  const remainingPoints = Math.max(0, 100 - pointsSpent);
  const percentageOfBudget = pointsSpent;

  let status: MemberBudgetResult['status'] = 'Within Reference Range';
  let statusColor = '#15803D';
  let statusTextColor = '#FFFFFF';

  if (pointsSpent > 160) {
    status = 'Severe Particle Burden';
    statusColor = '#7F1D1D';
    statusTextColor = '#FFFFFF';
  } else if (pointsSpent > 100) {
    status = 'Moderate Elevation';
    statusColor = '#D97706';
    statusTextColor = '#0F172A';
  }

  return {
    memberType,
    label,
    ageCategory,
    sedentaryBreathingRate: rates.sedentary,
    activeBreathingRate: rates.active,
    referenceDailyMassUg: rates.referenceDailyMassUg,
    inhaledMassUg: Math.round(totalInhaledMass * 10) / 10,
    avoidedMassUg: Math.round(avoidedMass * 10) / 10,
    pointsSpent,
    remainingPoints,
    percentageOfBudget,
    status,
    statusColor,
    statusTextColor,
    vulnerabilityNote: rates.vulnerabilityNote,
  };
}

export interface HouseholdProfileLike {
  numKids: number;
  numElderly: number;
  commuteType: CommuteType;
  hasPurifier: boolean;
  maskType: MaskType;
  outdoorHours: number;
}

/**
 * Calculates individualized daily particulate intake budgets for each demographic in a household.
 *
 * Age-Adjusted Ventilation & Activity Profiles:
 * - Adult (18-64 yrs): Base outdoor commute duration, 0.60 m³/h resting indoor, 1.40 m³/h commute.
 * - Child (< 12 yrs): Scaled lung minute ventilation per body mass; accounts for school transit & active play.
 * - Senior (65+ yrs): Reduced outdoor duration profile; vulnerability weighting for cardiovascular/pulmonary risk.
 *
 * Citation:
 * - US EPA Exposure Factors Handbook (2011 Edition, EPA/600/R-09/052F), Chapter 6 (Inhalation Rates).
 * - WHO Air Quality Guidelines (2021 global update).
 *
 * @param profile Household demographics, commute mode, and filtration mitigations
 * @param currentPm25 Current ambient PM2.5 in µg/m³
 * @param hourlyPm25Forecast 24-hour hourly ambient PM2.5 array in µg/m³
 * @param whatIfOverrides Optional counterfactual parameter overrides
 * @returns Array of individual member budget results with inhaled mass in µg and point scale
 */
export function calculateHouseholdPerPersonBudgets(
  profile: HouseholdProfileLike,
  currentPm25: number,
  hourlyPm25Forecast: number[] = [],
  whatIfOverrides?: WhatIfBudgetOverrides
): MemberBudgetResult[] {
  const members: MemberBudgetResult[] = [];

  // 1. Adult (You / Primary)
  members.push(
    calculateMemberBudget({
      memberType: 'adult',
      label: 'Adult (Primary)',
      ageCategory: '18 – 64 yrs',
      currentPm25,
      hourlyPm25Forecast,
      outdoorHours: profile.outdoorHours,
      maskType: profile.maskType,
      commuteType: profile.commuteType,
      hasPurifier: profile.hasPurifier,
      whatIfOverrides,
    })
  );

  // 2. Child (if profile has kids, or representative child)
  if (profile.numKids > 0) {
    // Kids typically have school commute + outdoor play (~1.5h outdoor)
    members.push(
      calculateMemberBudget({
        memberType: 'child',
        label: `Child (${profile.numKids} in home)`,
        ageCategory: 'Age < 12 yrs',
        currentPm25,
        hourlyPm25Forecast,
        outdoorHours: Math.min(profile.outdoorHours, 1.5),
        maskType: profile.maskType,
        commuteType: profile.commuteType,
        hasPurifier: profile.hasPurifier,
        whatIfOverrides,
      })
    );
  }

  // 3. Senior (if profile has elderly, or representative senior)
  if (profile.numElderly > 0) {
    // Seniors typically have fewer outdoor hours (~1.0h outdoor errand/park)
    members.push(
      calculateMemberBudget({
        memberType: 'senior',
        label: `Senior Citizen (${profile.numElderly} in home)`,
        ageCategory: 'Age 65+ yrs',
        currentPm25,
        hourlyPm25Forecast,
        outdoorHours: Math.min(profile.outdoorHours, 1.0),
        maskType: profile.maskType,
        commuteType: profile.commuteType,
        hasPurifier: profile.hasPurifier,
        whatIfOverrides,
      })
    );
  }

  return members;
}
