import { z } from 'zod';

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

export type PlanSource = 'gemini_personalized' | 'deterministic_engine_fallback';

export { generateFallbackPlan, type GenerateFallbackParams } from './fallbackPlan';
