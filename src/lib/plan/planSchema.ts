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
  lowEmissionRoutine: z.array(routineItemSchema),
  indoorAirHacks: z.array(indoorHackSchema),
  sensitiveGroupGuidance: sensitiveGuidanceSchema,
  communityAction: z.string(),
  disclaimer: z.string(),
});

export type PlanResponse = z.infer<typeof planResponseSchema>;

export interface GenerateFallbackParams {
  cityName: string;
  profile: HouseholdProfile;
  exposure: ExposureResult;
  bestWindow: OutdoorWindow;
  worstWindow: OutdoorWindow;
}

/**
 * Deterministic rule-based fallback plan generator.
 * Operates offline or whenever the Gemini API is unreachable or rate-limited.
 */
export function generateFallbackPlan(params: GenerateFallbackParams): PlanResponse {
  const { cityName, profile, exposure, bestWindow, worstWindow } = params;
  const isHighSmog = exposure.baselineDose > 150 || exposure.naqiCategory === 'Very Poor' || exposure.naqiCategory === 'Severe';
  const hasKids = profile.numKids > 0;
  const hasElderly = profile.numElderly > 0;

  const lowEmissionRoutine = [
    {
      title: 'Reschedule Commute & Outdoor Tasks',
      action: `Shift outdoor travel to ${bestWindow.startTime.substring(11, 16)} – ${bestWindow.endTime.substring(11, 16)} (lowest AQI ~${bestWindow.averageAqi}). Strictly avoid ${worstWindow.startTime.substring(11, 16)} – ${worstWindow.endTime.substring(11, 16)}.`,
      estimatedExposureReduction: 'Reduces outdoor inhalation peak by ~35–50%',
      timeOfDay: 'Midday solar mixing',
      rationale: 'Thermal inversions trap ground vehicular exhaust in early morning and late night; afternoon solar convective mixing disperses particulate.',
    },
    {
      title: 'Commute Mode & Barrier Protection',
      action: profile.commuteType === 'two_wheeler' || profile.commuteType === 'walk'
        ? 'Wear a certified, snug-fitting N95/FFP2 respirator. If possible, transition trips to metro or public transit with closed air filtration.'
        : 'Ensure your vehicle ventilation is locked to "Recirculation Mode" with windows rolled up.',
      estimatedExposureReduction: profile.maskType !== 'n95_kn95' ? 'Cuts outdoor inhaled particulate by ~80–92%' : 'Maintains >90% barrier filtration',
      timeOfDay: 'Commute hours',
      rationale: 'Roadway vehicle tailpipes produce concentrated ultrafine PM2.5 that penetrate ordinary cloth coverings.',
    },
    {
      title: 'Zero Waste Burning & Clean Kitchen Exhaust',
      action: 'Do not burn leaves, paper, or domestic waste. Run kitchen exhaust chimney during all cooking and use tight pot lids.',
      estimatedExposureReduction: 'Prevents localized indoor PM2.5 spikes of +40 to +70 µg/m³',
      timeOfDay: 'Cooking / Evening',
      rationale: 'Biomass and unvented kitchen combustion accumulate rapidly inside sealed winter homes.',
    },
  ];

  const indoorAirHacks = [
    {
      title: 'The Clean-Room Sanctuary Approach',
      instructions: 'Designate the primary bedroom as a sealed clean zone. Keep doors and windows weatherstripped with damp cloth drafts at door bottoms.',
      estimatedExposureReduction: 'Lowers room particle infiltration by ~30–45%',
      mythCheck: 'Myth: Indoor plants substantially purify winter PM2.5 smog. Fact: Houseplants oxygenate but do not remove fine suspended aerosols; mechanical filtration is required.',
    },
    {
      title: profile.hasPurifier ? 'Optimize Purifier Placement' : 'Affordable DIY Box-Fan Filter (Corsi-Rosenthal Method)',
      instructions: profile.hasPurifier
        ? 'Elevate your air purifier 1–2 feet above the floor and place it away from walls, running continuously on medium/high speed.'
        : 'Secure a 20×20 inch MERV 13 (or HEPA equivalent) HVAC furnace filter to the intake face of an ordinary box fan using duct tape.',
      estimatedExposureReduction: 'Cuts indoor airborne PM2.5 concentrations by ~70–75%',
      mythCheck: 'Myth: Placing wet towels around the room traps smog. Fact: Wet towels increase humidity without capturing microscopic PM2.5 particles.',
    },
    {
      title: 'Strategic Afternoon Air Flush',
      instructions: `Open windows for only 15–20 minutes between ${bestWindow.startTime.substring(11, 16)} and ${bestWindow.endTime.substring(11, 16)} when outdoor AQI is lowest, then reseal immediately.`,
      estimatedExposureReduction: 'Flushes indoor CO2 without letting heavy night smog settle indoors',
      mythCheck: 'Myth: Leaving windows cracked all morning provides fresh air. Fact: Morning winter air contains peak ground-level pollutants.',
    },
  ];

  const sensitiveGroups: string[] = [];
  if (hasKids) sensitiveGroups.push(`${profile.numKids} Child(ren)`);
  if (hasElderly) sensitiveGroups.push(`${profile.numElderly} Senior Citizen(s)`);
  if (sensitiveGroups.length === 0) sensitiveGroups.push('General Population');

  return {
    headline: `Actionable Smog Resilience Protocol for ${cityName}`,
    executiveSummary: `Targeted defense for your household under current ${exposure.naqiCategory} air quality (AQI ${exposure.baselineDose > 0 ? Math.round(exposure.baselineDose / 24) : 'elevated'}). Focus on afternoon errand windows, tight window sealing, and certified respiratory protection.`,
    lowEmissionRoutine,
    indoorAirHacks,
    sensitiveGroupGuidance: {
      alertLevel: isHighSmog ? 'High Vigilance Protocol' : 'Standard Smog Precautions',
      advice: isHighSmog
        ? 'Vulnerable members (children and elderly) should remain indoors in sealed clean rooms. Cancel outdoor physical exercise and morning walks until AQI drops.'
        : 'Moderate activities permitted during afternoon hours. Wear protective masks near busy traffic arteries.',
      vulnerableGroupsCovered: sensitiveGroups,
    },
    communityAction:
      'Urge your Resident Welfare Association (RWA) or society committee to provide electric heaters to night security guards to eliminate open wood/garbage burning fires.',
    disclaimer:
      'AirWise provides decision-support exposure models; this is not medical advice. Consult healthcare providers for individual clinical conditions.',
  };
}
