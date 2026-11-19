import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { DEFAULT_HOUSEHOLD_PROFILE } from '@/lib/validation/profileSchema';

// Hoisted mock for @google/genai in plan route tests
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: mockGenerateContent,
      };
    },
  };
});

describe('Plan API Route Handler', () => {
  const originalEnv = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    mockGenerateContent.mockReset();
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalEnv;
  });
  const validPayload = {
    profile: DEFAULT_HOUSEHOLD_PROFILE,
    aqi: 280,
    pm25: 115,
    cityName: 'Delhi',
    bestWindow: {
      startTime: '2026-11-19T13:00',
      endTime: '2026-11-19T15:00',
      averageAqi: 120,
      category: 'Moderate' as const,
      advisory: 'Best afternoon window',
    },
    worstWindow: {
      startTime: '2026-11-19T06:00',
      endTime: '2026-11-19T09:00',
      averageAqi: 350,
      category: 'Very Poor' as const,
      advisory: 'Peak inversion window',
    },
  };

  it('gracefully returns deterministic engine plan when GEMINI_API_KEY is not set', async () => {
    const req = new NextRequest('http://localhost:3000/api/plan', {
      method: 'POST',
      body: JSON.stringify(validPayload),
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.plan).toBeDefined();
    expect(data.exposure).toBeDefined();
    expect(data.source).toBe('deterministic_engine_fallback');
    expect(data.plan.headline).toContain('Delhi');
    expect(data.exposure.baselineDose).toBeGreaterThan(0);
  });

  it('rejects invalid request payloads with HTTP 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/plan', {
      method: 'POST',
      body: JSON.stringify({ aqi: 9999 }), // invalid
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects payloads exceeding 64KB with HTTP 413 Payload Too Large', async () => {
    const req = new NextRequest('http://localhost:3000/api/plan', {
      method: 'POST',
      body: JSON.stringify(validPayload),
      headers: {
        'Content-Type': 'application/json',
        'content-length': '70000',
        'x-forwarded-for': '127.0.0.2',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(413);
    const data = await res.json();
    expect(data.error).toContain('Payload too large');
  });

  it('sanitizes malicious script or injection strings in cityName safely', async () => {
    const maliciousPayload = {
      ...validPayload,
      cityName: 'Delhi; DROP TABLE users; <script>alert(1)</script>',
    };

    const req = new NextRequest('http://localhost:3000/api/plan', {
      method: 'POST',
      body: JSON.stringify(maliciousPayload),
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.3',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.plan.headline).not.toContain('<script>');
  });

  it('generates plan in Hindi when language is set to hi', async () => {
    const hindiPayload = {
      ...validPayload,
      language: 'hi' as const,
    };

    const req = new NextRequest('http://localhost:3000/api/plan', {
      method: 'POST',
      body: JSON.stringify(hindiPayload),
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.4',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.plan.headline).toContain('के लिए स्मॉग सुरक्षा कार्ययोजना');
    expect(data.plan.disclaimer).toContain('चिकित्सीय सलाह नहीं है');
    // Numbers still strictly deterministic
    expect(data.exposure.totalInhaledMassUg).toBeGreaterThan(0);
  });

  it('generates plan in Kannada when language is set to kn', async () => {
    const kannadaPayload = {
      ...validPayload,
      language: 'kn' as const,
    };

    const req = new NextRequest('http://localhost:3000/api/plan', {
      method: 'POST',
      body: JSON.stringify(kannadaPayload),
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.5',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.plan.headline).toContain('ಹೊಗೆ ರಕ್ಷಣಾ ಯೋಜನೆ');
    expect(data.plan.disclaimer).toContain('ವೈದ್ಯಕೀಯ ಸಲಹೆಯಲ್ಲ');
    // Numbers still strictly deterministic
    expect(data.exposure.totalInhaledMassUg).toBeGreaterThan(0);
  });

  it('invokes Gemini with gemini-3.8-flash and logs error message and status only on failure', async () => {
    process.env.GEMINI_API_KEY = 'super_secret_user_api_key_xyz987';
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockError: any = new Error('Model gemini-3.8-flash not found or quota exhausted');
    mockError.status = 404;
    mockGenerateContent.mockRejectedValueOnce(mockError);

    const req = new NextRequest('http://localhost:3000/api/plan', {
      method: 'POST',
      body: JSON.stringify(validPayload),
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.6',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.source).toBe('deterministic_engine_fallback');

    // Verify model was gemini-3.8-flash
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-3.8-flash',
      })
    );

    // Verify console.error logged message and status but NEVER the secret API key
    expect(consoleErrorSpy).toHaveBeenCalled();
    const loggedError = consoleErrorSpy.mock.calls.map((c) => c.join(' ')).join(' ');
    expect(loggedError).toContain('404');
    expect(loggedError).toContain('gemini-3.8-flash');
    expect(loggedError).not.toContain('super_secret_user_api_key_xyz987');

    consoleErrorSpy.mockRestore();
  });
});
