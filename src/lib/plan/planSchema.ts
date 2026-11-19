import { z } from 'zod';
import { ExposureResult } from '../exposure/engine';
import { HouseholdProfile } from '../validation/profileSchema';
import { OutdoorWindow } from '../api/openMeteo';

export const routineItemSchema = z.object({
  title: z.string(),
  action: z.string(),
  estimatedExposureReduction: z.string(),
  timeOfDay: z.string(),
  rationale: z.string(),
});

export const indoorHackSchema = z.object({
  title: z.string(),
  instructions: z.string(),
  estimatedExposureReduction: z.string(),
  mythCheck: z.string(),
});

export const sensitiveGuidanceSchema = z.object({
  alertLevel: z.string(),
  advice: z.string(),
  vulnerableGroupsCovered: z.array(z.string()),
});

export const planResponseSchema = z.object({
  headline: z.string(),
  executiveSummary: z.string(),
  dailyBriefing: z.string().optional(),
  recommendedActivitySchedule: z.array(z.string()).optional(),
  lowEmissionRoutine: z.array(routineItemSchema),
  indoorAirHacks: z.array(indoorHackSchema),
  sensitiveGroupGuidance: sensitiveGuidanceSchema,
  communityAction: z.string(),
  disclaimer: z.string(),
  dataProvenanceNote: z.string().optional(),
});

export type PlanResponse = z.infer<typeof planResponseSchema>;

export interface GenerateFallbackParams {
  cityName: string;
  profile: HouseholdProfile;
  exposure: ExposureResult;
  bestWindow: OutdoorWindow;
  worstWindow: OutdoorWindow;
  noSafeWindowAvailable?: boolean;
  alertHeadline?: string;
}

/**
 * Deterministic rule-based fallback plan generator.
 * Operates offline or whenever the Gemini API is unreachable or rate-limited.
 */
export function generateFallbackPlan(params: GenerateFallbackParams): PlanResponse {
  const { cityName, profile, exposure, bestWindow, worstWindow, noSafeWindowAvailable } = params;
  const isHighSmog = exposure.baselineDose > 150 || exposure.naqiCategory === 'Very Poor' || exposure.naqiCategory === 'Severe';
  const hasKids = profile.numKids > 0;
  const hasElderly = profile.numElderly > 0;

  const lowEmissionRoutine = [
    {
      title: 'Reschedule Commute & Outdoor Tasks',
      action: noSafeWindowAvailable
        ? `No safe window exists today (all hours >200 AQI). Minimize outdoor travel; if mandatory, step out between ${bestWindow.startTime.substring(11, 16)} and ${bestWindow.endTime.substring(11, 16)}.`
        : `Shift outdoor errands to ${bestWindow.startTime.substring(11, 16)} – ${bestWindow.endTime.substring(11, 16)} (lowest AQI ~${bestWindow.averageAqi}). Strictly avoid ${worstWindow.startTime.substring(11, 16)} – ${worstWindow.endTime.substring(11, 16)}.`,
      estimatedExposureReduction: `Reduces estimated inhaled outdoor particle intake by ~${Math.round(exposure.potentialReductionPercent * 0.45)}%`,
      timeOfDay: 'Midday solar convective mixing',
      rationale: 'Thermal inversions trap ground-level vehicular exhaust in early morning and night; solar heating creates convective vertical mixing.',
    },
    {
      title: 'Commute Mode & Barrier Protection',
      action: profile.commuteType === 'two_wheeler' || profile.commuteType === 'walk'
        ? 'Wear a certified, snug-fitting N95/FFP2 respirator. If possible, transition trips to metro transit with closed air filtration.'
        : 'Keep vehicle windows rolled up and cabin ventilation locked to "Recirculation Mode" with AC filter.',
      estimatedExposureReduction: profile.maskType !== 'n95_kn95' ? 'Cuts outdoor inhaled particulate intake by ~75–85%' : 'Maintains ~80–90% real-world barrier filtration',
      timeOfDay: 'Commute hours',
      rationale: 'Roadway vehicle tailpipes produce concentrated ultrafine PM2.5 that penetrate ordinary cloth and surgical coverings.',
    },
    {
      title: 'Zero Waste Burning & Clean Kitchen Exhaust',
      action: 'Strictly prohibit burning leaves, plastic, or domestic waste. Run kitchen exhaust chimney during all cooking and use tight pot lids.',
      estimatedExposureReduction: 'Prevents localized indoor PM2.5 spikes of +40 to +70 µg/m³',
      timeOfDay: 'Cooking / Evening',
      rationale: 'Solid fuel combustion and unvented kitchen smoke accumulate rapidly inside winter residences.',
    },
  ];

  const indoorAirHacks = [
    {
      title: 'The Clean-Room Sanctuary Approach',
      instructions: 'Designate the primary bedroom as a sealed clean zone. Keep doors and windows weatherstripped with damp cloth draft-stoppers at door bottoms.',
      estimatedExposureReduction: 'Lowers room particle infiltration rate by ~30–45%',
      mythCheck: 'Myth: Indoor plants substantially purify winter PM2.5 smog. Fact: Houseplants oxygenate but do not remove fine suspended aerosols; mechanical filtration is required.',
    },
    {
      title: profile.hasPurifier ? 'Optimize Purifier Placement' : 'Affordable DIY Box-Fan Filter (Corsi-Rosenthal Method)',
      instructions: profile.hasPurifier
        ? 'Elevate your air purifier 1–2 feet above the floor and place it away from walls, running continuously on medium/high speed.'
        : 'Secure a 20×20 inch MERV 13 (or HEPA equivalent) furnace filter to the intake face of an ordinary box fan using duct tape.',
      estimatedExposureReduction: 'Cuts indoor airborne PM2.5 concentrations by ~70–75%',
      mythCheck: 'Myth: Placing wet towels around the room traps smog. Fact: Wet towels increase humidity without capturing microscopic PM2.5 particles.',
    },
    {
      title: 'Strategic Afternoon Air Flush',
      instructions: noSafeWindowAvailable
        ? 'Keep windows sealed throughout the day. Only crack windows for 5 minutes if indoor CO2 becomes stale, then reseal immediately.'
        : `Open windows for only 15–20 minutes between ${bestWindow.startTime.substring(11, 16)} and ${bestWindow.endTime.substring(11, 16)} when outdoor AQI is lowest, then reseal.`,
      estimatedExposureReduction: 'Flushes indoor CO2 without letting heavy nocturnal smog settle indoors',
      mythCheck: 'Myth: Leaving windows cracked all morning provides fresh air. Fact: Morning winter air contains peak ground-level pollutants.',
    },
  ];

  const sensitiveGroups: string[] = [];
  if (hasKids) sensitiveGroups.push(`${profile.numKids} Child(ren)`);
  if (hasElderly) sensitiveGroups.push(`${profile.numElderly} Senior Citizen(s)`);
  if (sensitiveGroups.length === 0) sensitiveGroups.push('General Population');

  return {
    headline: `Actionable Smog Resilience Protocol for ${cityName}`,
    executiveSummary: `Targeted defense for your household under current ${exposure.naqiCategory} air quality (Estimated Inhaled Intake: ~${exposure.totalInhaledMassUg} µg PM2.5/day). Focus on afternoon errand windows, tight window sealing, and certified respiratory protection.`,
    dailyBriefing: `Ambient air quality is currently ${exposure.naqiCategory}. Estimated unmitigated inhaled PM2.5 burden is ${exposure.totalInhaledMassUg} µg/day. Implementing the recommended routine can avoid an estimated ${exposure.avoidedInhaledMassUg} µg of particulate intake (~${exposure.potentialReductionPercent}% reduction).`,
    recommendedActivitySchedule: [
      `06:00 AM – 09:30 AM: Peak smog trap. Keep doors/windows sealed. Cancel morning jogging and outdoor school sports.`,
      `01:00 PM – 03:00 PM: Cleanest available window (~${bestWindow.averageAqi} AQI). Conduct mandatory grocery runs and brief 15-min air flush.`,
      `07:00 PM – 11:00 PM: Evening traffic smog trap. Run bedroom HEPA air purifier in closed clean room.`,
    ],
    lowEmissionRoutine,
    indoorAirHacks,
    sensitiveGroupGuidance: {
      alertLevel: isHighSmog ? 'High Vigilance Protocol' : 'Standard Smog Precautions',
      advice: isHighSmog
        ? 'Vulnerable members (children and elderly) should remain indoors in sealed clean rooms. Halt all outdoor strenuous play.'
        : 'Moderate activities permitted during afternoon hours. Wear protective masks near busy roadway corridors.',
      vulnerableGroupsCovered: sensitiveGroups,
    },
    communityAction:
      'Urge your Resident Welfare Association (RWA) or society committee to provide electric room heaters to night security guards to eliminate open wood/garbage burning fires.',
    disclaimer:
      'Shwaas provides decision-support exposure models; this is not medical advice. Consult healthcare providers for personal respiratory symptoms.',
    dataProvenanceNote:
      'Modeled via Open-Meteo atmospheric chemistry estimates and deterministic EPA inhalation rate equations.',
  };
}
