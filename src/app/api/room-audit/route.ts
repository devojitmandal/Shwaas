import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { checkRateLimit } from '@/lib/security/rateLimiter';
import {
  roomAuditRequestSchema,
  roomAuditVisionSchema,
  buildRoomAuditResult,
  RoomAuditVisionOutput,
} from '@/lib/audit/roomAuditSchema';

export const maxDuration = 30; // 30s timeout for vision processing

export async function POST(req: NextRequest) {
  // 0. Payload Size Cap (6 MB to accommodate 4MB base64 encoded binary)
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 6 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'Payload too large. Maximum supported image size is 4MB.' },
      { status: 413 }
    );
  }

  // 1. IP Rate Limiting (10 requests/minute)
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  const rateLimit = checkRateLimit(clientIp, { limit: 10, windowMs: 60 * 1000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Too many audit requests. Please wait a moment before uploading another photo.',
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

  // 2. Parse & Validate Request Body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Malformed JSON payload.' }, { status: 400 });
  }

  const parsedRequest = roomAuditRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    const errorDetails = parsedRequest.error.issues.map((i) => i.message).join(', ');
    return NextResponse.json({ error: `Validation failed: ${errorDetails}` }, { status: 400 });
  }

  const { image, mimeType, outdoorPm25 = 180 } = parsedRequest.data;

  // 3. Extract & Validate Raw Base64 Buffer Size (<= 4MB)
  const cleanBase64 = image.includes(',') ? image.split(',')[1] : image;
  try {
    const imageBuffer = Buffer.from(cleanBase64, 'base64');
    if (imageBuffer.length > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image exceeds maximum allowed size of 4MB.' },
        { status: 413 }
      );
    }
  } catch {
    return NextResponse.json({ error: 'Invalid base64 image data.' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  const buildFallbackResponse = (message = "Photo couldn't be analyzed, showing a generic estimate.") => {
    const fallbackVision: RoomAuditVisionOutput = {
      roomType: 'Urban Living / Bedroom',
      windowGaps: 'minor_gaps',
      cookingSource: 'lpg_electric',
      ventilationType: 'sealed_windows',
      visibleDustSources: 'moderate',
      observations: [
        'Generic estimate applied: window perimeter modeled with standard sliding gaps (AER 0.70 h⁻¹).',
        'Indoor cooking source modeled with standard clean fuel baseline.',
      ],
    };

    const audit = buildRoomAuditResult(
      fallbackVision,
      outdoorPm25,
      'rule_based_fallback',
      false,
      message
    );
    return NextResponse.json({
      audit,
      source: 'rule_based_fallback',
      analyzed: false,
      message,
    });
  };

  // 4. Deterministic Rule-Based Fallback if API key is missing
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return buildFallbackResponse();
  }

  // 5. Call Gemini 2.5 Flash Vision Server-Side
  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are Shwaas Photo Room Auditor, an environmental building science assistant analyzing room photos for indoor air quality and winter smog infiltration.

Analyze the room photo carefully for:
1. Window sealing quality and visible frame gaps (is it tight/sealed, does it have minor perimeter gaps, or is it open/drafty?).
2. Cooking stove / heat sources visible in or adjoining the space (LPG/electric, kerosene/biomass, chulha wood, or none visible).
3. Ventilation pathways (sealed windows, open windows, or active exhaust chimney).
4. Visible particulate sources (incense sticks / agarbatti, heavy indoor soot/dust, or minimal).
5. Room classification (e.g. Living Room, Bedroom, Kitchen, Balcony Study).

CRITICAL CONSTRAINTS:
- You must output ONLY valid JSON matching the exact schema below.
- Do NOT output any Markdown fences, extra text, or disclaimers outside the JSON.

SCHEMA:
{
  "roomType": string,
  "windowGaps": "sealed" | "minor_gaps" | "open_drafty",
  "cookingSource": "lpg_electric" | "kerosene_biomass" | "chulha_wood" | "none_visible",
  "ventilationType": "sealed_windows" | "open_windows" | "exhaust_chimney",
  "visibleDustSources": "minimal" | "moderate" | "heavy_incense_dust",
  "observations": string[]
}`;

    const generatePromise = ai.models.generateContent({
      model: process.env.GEMINI_MODEL ?? 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    // 20-second timeout guard to prevent worker hang
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini Vision API call timed out after 20000ms')), 20000)
    );

    const response: Awaited<ReturnType<typeof ai.models.generateContent>> = await Promise.race([
      generatePromise,
      timeoutPromise,
    ]);

    const rawText = response.text?.trim() || '{}';
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch {
      // In case of markdown formatting artifacts
      const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
      parsedJson = JSON.parse(cleaned);
    }

    const visionResult = roomAuditVisionSchema.safeParse(parsedJson);
    if (!visionResult.success) {
      return buildFallbackResponse();
    }

    const audit = buildRoomAuditResult(visionResult.data, outdoorPm25, 'gemini_vision_audit', true);
    return NextResponse.json({ audit, source: 'gemini_vision_audit', analyzed: true });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    const errStatus = (error as { status?: number | string })?.status;
    console.error(`Gemini vision room audit failed [status: ${errStatus ?? 'N/A'}]: ${errMessage}`);
    return buildFallbackResponse();
  }
}
