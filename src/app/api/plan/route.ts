import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { householdProfileSchema } from '@/lib/validation/profileSchema';
import { calculateDailyExposure, householdProfileToExposureProfile } from '@/lib/exposure/engine';
import { planResponseSchema, generateFallbackPlan } from '@/lib/plan/planSchema';
import { OutdoorWindow } from '@/lib/api/openMeteo';
import {
  parseGuardedJsonRequest,
  hasConfiguredGeminiKey,
  callGeminiWithTimeout,
  logSanitizedGeminiError,
} from '@/lib/api/routeGuards';

// Server-side request payload schema
const planRequestSchema = z.object({
  profile: householdProfileSchema,
  aqi: z.number().min(0).max(500),
  pm25: z.number().min(0),
  cityName: z.string().min(1).max(100),
  bestWindow: z.object({
    startTime: z.string().max(40),
    endTime: z.string().max(40),
    averageAqi: z.number(),
    averagePm25: z.number().optional(),
    category: z.enum(['Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe']),
    advisory: z.string().max(300),
    reasoning: z.array(z.string().max(300)).optional(),
    isSafe: z.boolean().optional(),
  }),
  worstWindow: z.object({
    startTime: z.string().max(40),
    endTime: z.string().max(40),
    averageAqi: z.number(),
    averagePm25: z.number().optional(),
    category: z.enum(['Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe']),
    advisory: z.string().max(300),
  }),
  noSafeWindowAvailable: z.boolean().optional(),
  language: z.enum(['en', 'hi', 'kn']).default('en'),
});

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const guarded = await parseGuardedJsonRequest(req, planRequestSchema, {
    maxBytes: 65536,
    payloadTooLargeMessage: 'Payload too large (max 64KB).',
    rateLimit: {
      limit: 15,
      windowMs: 60 * 1000,
      message: 'Too many plan requests. Please wait a moment before recalculating.',
    },
    malformedJsonMessage: 'Invalid JSON request body.',
  });

  if (!guarded.ok) {
    return guarded.response;
  }

  const { profile, aqi, pm25, cityName, bestWindow, worstWindow, noSafeWindowAvailable, language = 'en' } = guarded.data;

  // Sanitize cityName to prevent prompt injection vectors
  const sanitizedCityName =
    cityName
      .replace(/[^\w\s,.-]/gi, '')
      .trim()
      .slice(0, 80) || 'Selected Location';

  // Compute Deterministic Scientific Exposure Output
  const exposure = calculateDailyExposure(householdProfileToExposureProfile(profile, aqi, pm25));

  const apiKey = process.env.GEMINI_API_KEY;

  const normalizedBestWindow: OutdoorWindow = {
    ...bestWindow,
    averagePm25: bestWindow.averagePm25 ?? Math.round(pm25 * 0.8),
    reasoning: bestWindow.reasoning ?? [bestWindow.advisory],
    isSafe: bestWindow.isSafe ?? (bestWindow.averageAqi <= 100),
  };
  const normalizedWorstWindow: OutdoorWindow = {
    ...worstWindow,
    averagePm25: worstWindow.averagePm25 ?? Math.round(pm25 * 1.3),
    reasoning: [worstWindow.advisory],
    isSafe: false,
  };

  const createFallbackResponse = () => {
    const fallbackPlan = generateFallbackPlan({
      cityName: sanitizedCityName,
      profile,
      exposure,
      bestWindow: normalizedBestWindow,
      worstWindow: normalizedWorstWindow,
      noSafeWindowAvailable,
      language,
    });
    return NextResponse.json({
      plan: fallbackPlan,
      exposure,
      source: 'deterministic_engine_fallback',
    });
  };

  if (!hasConfiguredGeminiKey(apiKey)) {
    return createFallbackResponse();
  }

  try {
    const languageInstruction =
      language === 'hi'
        ? 'LANGUAGE REQUIREMENT: Write all text fields (headline, executiveSummary, dailyBriefing, recommendedActivitySchedule, title, action, rationale, instructions, mythCheck, advice, communityAction, disclaimer) in natural, idiomatic HINDI using Devanagari script (हिन्दी).'
        : language === 'kn'
        ? 'LANGUAGE REQUIREMENT: Write all text fields (headline, executiveSummary, dailyBriefing, recommendedActivitySchedule, title, action, rationale, instructions, mythCheck, advice, communityAction, disclaimer) in natural, idiomatic KANNADA using Kannada script (ಕನ್ನಡ).'
        : 'LANGUAGE REQUIREMENT: Write all text fields in clear, actionable ENGLISH.';

    const prompt = `You are Shwaas (श्वास — हर सांस का हिसाब), an urban air quality assistant helping families navigate severe winter smog.

${languageInstruction}

CRITICAL ANTI-HALLUCINATION INSTRUCTIONS:
- You must NOT invent, guess, or fabricate any numerical metrics, AQI values, or percentages.
- All exposure metrics, sub-indices, and percentage reductions are pre-computed by our deterministic engine below.
- Explain the direct impact of each choice using ONLY the deterministic figures provided.
- Do NOT claim that N95 provides 100% protection (account for real-world face-seal leakage ~15-20%).
- Do NOT claim that a purifier "refunds" already inhaled pollution; it lowers future indoor exposure.
- If noSafeWindowAvailable is true, do NOT pretend a safe window exists; explicitly recommend postponing outdoor activity.
- Output MUST strictly be valid JSON conforming to the requested schema.

DETERMINISTIC ENGINE DATA:
- City: ${sanitizedCityName}
- Current CPCB NAQI: ${aqi} (${exposure.naqiCategory})
- Ambient PM2.5: ${pm25} µg/m³
- Total Daily Inhaled PM2.5 Mass Intake: ~${exposure.totalInhaledMassUg} µg/day
  - Outdoor Intake: ~${exposure.outdoorInhaledMassUg} µg (over ${profile.outdoorHours} hrs)
  - Indoor Intake: ~${exposure.indoorInhaledMassUg} µg (estimated room concentration: ${exposure.indoorConcentration} µg/m³)
- Optimized Protocol Potential: Inhaled mass drops to ~${exposure.optimizedInhaledMassUg} µg/day (avoids ~${exposure.avoidedInhaledMassUg} µg, ~${exposure.potentialReductionPercent}% reduction)
- Health Risk Tier: ${exposure.healthRiskTier}
- Best Outdoor Activity Window: ${bestWindow.startTime} to ${bestWindow.endTime} (Avg AQI: ${bestWindow.averageAqi}, ${bestWindow.category}, Safe: ${bestWindow.isSafe ?? false})
- Peak Smog Inversion Window: ${worstWindow.startTime} to ${worstWindow.endTime} (Avg AQI: ${worstWindow.averageAqi}, ${worstWindow.category})
- No Safe Window Flag: ${noSafeWindowAvailable ? 'YES - All 24 hours remain heavily polluted' : 'NO - Clean window available'}
- Household Demographics:
  - Children: ${profile.numKids}
  - Elderly: ${profile.numElderly}
  - Commute Mode: ${profile.commuteType}
  - Cooking Fuel: ${profile.cookingFuel}
  - Air Purifier: ${profile.hasPurifier ? 'Equipped' : 'None'}
  - Current Mask: ${profile.maskType}

REQUIRED JSON STRUCTURE:
{
  "headline": string,
  "executiveSummary": string,
  "dailyBriefing": string,
  "recommendedActivitySchedule": string[],
  "lowEmissionRoutine": [
    {
      "title": string,
      "action": string,
      "estimatedExposureReduction": string,
      "timeOfDay": string,
      "rationale": string
    }
  ],
  "indoorAirHacks": [
    {
      "title": string,
      "instructions": string,
      "estimatedExposureReduction": string,
      "mythCheck": string
    }
  ],
  "sensitiveGroupGuidance": {
    "alertLevel": string,
    "advice": string,
    "vulnerableGroupsCovered": string[]
  },
  "communityAction": string,
  "disclaimer": string
}`;

    const response = await callGeminiWithTimeout(apiKey, (ai, model) =>
      ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      })
    );

    const responseText = response.text?.trim() || '';
    const parsedJson = JSON.parse(responseText);

    const validation = planResponseSchema.safeParse(parsedJson);
    if (!validation.success) {
      console.warn('Gemini response failed JSON schema validation, falling back:', validation.error);
      return createFallbackResponse();
    }

    return NextResponse.json({
      plan: validation.data,
      exposure,
      source: 'gemini_personalized',
    });
  } catch (error) {
    logSanitizedGeminiError('Gemini plan API call failed', error);
    return createFallbackResponse();
  }
}
