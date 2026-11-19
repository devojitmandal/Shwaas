import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { householdProfileSchema } from '@/lib/validation/profileSchema';
import { calculateDailyExposure } from '@/lib/exposure/engine';
import { checkRateLimit } from '@/lib/security/rateLimiter';
import { planResponseSchema, generateFallbackPlan } from '@/lib/plan/planSchema';
import { OutdoorWindow } from '@/lib/api/openMeteo';

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
    averagePm25: z.number().optional(),
    category: z.enum(['Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe']),
    advisory: z.string(),
    reasoning: z.array(z.string()).optional(),
    isSafe: z.boolean().optional(),
  }),
  worstWindow: z.object({
    startTime: z.string(),
    endTime: z.string(),
    averageAqi: z.number(),
    averagePm25: z.number().optional(),
    category: z.enum(['Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe']),
    advisory: z.string(),
  }),
  noSafeWindowAvailable: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  // 0. Payload Size Cap (64 KB)
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 65536) {
    return NextResponse.json({ error: 'Payload too large (max 64KB).' }, { status: 413 });
  }

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

  const { profile, aqi, pm25, cityName, bestWindow, worstWindow, noSafeWindowAvailable } = parseResult.data;

  // Sanitize cityName to prevent prompt injection vectors
  const sanitizedCityName =
    cityName
      .replace(/[^\w\s,.-]/gi, '')
      .trim()
      .slice(0, 80) || 'Selected Location';

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

  // 4. Fallback if no API key is configured or invalid
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    const fallbackPlan = generateFallbackPlan({
      cityName: sanitizedCityName,
      profile,
      exposure,
      bestWindow: normalizedBestWindow,
      worstWindow: normalizedWorstWindow,
      noSafeWindowAvailable,
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

    const prompt = `You are Shwaas (श्वास — हर सांस का हिसाब), an urban air quality assistant helping families navigate severe winter smog.

CRITICAL ANTI-HALLUCINATION INSTRUCTIONS:
- You must NOT invent, guess, or fabricate any numerical metrics, AQI values, or percentages.
- All exposure metrics, sub-indices, and percentage reductions are pre-computed by our deterministic engine below.
- Explain the direct impact of each choice using ONLY the deterministic figures provided.
- Do NOT claim that N95 provides 100% protection (account for real-world face-seal leakage ~15-20%).
- Do NOT claim that a purifier "refunds" already inhaled pollution; it lowers future indoor exposure.
- If noSafeWindowAvailable is true, do NOT pretend a safe window exists; explicitly recommend postponing outdoor activity.
- Output MUST strictly be valid JSON conforming to the requested schema.

DETERMINISTIC ENGINE DATA:
- City: ${cityName}
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

    const generatePromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    // 8-second timeout guard to prevent thread blocking
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API call timed out after 8000ms')), 8000)
    );

    const response = (await Promise.race([generatePromise, timeoutPromise])) as any;

    const responseText = response.text?.trim() || '';
    const parsedJson = JSON.parse(responseText);

    const validation = planResponseSchema.safeParse(parsedJson);
    if (!validation.success) {
      console.warn('Gemini response failed JSON schema validation, falling back:', validation.error);
      const fallback = generateFallbackPlan({
        cityName: sanitizedCityName,
        profile,
        exposure,
        bestWindow: normalizedBestWindow,
        worstWindow: normalizedWorstWindow,
        noSafeWindowAvailable,
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
      cityName: sanitizedCityName,
      profile,
      exposure,
      bestWindow: normalizedBestWindow,
      worstWindow: normalizedWorstWindow,
      noSafeWindowAvailable,
    });
    return NextResponse.json({
      plan: fallback,
      exposure,
      source: 'deterministic_engine_fallback',
    });
  }
}
