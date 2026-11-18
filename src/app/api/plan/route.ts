import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { householdProfileSchema } from '@/lib/validation/profileSchema';
import { calculateDailyExposure } from '@/lib/exposure/engine';
import { checkRateLimit } from '@/lib/security/rateLimiter';
import { planResponseSchema, generateFallbackPlan } from '@/lib/plan/planSchema';

// Server-side request payload schema
const planRequestSchema = z.object({
  profile: householdProfileSchema,
  aqi: z.number().min(0).max(500),
  pm25: z.number().min(0),
  cityName: z.string().min(1).max(100),
  bestWindow: z.object({
    startTime: z.string(),
    endTime: z.string(),
    averageAqi: z.number(),
    category: z.enum(['Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe']),
    advisory: z.string(),
  }),
  worstWindow: z.object({
    startTime: z.string(),
    endTime: z.string(),
    averageAqi: z.number(),
    category: z.enum(['Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe']),
    advisory: z.string(),
  }),
});

export async function POST(req: NextRequest) {
  // 1. IP Rate Limiting (15 requests/minute)
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  const rateLimit = checkRateLimit(clientIp, { limit: 15, windowMs: 60 * 1000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Too many plan requests. Please wait a moment before recalculating.',
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfterSeconds),
        },
      }
    );
  }

  // 2. Validate Request Body with Zod
  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const parseResult = planRequestSchema.safeParse(bodyJson);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Input validation failed', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { profile, aqi, pm25, cityName, bestWindow, worstWindow } = parseResult.data;

  // 3. Compute Deterministic Scientific Exposure Output
  const exposure = calculateDailyExposure({
    ...profile,
    currentAqi: aqi,
    pm25Concentration: pm25,
    timeOutdoorsHours: profile.outdoorHours,
    indoorHours: Math.max(0, 24 - profile.outdoorHours),
    vulnerableMembers: {
      hasKids: profile.numKids > 0,
      hasElderly: profile.numElderly > 0,
    },
  });

  const apiKey = process.env.GEMINI_API_KEY;

  // 4. Fallback if no API key is configured
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    const fallbackPlan = generateFallbackPlan({
      cityName,
      profile,
      exposure,
      bestWindow,
      worstWindow,
    });
    return NextResponse.json({
      plan: fallbackPlan,
      exposure,
      source: 'deterministic_engine_fallback',
    });
  }

  // 5. Call Gemini API Server-Side with JSON Schema Enforcement
  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are AirWise, an expert urban air quality assistant helping families navigate winter smog.

CRITICAL INSTRUCTIONS:
- You must NOT invent, guess, or hallucinate any numbers or percentages.
- All exposure metrics, sub-indices, and percentage reductions are pre-computed by our deterministic engine below.
- Explain the direct impact of each choice using ONLY the deterministic figures provided.
- Provide practical indoor hacks (including window ventilation timing, clean-room approach, DIY box-fan with MERV 13/HEPA filter, and myth-checks).
- Emphasize N95 respirators over cloth/surgical masks when AQI is elevated.
- Output MUST strictly be valid JSON conforming to the requested schema.

DETERMINISTIC ENGINE DATA:
- City: ${cityName}
- Current NAQI: ${aqi} (${exposure.naqiCategory})
- Ambient PM2.5: ${pm25} µg/m³
- Estimated Daily Baseline Inhaled Particulate Dose: ${exposure.baselineDose} µg·h/m³
  - Outdoor Component: ${exposure.outdoorDose} µg·h/m³
  - Indoor Component: ${exposure.indoorDose} µg·h/m³ (est. indoor concentration: ${exposure.indoorConcentration} µg/m³)
- Health Risk Tier: ${exposure.healthRiskTier}
- Optimal Outdoor Time Window: ${bestWindow.startTime} to ${bestWindow.endTime} (Avg AQI: ${bestWindow.averageAqi}, ${bestWindow.category})
- Peak Inversion Smog Trap Window: ${worstWindow.startTime} to ${worstWindow.endTime} (Avg AQI: ${worstWindow.averageAqi}, ${worstWindow.category})
- Household Profile:
  - Children: ${profile.numKids}
  - Elderly: ${profile.numElderly}
  - Commute Mode: ${profile.commuteType}
  - Kitchen Cooking Fuel: ${profile.cookingFuel}
  - Has Air Purifier: ${profile.hasPurifier ? 'Yes' : 'No'}
  - Current Mask Type: ${profile.maskType}
  - Outdoor Time: ${profile.outdoorHours} hrs/day
- Theoretical Optimal Daily Dose: ${exposure.optimizedDose} µg·h/m³ (Achieves ~${exposure.potentialReductionPercent}% exposure reduction)

REQUIRED JSON STRUCTURE:
{
  "headline": string,
  "executiveSummary": string,
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text?.trim() || '';
    const parsedJson = JSON.parse(responseText);

    const validation = planResponseSchema.safeParse(parsedJson);
    if (!validation.success) {
      console.warn('Gemini response failed JSON schema validation, falling back:', validation.error);
      const fallback = generateFallbackPlan({
        cityName,
        profile,
        exposure,
        bestWindow,
        worstWindow,
      });
      return NextResponse.json({
        plan: fallback,
        exposure,
        source: 'deterministic_engine_fallback',
      });
    }

    return NextResponse.json({
      plan: validation.data,
      exposure,
      source: 'gemini_personalized',
    });
  } catch (error) {
    console.error('Gemini API call failed, deploying fallback plan:', error);
    const fallback = generateFallbackPlan({
      cityName,
      profile,
      exposure,
      bestWindow,
      worstWindow,
    });
    return NextResponse.json({
      plan: fallback,
      exposure,
      source: 'deterministic_engine_fallback',
    });
  }
}
