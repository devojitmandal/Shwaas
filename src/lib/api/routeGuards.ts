import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/security/rateLimiter';

export interface RouteGuardOptions {
  maxBytes: number;
  payloadTooLargeMessage: string;
  rateLimit: {
    limit: number;
    windowMs: number;
    message: string;
  };
  malformedJsonMessage: string;
  validationErrorPrefix?: string;
}

export type ParsedRouteResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

/**
 * Extracts client IP from standard proxy headers without spoofing external inputs.
 */
export function extractClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

/**
 * Shared boundary guard for JSON POST routes:
 * 1. Content-Length cap (413)
 * 2. Sliding-window IP rate limit (429 + Retry-After)
 * 3. Safe JSON parsing (400)
 * 4. Zod schema validation (400)
 */
export async function parseGuardedJsonRequest<TSchema extends z.ZodTypeAny>(
  req: NextRequest,
  schema: TSchema,
  options: RouteGuardOptions
): Promise<ParsedRouteResult<z.infer<TSchema>>> {
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > options.maxBytes) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: options.payloadTooLargeMessage },
        { status: 413 }
      ),
    };
  }

  const clientIp = extractClientIp(req);
  const rateLimit = checkRateLimit(clientIp, {
    limit: options.rateLimit.limit,
    windowMs: options.rateLimit.windowMs,
  });

  if (!rateLimit.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: options.rateLimit.message,
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
          },
        }
      ),
    };
  }

  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: options.malformedJsonMessage }, { status: 400 }),
    };
  }

  const parsed = schema.safeParse(bodyJson);
  if (!parsed.success) {
    if (options.validationErrorPrefix) {
      const errorDetails = parsed.error.issues.map((i) => i.message).join(', ');
      return {
        ok: false,
        response: NextResponse.json(
          { error: `${options.validationErrorPrefix}: ${errorDetails}` },
          { status: 400 }
        ),
      };
    }

    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Input validation failed', details: parsed.error.flatten() },
        { status: 400 }
      ),
    };
  }

  return { ok: true, data: parsed.data };
}

/**
 * Returns true if a non-placeholder Gemini API key is configured.
 */
export function hasConfiguredGeminiKey(apiKey: string | undefined): apiKey is string {
  return Boolean(apiKey && apiKey !== 'your_gemini_api_key_here');
}

/**
 * Executes a Gemini SDK operation with a cleared timeout guard so resolved requests
 * do not leave dangling 20-second timers alive.
 */
export async function callGeminiWithTimeout(
  apiKey: string,
  operation: (ai: GoogleGenAI, model: string) => Promise<Awaited<ReturnType<GoogleGenAI['models']['generateContent']>>>,
  timeoutMs = 20000
): Promise<Awaited<ReturnType<GoogleGenAI['models']['generateContent']>>> {
  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL ?? 'gemini-3.8-flash';

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`Gemini API call timed out after ${timeoutMs}ms`)),
      timeoutMs
    );
  });

  try {
    return await Promise.race([operation(ai, model), timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Logs Gemini errors using only message and HTTP status to prevent key or payload leaks.
 */
export function logSanitizedGeminiError(label: string, error: unknown): void {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errStatus = (error as { status?: number | string })?.status;
  console.error(`${label} [status: ${errStatus ?? 'N/A'}]: ${errMessage}`);
}
