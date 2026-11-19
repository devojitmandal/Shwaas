import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Hoisted mock for @google/genai
const mockVisionGenerateContent = vi.fn().mockResolvedValue({
  text: JSON.stringify({
    roomType: 'Master Bedroom',
    windowGaps: 'open_drafty',
    cookingSource: 'none_visible',
    ventilationType: 'open_windows',
    visibleDustSources: 'heavy_incense_dust',
    observations: [
      'Wide visible gap along lower window sash.',
      'Incense stick stand on corner table.',
    ],
  }),
});

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: mockVisionGenerateContent,
      };
    },
  };
});

// 1x1 transparent PNG as base64 string
const SAMPLE_BASE64_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

describe('Room Audit API Route Handler', () => {
  const originalEnv = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalEnv;
  });

  it('gracefully returns rule-based fallback audit with mass-balance ranked fixes when GEMINI_API_KEY is not set', async () => {
    const req = new NextRequest('http://localhost:3000/api/room-audit', {
      method: 'POST',
      body: JSON.stringify({
        image: SAMPLE_BASE64_PNG,
        mimeType: 'image/png',
        outdoorPm25: 220,
      }),
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.10',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.audit).toBeDefined();
    expect(data.source).toBe('rule_based_fallback');
    expect(data.analyzed).toBe(false);
    expect(data.message).toBe("Photo couldn't be analyzed, showing a generic estimate.");
    expect(data.audit.analyzed).toBe(false);
    expect(data.audit.observations).toEqual([
      'Generic estimate applied: window perimeter modeled with standard sliding gaps (AER 0.70 h⁻¹).',
      'Indoor cooking source modeled with standard clean fuel baseline.',
    ]);
    expect(data.audit.aerEstimated).toBe(0.70);
    expect(data.audit.indoorSourceSEstimated).toBeGreaterThan(0);
    expect(data.audit.estimatedBaselineIndoorPm25).toBeGreaterThan(0);
    expect(data.audit.rankedFixes.length).toBeGreaterThan(0);

    // Verify ranked fixes include budget points
    const topFix = data.audit.rankedFixes[0];
    expect(topFix.rank).toBe(1);
    expect(topFix.budgetPointsSaved).toBeGreaterThan(0);
    expect(topFix.difficulty).toBeDefined();
  });

  it('rejects unsupported image MIME types with HTTP 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/room-audit', {
      method: 'POST',
      body: JSON.stringify({
        image: SAMPLE_BASE64_PNG,
        mimeType: 'image/gif', // unsupported
      }),
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.11',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Validation failed');
  });

  it('rejects image data exceeding 4MB with HTTP 413', async () => {
    // Generate simulated 4.5 MB base64 string
    const largeBuffer = Buffer.alloc(4.5 * 1024 * 1024, 65); // 4.5 MB of 'A'
    const largeBase64 = largeBuffer.toString('base64');

    const req = new NextRequest('http://localhost:3000/api/room-audit', {
      method: 'POST',
      body: JSON.stringify({
        image: largeBase64,
        mimeType: 'image/jpeg',
      }),
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.12',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(413);
    const data = await res.json();
    expect(data.error).toContain('4MB');
  });

  it('calls Gemini vision when API key is provided and returns mapped mass-balance audit', async () => {
    process.env.GEMINI_API_KEY = 'mock_valid_key';

    const req = new NextRequest('http://localhost:3000/api/room-audit', {
      method: 'POST',
      body: JSON.stringify({
        image: SAMPLE_BASE64_PNG,
        mimeType: 'image/png',
        outdoorPm25: 250,
      }),
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.13',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.source).toBe('gemini_vision_audit');
    expect(data.analyzed).toBe(true);
    expect(data.audit.analyzed).toBe(true);
    expect(data.audit.roomType).toBe('Master Bedroom');
    expect(data.audit.windowGaps).toBe('open_drafty');
    expect(data.audit.aerEstimated).toBe(1.80); // Mapped open_drafty
    expect(data.audit.visibleDustSources).toBe('heavy_incense_dust');
    expect(data.audit.rankedFixes.length).toBeGreaterThan(0);
    expect(data.audit.summary).toContain('Air Exchange Rate of 1.8 h⁻¹');

    // Verify model was gemini-3.8-flash
    expect(mockVisionGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-3.8-flash',
      })
    );
  });

  it('logs error message and status only without leaking secret API key when vision throws', async () => {
    process.env.GEMINI_API_KEY = 'super_secret_vision_key_abc123';
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockVisionErr: any = new Error('Vision quota exhausted on gemini-3.8-flash');
    mockVisionErr.status = 429;
    mockVisionGenerateContent.mockRejectedValueOnce(mockVisionErr);

    const req = new NextRequest('http://localhost:3000/api/room-audit', {
      method: 'POST',
      body: JSON.stringify({
        image: SAMPLE_BASE64_PNG,
        mimeType: 'image/png',
        outdoorPm25: 250,
      }),
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.14',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.source).toBe('rule_based_fallback');
    expect(data.analyzed).toBe(false);
    expect(data.message).toBe("Photo couldn't be analyzed, showing a generic estimate.");
    expect(data.audit.analyzed).toBe(false);

    expect(consoleErrorSpy).toHaveBeenCalled();
    const loggedError = consoleErrorSpy.mock.calls.map((c) => c.join(' ')).join(' ');
    expect(loggedError).toContain('429');
    expect(loggedError).toContain('gemini-3.8-flash');
    expect(loggedError).not.toContain('super_secret_vision_key_abc123');

    consoleErrorSpy.mockRestore();
  });
});
