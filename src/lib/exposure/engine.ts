import { NaqiCategory, getNaqiCategory } from '../aqi/naqi';

export type CommuteType =
  | 'walk'
  | 'bicycle'
  | 'two_wheeler'
  | 'car_open'
  | 'car_ac'
  | 'metro_bus_transit';

export type MaskType = 'none' | 'cloth_surgical' | 'n95_kn95';

export type MaskFitQuality = 'tight_fit' | 'typical_fit' | 'loose_fit';

export type ActivityIntensity =
  | 'sleep_rest'
  | 'sedentary_indoor'
  | 'light_transit'
  | 'moderate_commute'
  | 'strenuous_exercise';

export type CookingFuel = 'lpg_electric' | 'biomass_kerosene' | 'wood';

export type VentilationStrategy =
  | 'windows_open'
  | 'sealed_windows'
  | 'timed_afternoon';

export interface RoomParameters {
  roomAreaSqM: number; // e.g. 15 m² (approx 160 sq ft bedroom)
  ceilingHeightM: number; // e.g. 2.8 m
  cadrM3H?: number; // Clean Air Delivery Rate in m³/h (standard purifier ~200-300 m³/h)
  hasPurifier: boolean;
  ventilationStrategy: VentilationStrategy;
  cookingFuel: CookingFuel;
}

export interface ExposureProfile {
  currentAqi: number;
  pm25Concentration: number; // in µg/m³
  timeOutdoorsHours: number; // e.g. 0 to 24
  commuteType: CommuteType;
  maskType: MaskType;
  maskFit?: MaskFitQuality;
  indoorHours: number; // e.g. 24 - timeOutdoorsHours
  hasPurifier: boolean;
  cookingFuel: CookingFuel;
  ventilationStrategy: VentilationStrategy;
  roomParameters?: Partial<RoomParameters>;
  vulnerableMembers: {
    hasKids: boolean;
    hasElderly: boolean;
  };
}

// Inhalation rates by activity intensity in m³/hour (source: EPA Exposure Factors Handbook)
export const BREATHING_RATES: Record<ActivityIntensity, number> = {
  sleep_rest: 0.45, // ~7.5 L/min
  sedentary_indoor: 0.60, // ~10 L/min
  light_transit: 0.90, // ~15 L/min
  moderate_commute: 1.40, // ~23 L/min (walking, light cycling, two-wheeler)
  strenuous_exercise: 2.20, // ~37 L/min (running, heavy cycling)
};

// Mask penetration factor accounting for fit uncertainty
export const MASK_PENETRATION_FACTORS: Record<MaskType, Record<MaskFitQuality, number>> = {
  none: { tight_fit: 1.0, typical_fit: 1.0, loose_fit: 1.0 },
  cloth_surgical: { tight_fit: 0.65, typical_fit: 0.70, loose_fit: 0.80 },
  n95_kn95: { tight_fit: 0.08, typical_fit: 0.20, loose_fit: 0.45 },
};

// Infiltration Air Exchange Rates (AER in air changes per hour: h⁻¹)
export const AIR_EXCHANGE_RATES: Record<VentilationStrategy, number> = {
  sealed_windows: 0.35, // Tight residential envelope with closed doors/windows
  timed_afternoon: 0.65, // Closed during smog peaks; brief afternoon air flush
  windows_open: 2.50, // Free natural cross-ventilation
};

// Indoor particulate emission rates (µg/hour) from combustion/cooking
export const INDOOR_SOURCE_EMISSIONS: Record<CookingFuel, number> = {
  lpg_electric: 150, // Clean flame with modest kitchen exhaust
  biomass_kerosene: 1200, // Elevated fine particulate from fuel combustion
  wood: 3500, // Heavy solid fuel / biomass plume
};

export const DEFAULT_ROOM_AREA_SQM = 16;
export const DEFAULT_CEILING_HEIGHT_M = 2.8;
export const DEFAULT_PURIFIER_CADR_M3H = 250; // Standard medium-room HEPA cleaner
export const PARTICLE_PENETRATION_EFFICIENCY = 0.80; // Building envelope filter factor
export const SURFACE_DEPOSITION_RATE_PER_H = 0.20; // Natural settling velocity for PM2.5

export interface IndoorMassBalanceResult {
  estimatedIndoorConcentration: number; // in µg/m³
  unmitigatedIndoorConcentration: number; // without purifier
  indoorExposureAvoidedPerDayUg: number; // particulate mass avoided in indoor hours
  roomVolumeM3: number;
  effectiveAirCleaningRate: number; // h⁻¹
  label: string;
}

/**
 * Single-zone steady-state indoor mass-balance model for fine particulate matter (PM2.5).
 *
 * Governing Equation:
 * C_in = (P * AER * C_out + S / V) / (AER + k_dep + CADR / V)
 *
 * Parameters & Units:
 * - C_out: Ambient PM2.5 concentration in µg/m³
 * - C_in: Steady-state indoor PM2.5 concentration in µg/m³
 * - V: Room volume (Area [m²] × Height [m]) in m³
 * - AER: Air exchange rate in h⁻¹ (infiltration / ventilation)
 * - P: Envelope penetration efficiency factor (dimensionless, ~0.80 for PM2.5)
 * - k_dep: Surface deposition rate in h⁻¹ (~0.20 h⁻¹ for fine particles)
 * - CADR: Clean Air Delivery Rate of mechanical filtration in m³/h
 * - S: Indoor combustion / activity emission rate in µg/h
 *
 * Citations:
 * - Nazaroff, W. W. (2004). Indoor particle dynamics. Indoor Air, 14(s7), 175-183.
 * - Bennett, D. H., & Koutrakis, P. (2006). Determining the infiltration of outdoor particles in the indoor environment.
 *
 * @param cOut Ambient PM2.5 concentration in µg/m³
 * @param params Room geometry, mechanical air cleaning (CADR), ventilation, and cooking fuel
 * @param indoorHours Daily hours spent inside this indoor microenvironment
 * @returns Estimated indoor concentration (µg/m³) and daily inhaled mass avoided (µg)
 */
export function calculateIndoorMassBalance(
  cOut: number,
  params: RoomParameters,
  indoorHours = 20
): IndoorMassBalanceResult {
  const roomArea = Math.max(5, params.roomAreaSqM || DEFAULT_ROOM_AREA_SQM);
  const ceilingHeight = Math.max(2, params.ceilingHeightM || DEFAULT_CEILING_HEIGHT_M);
  const volume = roomArea * ceilingHeight; // V in m³

  const aer = AIR_EXCHANGE_RATES[params.ventilationStrategy] ?? 0.65;
  const p = PARTICLE_PENETRATION_EFFICIENCY;
  const kDep = SURFACE_DEPOSITION_RATE_PER_H;
  const sourceEmission = INDOOR_SOURCE_EMISSIONS[params.cookingFuel] ?? 150;

  // CADR removal rate in h⁻¹
  const cadr = params.hasPurifier ? params.cadrM3H || DEFAULT_PURIFIER_CADR_M3H : 0;
  const cadrRemovalRate = cadr / volume;

  // Steady-state indoor concentration with active controls
  const totalRemoval = aer + kDep + cadrRemovalRate;
  const numerator = p * aer * Math.max(0, cOut) + sourceEmission / volume;
  const cInMitigated = Math.max(1, numerator / totalRemoval);

  // Counterfactual baseline without purifier
  const unmitigatedRemoval = aer + kDep;
  const cInUnmitigated = Math.max(1, numerator / unmitigatedRemoval);

  // Difference in inhaled indoor mass
  const sedentaryBreathing = BREATHING_RATES.sedentary_indoor;
  const avoidedInhaledMassUg = Math.max(
    0,
    (cInUnmitigated - cInMitigated) * sedentaryBreathing * indoorHours
  );

  return {
    estimatedIndoorConcentration: Math.round(cInMitigated * 10) / 10,
    unmitigatedIndoorConcentration: Math.round(cInUnmitigated * 10) / 10,
    indoorExposureAvoidedPerDayUg: Math.round(avoidedInhaledMassUg * 10) / 10,
    roomVolumeM3: Math.round(volume * 10) / 10,
    effectiveAirCleaningRate: Math.round(totalRemoval * 100) / 100,
    label: 'Calculated via physical mass-balance model (estimate, not physical sensor reading)',
  };
}

export interface ExposureResult {
  // Physical Inhaled Particulate Mass (in µg inhaled)
  totalInhaledMassUg: number;
  outdoorInhaledMassUg: number;
  indoorInhaledMassUg: number;

  // Normalized Exposure Index (previously baselineDose, in µg·h/m³ for backward compatibility)
  baselineDose: number;
  outdoorDose: number;
  indoorDose: number;
  indoorConcentration: number; // estimated steady-state indoor PM2.5 in µg/m³

  // Mitigation impact
  optimizedInhaledMassUg: number;
  avoidedInhaledMassUg: number;
  potentialReductionPercent: number;

  // Health risk tier & provenance
  naqiCategory: NaqiCategory;
  healthRiskTier:
    | 'Minimal'
    | 'Low'
    | 'Moderate Warning'
    | 'High Hazard'
    | 'Severe Hazard'
    | 'Critical Emergency'
    | 'Extreme Hazard';
  vulnerabilityAlert: boolean;
  recommendedInterventions: string[];
  uncertaintyRating: 'High' | 'Medium' | 'Configurable Estimate';
  dataProvenance: string;
}

export interface WhatIfScenarioResult {
  originalDose: number;
  newDose: number;
  doseDifference: number;
  doseReductionPercent: number;
  originalMassUg: number;
  newMassUg: number;
  avoidedMassUg: number;
  verdict: string;
  assumptions: string[];
}

/**
 * Calculates physical inhaled particulate mass intake (in µg) and normalized daily exposure index.
 *
 * Microenvironmental Time-Activity Model:
 * - Inhaled Mass (µg) = ∑ [ C_micro (µg/m³) × Breathing_Rate_micro (m³/h) × Duration_micro (h) × (1 - Filtration_Efficiency) ]
 *
 * Physical Microenvironments:
 * 1. Outdoor Commute: Ambient concentration adjusted for transit cabin filtration (e.g. AC cabin ~60% reduction)
 *    and personal respirator penetration (N95 tight: 8% penetration; typical: 20% penetration).
 *    Breathing rate: 1.40 m³/h (moderate commute) or 2.20 m³/h (bicycle).
 * 2. Indoor Residence: Steady-state concentration from single-zone mass balance model.
 *    Breathing rate: 0.60 m³/h (sedentary indoor).
 *
 * Citations:
 * - US EPA Exposure Factors Handbook (2011 Edition, EPA/600/R-09/052F), Table 6-1.
 * - CPCB (2014) National Air Quality Index report for health hazard breakpoint classification.
 *
 * @param profile Personal exposure profile including ambient air quality, commute mode, and mitigation gear
 * @returns Inhaled particulate mass intake (µg), baseline exposure dose (µg·h/m³), and health risk tier
 */
export function calculateDailyExposure(profile: ExposureProfile): ExposureResult {
  const naqiInfo = getNaqiCategory(profile.currentAqi);
  const cOut = Math.max(0, profile.pm25Concentration);

  // Outdoor activity calculation
  const outdoorHours = Math.max(0, Math.min(24, profile.timeOutdoorsHours));
  const fit = profile.maskFit || 'typical_fit';
  const maskPen = MASK_PENETRATION_FACTORS[profile.maskType || 'none']?.[fit] ?? 1.0;

  // Commute breathing rate
  let outdoorBreathingRate = BREATHING_RATES.moderate_commute;
  if (profile.commuteType === 'bicycle') {
    outdoorBreathingRate = BREATHING_RATES.strenuous_exercise;
  } else if (profile.commuteType === 'car_ac' || profile.commuteType === 'metro_bus_transit') {
    outdoorBreathingRate = BREATHING_RATES.light_transit;
  }

  // Cabin filtration for AC vehicle / closed transit
  let transitCabinFactor = 1.0;
  if (profile.commuteType === 'car_ac') {
    transitCabinFactor = 0.40; // Recirculating cabin filter
  } else if (profile.commuteType === 'metro_bus_transit') {
    transitCabinFactor = 0.50; // Mechanically filtered air
  }

  const effectiveOutdoorConc = cOut * maskPen * transitCabinFactor;
  const outdoorInhaledMassUg = outdoorHours * effectiveOutdoorConc * outdoorBreathingRate;
  const outdoorDose = outdoorHours * effectiveOutdoorConc;

  // Indoor activity calculation via mass-balance model
  const indoorHours = Math.max(0, 24 - outdoorHours);
  const indoorParams: RoomParameters = {
    roomAreaSqM: profile.roomParameters?.roomAreaSqM || DEFAULT_ROOM_AREA_SQM,
    ceilingHeightM: profile.roomParameters?.ceilingHeightM || DEFAULT_CEILING_HEIGHT_M,
    cadrM3H: profile.roomParameters?.cadrM3H || DEFAULT_PURIFIER_CADR_M3H,
    hasPurifier: profile.hasPurifier,
    ventilationStrategy: profile.ventilationStrategy,
    cookingFuel: profile.cookingFuel,
  };

  const indoorBalance = calculateIndoorMassBalance(cOut, indoorParams, indoorHours);
  const indoorBreathingRate = BREATHING_RATES.sedentary_indoor;
  const indoorInhaledMassUg = indoorHours * indoorBalance.estimatedIndoorConcentration * indoorBreathingRate;
  const indoorDose = indoorHours * indoorBalance.estimatedIndoorConcentration;

  const totalInhaledMassUg = outdoorInhaledMassUg + indoorInhaledMassUg;
  const baselineDose = outdoorDose + indoorDose;

  // Health risk tier based on NAQI and vulnerability
  const hasVulnerable =
    profile.vulnerableMembers.hasKids || profile.vulnerableMembers.hasElderly;
  let healthRiskTier: ExposureResult['healthRiskTier'] = 'Minimal';

  if (naqiInfo.category === 'Good') {
    healthRiskTier = 'Minimal';
  } else if (naqiInfo.category === 'Satisfactory') {
    healthRiskTier = 'Low';
  } else if (naqiInfo.category === 'Moderate') {
    healthRiskTier = 'Moderate Warning';
  } else if (naqiInfo.category === 'Poor') {
    healthRiskTier = 'High Hazard';
  } else if (naqiInfo.category === 'Very Poor') {
    healthRiskTier = hasVulnerable ? 'Critical Emergency' : 'Severe Hazard';
  } else {
    healthRiskTier = hasVulnerable ? 'Critical Emergency' : 'Extreme Hazard';
  }

  // Optimized Counterfactual Routine (N95 outdoors + Sealed Windows + HEPA purifier indoors)
  const optimalOutdoorHours = Math.min(outdoorHours, 1.0);
  const optimalOutdoorConc = cOut * MASK_PENETRATION_FACTORS.n95_kn95.tight_fit * 0.5;
  const optimalOutdoorMass = optimalOutdoorHours * optimalOutdoorConc * BREATHING_RATES.light_transit;

  const optimalIndoorParams: RoomParameters = {
    ...indoorParams,
    hasPurifier: true,
    ventilationStrategy: 'sealed_windows',
    cookingFuel: 'lpg_electric',
  };
  const optimalIndoorBalance = calculateIndoorMassBalance(cOut, optimalIndoorParams, 24 - optimalOutdoorHours);
  const optimalIndoorMass = (24 - optimalOutdoorHours) * optimalIndoorBalance.estimatedIndoorConcentration * indoorBreathingRate;
  const optimizedInhaledMassUg = optimalOutdoorMass + optimalIndoorMass;

  const avoidedInhaledMassUg = Math.max(0, totalInhaledMassUg - optimizedInhaledMassUg);
  const potentialReductionPercent =
    totalInhaledMassUg > 0
      ? Math.max(0, Math.min(95, Math.round((avoidedInhaledMassUg / totalInhaledMassUg) * 100)))
      : 0;

  const recommendations: string[] = [];
  if (profile.maskType !== 'n95_kn95' && profile.currentAqi > 100) {
    recommendations.push(
      'Wear a snug-fitting N95/FFP2 respirator outdoors (typical real-world fit reduces inhaled particles by ~75–90%).'
    );
  }
  if (!profile.hasPurifier && profile.currentAqi > 150) {
    recommendations.push(
      'Establish a bedroom clean room with a HEPA purifier or properly constructed DIY box-fan + MERV 13 filter.'
    );
  }
  if (profile.ventilationStrategy === 'windows_open' && profile.currentAqi > 100) {
    recommendations.push(
      'Keep windows sealed during high pollution periods when outdoor air is worse than indoor air.'
    );
  }
  if (profile.commuteType === 'two_wheeler' || profile.commuteType === 'walk') {
    recommendations.push(
      'Shift commute to metro transit or closed-cabin vehicles with AC recirculation during severe smog.'
    );
  }

  return {
    totalInhaledMassUg: Math.round(totalInhaledMassUg * 10) / 10,
    outdoorInhaledMassUg: Math.round(outdoorInhaledMassUg * 10) / 10,
    indoorInhaledMassUg: Math.round(indoorInhaledMassUg * 10) / 10,
    baselineDose: Math.round(baselineDose * 10) / 10,
    outdoorDose: Math.round(outdoorDose * 10) / 10,
    indoorDose: Math.round(indoorDose * 10) / 10,
    indoorConcentration: indoorBalance.estimatedIndoorConcentration,
    optimizedInhaledMassUg: Math.round(optimizedInhaledMassUg * 10) / 10,
    avoidedInhaledMassUg: Math.round(avoidedInhaledMassUg * 10) / 10,
    potentialReductionPercent,
    naqiCategory: naqiInfo.category,
    healthRiskTier,
    vulnerabilityAlert: hasVulnerable && profile.currentAqi > 150,
    recommendedInterventions: recommendations,
    uncertaintyRating: 'Configurable Estimate',
    dataProvenance:
      'Modeled via Open-Meteo ambient estimates, EPA minute ventilation rates, and indoor single-zone mass balance.',
  };
}

/**
 * Evaluates a counterfactual "What-If" scenario by comparing the baseline exposure against modified parameters.
 *
 * Quantifies delta in daily inhaled PM2.5 mass (µg) and exposure dose (µg·h/m³) attributable to
 * specific interventions (e.g. switching to N95 respirator, running indoor air filtration, or shifting commute).
 *
 * @param currentProfile Baseline exposure profile with current habits and mitigations
 * @param overrides Partial overrides representing proposed behavioral or protective interventions
 * @returns Scenario comparison including avoided inhaled mass (µg), percentage reduction, and physical assumptions
 */
export function evaluateWhatIf(
  currentProfile: ExposureProfile,
  overrides: Partial<ExposureProfile>
): WhatIfScenarioResult {
  const currentResult = calculateDailyExposure(currentProfile);
  const hypotheticalProfile: ExposureProfile = {
    ...currentProfile,
    ...overrides,
  };
  const hypotheticalResult = calculateDailyExposure(hypotheticalProfile);

  const originalMass = currentResult.totalInhaledMassUg;
  const newMass = hypotheticalResult.totalInhaledMassUg;
  const avoidedMass = Math.round((originalMass - newMass) * 10) / 10;
  const doseReductionPercent =
    originalMass > 0
      ? Math.round(((originalMass - newMass) / originalMass) * 100)
      : 0;

  const assumptions: string[] = [
    `Breathing rate: ${BREATHING_RATES.moderate_commute} m³/h for active commute, ${BREATHING_RATES.sedentary_indoor} m³/h indoor sedentary`,
    hypotheticalProfile.maskType === 'n95_kn95'
      ? 'Assumes typical snug-fitting N95 respirator (accounting for typical 15–20% face seal leakage)'
      : 'Cloth / surgical mask offers partial 20–30% filtration',
    hypotheticalProfile.hasPurifier
      ? 'Indoor purifier assumes standard ~250 m³/h CADR in closed room'
      : 'Natural infiltration without mechanical air filtration',
  ];

  let verdict = '';
  if (doseReductionPercent > 40) {
    verdict = `Substantial reduction: reduces estimated daily inhaled PM2.5 mass by ~${doseReductionPercent}% (approx ${Math.abs(avoidedMass)} µg avoided).`;
  } else if (doseReductionPercent > 15) {
    verdict = `Moderate reduction: lowers estimated inhaled PM2.5 mass by ~${doseReductionPercent}% (~${Math.abs(avoidedMass)} µg avoided).`;
  } else if (doseReductionPercent > 0) {
    verdict = `Minor reduction: lowers estimated intake by ~${doseReductionPercent}%.`;
  } else if (doseReductionPercent < 0) {
    verdict = `Warning: Increases estimated inhaled particulate intake by ~${Math.abs(doseReductionPercent)}%.`;
  } else {
    verdict = 'No measurable change in estimated intake under current parameters.';
  }

  return {
    originalDose: currentResult.baselineDose,
    newDose: hypotheticalResult.baselineDose,
    doseDifference: Math.round((currentResult.baselineDose - hypotheticalResult.baselineDose) * 10) / 10,
    doseReductionPercent,
    originalMassUg: originalMass,
    newMassUg: newMass,
    avoidedMassUg: avoidedMass,
    verdict,
    assumptions,
  };
}
