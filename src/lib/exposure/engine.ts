import { NaqiCategory, getNaqiCategory } from '../aqi/naqi';

export type CommuteType =
  | 'walk'
  | 'bicycle'
  | 'two_wheeler'
  | 'car_open'
  | 'car_ac'
  | 'metro_bus_transit';

export type MaskType = 'none' | 'cloth_surgical' | 'n95_kn95';

export type CookingFuel = 'lpg_electric' | 'biomass_kerosene' | 'wood';

export type VentilationStrategy =
  | 'windows_open'
  | 'sealed_windows'
  | 'timed_afternoon';

export interface ExposureProfile {
  currentAqi: number;
  pm25Concentration: number; // in µg/m³
  timeOutdoorsHours: number; // e.g. 0 to 24
  commuteType: CommuteType;
  maskType: MaskType;
  indoorHours: number; // e.g. 24 - timeOutdoorsHours
  hasPurifier: boolean;
  cookingFuel: CookingFuel;
  ventilationStrategy: VentilationStrategy;
  vulnerableMembers: {
    hasKids: boolean;
    hasElderly: boolean;
  };
}

// Infiltration ratio based on window sealing & timing
export const INFILTRATION_FACTORS: Record<VentilationStrategy, number> = {
  windows_open: 0.85,
  sealed_windows: 0.55,
  timed_afternoon: 0.65,
};

// Mask penetration factor (1 - filtration efficiency)
export const MASK_PENETRATION_FACTORS: Record<MaskType, number> = {
  none: 1.0, // 0% filtration
  cloth_surgical: 0.70, // ~30% effective filtration due to edge seal leakage
  n95_kn95: 0.08, // ~92% effective protection with tight seal
};

// Commute proximity and inhalation rate multiplier
export const COMMUTE_FACTORS: Record<CommuteType, number> = {
  walk: 1.35, // High minute ventilation rate (~25 L/min)
  bicycle: 1.50, // Strenuous aerobic respiration rate
  two_wheeler: 1.40, // Direct tailpipe exposure & wake turbulence
  car_open: 1.10, // Traffic corridor proximity
  car_ac: 0.40, // Closed cabin + AC particulate filter
  metro_bus_transit: 0.50, // Filtered carriage / indoor station concourse
};

// Indoor cooking fuel background increment in µg/m³
export const COOKING_INCREMENTS: Record<CookingFuel, number> = {
  lpg_electric: 5,
  biomass_kerosene: 45,
  wood: 70,
};

// Purifier penetration factor (HEPA or DIY box-fan with MERV 13/HEPA)
export const PURIFIER_PENETRATION = 0.25; // 75% indoor particle reduction

export interface ExposureResult {
  baselineDose: number; // in µg·h/m³
  outdoorDose: number;
  indoorDose: number;
  indoorConcentration: number; // average estimated indoor µg/m³
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
  optimizedDose: number;
  potentialReductionPercent: number;
  recommendedInterventions: string[];
}

export interface WhatIfScenarioResult {
  originalDose: number;
  newDose: number;
  doseDifference: number;
  doseReductionPercent: number;
  verdict: string;
}

/**
 * Calculates integrated daily inhaled particulate exposure dose (in µg·h/m³)
 * using a microenvironmental time-activity model.
 */
export function calculateDailyExposure(profile: ExposureProfile): ExposureResult {
  const naqiInfo = getNaqiCategory(profile.currentAqi);
  const cOut = Math.max(0, profile.pm25Concentration);

  // 1. Outdoor component
  const maskPen = MASK_PENETRATION_FACTORS[profile.maskType] ?? 1.0;
  const commuteMult = COMMUTE_FACTORS[profile.commuteType] ?? 1.0;
  const outdoorHours = Math.max(0, Math.min(24, profile.timeOutdoorsHours));
  const outdoorDose = outdoorHours * cOut * maskPen * commuteMult;

  // 2. Indoor component
  const indoorHours = Math.max(0, 24 - outdoorHours);
  const infiltration = INFILTRATION_FACTORS[profile.ventilationStrategy] ?? 0.65;
  const purifierFactor = profile.hasPurifier ? PURIFIER_PENETRATION : 1.0;
  const cookingIncrement = COOKING_INCREMENTS[profile.cookingFuel] ?? 5;

  const indoorConcentration = Math.max(
    0,
    cOut * infiltration * purifierFactor + cookingIncrement
  );
  const indoorDose = indoorHours * indoorConcentration;

  const baselineDose = outdoorDose + indoorDose;

  // 3. Health risk tier based on NAQI and vulnerability
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
    // Severe
    healthRiskTier = hasVulnerable ? 'Critical Emergency' : 'Extreme Hazard';
  }

  // 4. Theoretical optimal dose (best reasonable daily routine)
  const optimalOutdoorHours = Math.min(outdoorHours, 1);
  const optimalOutdoorDose =
    optimalOutdoorHours *
    cOut *
    MASK_PENETRATION_FACTORS.n95_kn95 *
    COMMUTE_FACTORS.metro_bus_transit;
  const optimalIndoorConc =
    cOut * INFILTRATION_FACTORS.sealed_windows * PURIFIER_PENETRATION +
    COOKING_INCREMENTS.lpg_electric;
  const optimalIndoorDose = (24 - optimalOutdoorHours) * optimalIndoorConc;
  const optimizedDose = optimalOutdoorDose + optimalIndoorDose;

  const potentialReductionPercent =
    baselineDose > 0
      ? Math.max(0, Math.min(95, Math.round(((baselineDose - optimizedDose) / baselineDose) * 100)))
      : 0;

  const recommendations: string[] = [];
  if (profile.maskType !== 'n95_kn95' && profile.currentAqi > 100) {
    recommendations.push('Upgrade to a certified, snug-fitting N95/FFP2 respirator for all outdoor steps.');
  }
  if (!profile.hasPurifier && profile.currentAqi > 150) {
    recommendations.push('Deploy a clean-room sanctuary with a HEPA purifier or a low-cost DIY box-fan with MERV 13 filter.');
  }
  if (profile.ventilationStrategy === 'windows_open' && profile.currentAqi > 100) {
    recommendations.push('Seal windows and switch to timed ventilation only during peak afternoon dispersion (1 PM – 3 PM).');
  }
  if (profile.commuteType === 'two_wheeler' || profile.commuteType === 'walk') {
    recommendations.push('Transition high-smog commutes to closed metro or AC transit to avoid direct roadway particulate.');
  }

  return {
    baselineDose: Math.round(baselineDose * 10) / 10,
    outdoorDose: Math.round(outdoorDose * 10) / 10,
    indoorDose: Math.round(indoorDose * 10) / 10,
    indoorConcentration: Math.round(indoorConcentration * 10) / 10,
    naqiCategory: naqiInfo.category,
    healthRiskTier,
    vulnerabilityAlert: hasVulnerable && profile.currentAqi > 150,
    optimizedDose: Math.round(optimizedDose * 10) / 10,
    potentialReductionPercent,
    recommendedInterventions: recommendations,
  };
}

/**
 * Live what-if evaluation: compares current profile with user-modified parameters.
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

  const originalDose = currentResult.baselineDose;
  const newDose = hypotheticalResult.baselineDose;
  const doseDifference = Math.round((originalDose - newDose) * 10) / 10;
  const doseReductionPercent =
    originalDose > 0
      ? Math.round(((originalDose - newDose) / originalDose) * 100)
      : 0;

  let verdict = '';
  if (doseReductionPercent > 40) {
    verdict = `Major protection gain: eliminates ~${doseReductionPercent}% of your daily inhaled pollutant dose.`;
  } else if (doseReductionPercent > 15) {
    verdict = `Substantial reduction: lowers daily exposure dose by ~${doseReductionPercent}%.`;
  } else if (doseReductionPercent > 0) {
    verdict = `Moderate reduction: lowers daily exposure by ~${doseReductionPercent}%.`;
  } else if (doseReductionPercent < 0) {
    verdict = `Warning: Increases exposure dose by ~${Math.abs(doseReductionPercent)}%.`;
  } else {
    verdict = 'No measurable change in estimated exposure.';
  }

  return {
    originalDose,
    newDose,
    doseDifference,
    doseReductionPercent,
    verdict,
  };
}
