import { z } from 'zod';
import {
  PARTICLE_PENETRATION_EFFICIENCY,
  SURFACE_DEPOSITION_RATE_PER_H,
  BREATHING_RATES,
} from '../exposure/engine';
import { UG_PER_BUDGET_POINT } from '../exposure/breathBudget';

export const roomAuditRequestSchema = z.object({
  image: z.string().min(1, 'Image data is required'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp'], {
    message: 'Only JPEG, PNG, and WebP images are supported.',
  }),
  outdoorPm25: z.number().min(0).max(1000).optional(),
});

export type RoomAuditRequest = z.infer<typeof roomAuditRequestSchema>;

export const roomAuditVisionSchema = z.object({
  roomType: z.string().default('Living / Bedroom'),
  windowGaps: z.enum(['sealed', 'minor_gaps', 'open_drafty']).default('minor_gaps'),
  cookingSource: z.enum(['lpg_electric', 'kerosene_biomass', 'chulha_wood', 'none_visible']).default('none_visible'),
  ventilationType: z.enum(['sealed_windows', 'open_windows', 'exhaust_chimney']).default('sealed_windows'),
  visibleDustSources: z.enum(['minimal', 'moderate', 'heavy_incense_dust']).default('moderate'),
  observations: z.array(z.string()).default([]),
});

export type RoomAuditVisionOutput = z.infer<typeof roomAuditVisionSchema>;

export interface RankedAuditFix {
  rank: number;
  title: string;
  category: 'Envelope Sealing' | 'Filtration' | 'Source Control' | 'Behavioral';
  description: string;
  mitigatedConcentrationUgM3: number;
  massAvoidedDailyUg: number;
  budgetPointsSaved: number;
  difficulty: 'Quick DIY (< 15 mins)' | 'Hardware Fix (Moderate)' | 'Routine Habit';
}

export interface RoomAuditResult {
  roomType: string;
  windowGaps: 'sealed' | 'minor_gaps' | 'open_drafty';
  cookingSource: 'lpg_electric' | 'kerosene_biomass' | 'chulha_wood' | 'none_visible';
  ventilationType: 'sealed_windows' | 'open_windows' | 'exhaust_chimney';
  visibleDustSources: 'minimal' | 'moderate' | 'heavy_incense_dust';
  aerEstimated: number; // h⁻¹
  indoorSourceSEstimated: number; // µg/h
  estimatedBaselineIndoorPm25: number; // µg/m³
  observations: string[];
  rankedFixes: RankedAuditFix[];
  summary: string;
  source: 'gemini_vision_audit' | 'rule_based_fallback';
}

/**
 * Maps vision observation categories to physical Air Exchange Rates (AER in h⁻¹)
 */
export function mapWindowGapsToAer(windowGaps: 'sealed' | 'minor_gaps' | 'open_drafty'): number {
  switch (windowGaps) {
    case 'sealed':
      return 0.35; // Weatherstripped, low infiltration
    case 'minor_gaps':
      return 0.70; // Typical unsealed sliding aluminum / wooden frame
    case 'open_drafty':
      return 1.80; // Drafty gaps, open louvers, high outdoor smog penetration
    default:
      return 0.70;
  }
}

/**
 * Maps cooking and visual particulate sources to internal generation rate (S in µg/h)
 */
export function mapSourcesToIndoorGeneration(
  cookingSource: 'lpg_electric' | 'kerosene_biomass' | 'chulha_wood' | 'none_visible',
  visibleDustSources: 'minimal' | 'moderate' | 'heavy_incense_dust'
): number {
  let baseS = 100; // baseline occupant resuspension / skin flakes
  switch (cookingSource) {
    case 'lpg_electric':
      baseS += 250;
      break;
    case 'kerosene_biomass':
      baseS += 2500;
      break;
    case 'chulha_wood':
      baseS += 7500;
      break;
    case 'none_visible':
      break;
  }

  if (visibleDustSources === 'heavy_incense_dust') {
    baseS += 600; // burning agarbatti / dhoop / street dust
  } else if (visibleDustSources === 'moderate') {
    baseS += 200;
  }

  return baseS;
}

/**
 * Calculates mass-balance steady-state indoor PM2.5:
 * C_in = (P * AER * C_out + S / V) / (AER + k_dep + CADR / V)
 */
export function computeSteadyStateIndoorPm25(
  cOut: number,
  aer: number,
  sUgPerHour: number,
  cadrM3PerHr = 0,
  roomVolumeM3 = 45 // 16 m² * 2.8 m
): number {
  const p = PARTICLE_PENETRATION_EFFICIENCY; // 0.80
  const kDep = SURFACE_DEPOSITION_RATE_PER_H; // 0.20
  const cleanRate = cadrM3PerHr / roomVolumeM3;

  const totalRemoval = aer + kDep + cleanRate;
  const numerator = p * aer * Math.max(0, cOut) + sUgPerHour / roomVolumeM3;
  return Math.max(1, numerator / totalRemoval);
}

/**
 * Evaluates ranked mitigation interventions converted to Breath Budget points
 */
export function computeRankedFixes(
  cOut: number,
  currentAer: number,
  currentS: number,
  roomVolumeM3 = 45,
  indoorHours = 20
): RankedAuditFix[] {
  const sedentaryRate = BREATHING_RATES.sedentary_indoor; // 0.60 m³/h
  const baseCin = computeSteadyStateIndoorPm25(cOut, currentAer, currentS, 0, roomVolumeM3);

  const candidateFixes: Array<Omit<RankedAuditFix, 'rank'>> = [];

  // Fix 1: Envelope Weatherstripping (if AER > 0.35)
  if (currentAer > 0.40) {
    const sealedAer = 0.35;
    const cinSealed = computeSteadyStateIndoorPm25(cOut, sealedAer, currentS, 0, roomVolumeM3);
    const massAvoided = Math.max(0, (baseCin - cinSealed) * sedentaryRate * indoorHours);
    const ptsSaved = Math.round(massAvoided / UG_PER_BUDGET_POINT);

    candidateFixes.push({
      title: 'Seal Window Gaps with Foam Weatherstripping Tape',
      category: 'Envelope Sealing',
      description: `Infiltrating outdoor smog is elevated by frame gaps (AER ${currentAer} h⁻¹). Applying ₹150 foam tape or silicone door sweeps cuts infiltration down to ~0.35 h⁻¹.`,
      mitigatedConcentrationUgM3: Math.round(cinSealed * 10) / 10,
      massAvoidedDailyUg: Math.round(massAvoided * 10) / 10,
      budgetPointsSaved: ptsSaved,
      difficulty: 'Quick DIY (< 15 mins)',
    });
  }

  // Fix 2: Add HEPA Air Filtration (CADR 250 m³/h)
  {
    const cinHepa = computeSteadyStateIndoorPm25(cOut, currentAer, currentS, 250, roomVolumeM3);
    const massAvoided = Math.max(0, (baseCin - cinHepa) * sedentaryRate * indoorHours);
    const ptsSaved = Math.round(massAvoided / UG_PER_BUDGET_POINT);

    candidateFixes.push({
      title: 'Deploy Clean-Room HEPA / DIY Box-Fan Air Purifier',
      category: 'Filtration',
      description: 'Continuous mechanical filtration (CADR 250 m³/h) rapidly scrubs fine particulate, lowering room concentration below ambient smog.',
      mitigatedConcentrationUgM3: Math.round(cinHepa * 10) / 10,
      massAvoidedDailyUg: Math.round(massAvoided * 10) / 10,
      budgetPointsSaved: ptsSaved,
      difficulty: 'Hardware Fix (Moderate)',
    });
  }

  // Fix 3: Eliminate Indoor Combustion Sources (if S > 200)
  if (currentS > 200) {
    const controlledS = 100;
    const cinControlled = computeSteadyStateIndoorPm25(cOut, currentAer, controlledS, 0, roomVolumeM3);
    const massAvoided = Math.max(0, (baseCin - cinControlled) * sedentaryRate * indoorHours);
    const ptsSaved = Math.round(massAvoided / UG_PER_BUDGET_POINT);

    candidateFixes.push({
      title: 'Eliminate Incense / Dhoop & Vent Cooking Emissions',
      category: 'Source Control',
      description: 'Internal particulate generation (incense sticks, unvented frying, biomass) generates localized spikes. Extinguish combustion sources and use exhaust.',
      mitigatedConcentrationUgM3: Math.round(cinControlled * 10) / 10,
      massAvoidedDailyUg: Math.round(massAvoided * 10) / 10,
      budgetPointsSaved: ptsSaved,
      difficulty: 'Routine Habit',
    });
  }

  // Fix 4: Afternoon Ventilation Protocol
  {
    // During afternoon window, outdoor PM2.5 drops by ~50%
    const afternoonCout = cOut * 0.5;
    const cinAfternoon = computeSteadyStateIndoorPm25(afternoonCout, currentAer, currentS, 0, roomVolumeM3);
    const massAvoided = Math.max(0, (baseCin - cinAfternoon) * sedentaryRate * 4); // 4 hrs of clean air
    const ptsSaved = Math.round(massAvoided / UG_PER_BUDGET_POINT);

    candidateFixes.push({
      title: 'Timed Afternoon Inversion Flush Protocol',
      category: 'Behavioral',
      description: 'Strictly keep windows shut during morning and night temperature inversions. Open only during peak 1–3 PM solar boundary layer warming.',
      mitigatedConcentrationUgM3: Math.round(cinAfternoon * 10) / 10,
      massAvoidedDailyUg: Math.round(massAvoided * 10) / 10,
      budgetPointsSaved: Math.max(1, ptsSaved),
      difficulty: 'Routine Habit',
    });
  }

  // Sort by budget points saved descending and assign rank
  return candidateFixes
    .sort((a, b) => b.budgetPointsSaved - a.budgetPointsSaved)
    .map((fix, idx) => ({ ...fix, rank: idx + 1 }));
}

/**
 * Builds the complete RoomAuditResult from vision or fallback parameters
 */
export function buildRoomAuditResult(
  vision: RoomAuditVisionOutput,
  outdoorPm25 = 180,
  source: 'gemini_vision_audit' | 'rule_based_fallback' = 'gemini_vision_audit'
): RoomAuditResult {
  const aer = mapWindowGapsToAer(vision.windowGaps);
  const s = mapSourcesToIndoorGeneration(vision.cookingSource, vision.visibleDustSources);
  const baselineIndoorPm25 = computeSteadyStateIndoorPm25(outdoorPm25, aer, s);
  const rankedFixes = computeRankedFixes(outdoorPm25, aer, s);

  const topFix = rankedFixes[0];
  const summary = `Physical room audit identified an estimated Air Exchange Rate of ${aer} h⁻¹ and indoor generation of ~${s} µg/h. Indoor baseline concentration is modeled at ~${Math.round(baselineIndoorPm25)} µg/m³. Your #1 priority fix (${topFix.title}) can save ~${topFix.budgetPointsSaved} daily Breath Budget points.`;

  return {
    roomType: vision.roomType,
    windowGaps: vision.windowGaps,
    cookingSource: vision.cookingSource,
    ventilationType: vision.ventilationType,
    visibleDustSources: vision.visibleDustSources,
    aerEstimated: aer,
    indoorSourceSEstimated: s,
    estimatedBaselineIndoorPm25: Math.round(baselineIndoorPm25 * 10) / 10,
    observations: vision.observations.length > 0
      ? vision.observations
      : [
          `Window perimeter exhibits ${vision.windowGaps === 'sealed' ? 'tight weatherstripping' : 'ambient draft gaps'}.`,
          `Indoor emission profile categorized as ${vision.cookingSource.replace('_', ' ')}.`,
          `Ambient particulate settling level observed as ${vision.visibleDustSources.replace('_', ' ')}.`,
        ],
    rankedFixes,
    summary,
    source,
  };
}
