import { describe, it, expect } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { DEFAULT_HOUSEHOLD_PROFILE } from '@/lib/validation/profileSchema';

describe('Plan API Route Handler', () => {
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
});
