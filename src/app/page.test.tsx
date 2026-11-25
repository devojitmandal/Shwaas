import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Home from './page';
import { ProcessedAirQuality } from '@/lib/api/openMeteo';
import { generateFallbackPlan } from '@/lib/plan/planSchema';
import { DEFAULT_HOUSEHOLD_PROFILE } from '@/lib/validation/profileSchema';
import { calculateDailyExposure } from '@/lib/exposure/engine';

const mockFetchAirQuality = vi.fn();

vi.mock('@/lib/api/openMeteo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/openMeteo')>();
  return {
    ...actual,
    fetchAirQuality: (...args: unknown[]) => mockFetchAirQuality(...args),
  };
});

function buildAirData(cityName: string, aqi = 240): ProcessedAirQuality {
  const bestWindow = {
    startTime: '2026-11-19T13:00',
    endTime: '2026-11-19T15:00',
    averageAqi: 120,
    averagePm25: 65,
    category: 'Moderate' as const,
    advisory: 'Afternoon dispersion window',
    reasoning: ['Midday mixing lowers surface PM2.5'],
    isSafe: false,
  };
  const worstWindow = {
    startTime: '2026-11-19T07:00',
    endTime: '2026-11-19T09:00',
    averageAqi: 340,
    averagePm25: 190,
    category: 'Very Poor' as const,
    advisory: 'Morning smog inversion',
    reasoning: ['Low boundary layer traps exhaust'],
    isSafe: false,
  };
  return {
    cityName,
    latitude: 28.65,
    longitude: 77.23,
    timestamp: '2026-11-19T12:00',
    dataSource: 'Open-Meteo Test',
    isStale: false,
    current: {
      time: '2026-11-19T12:00',
      pm25: 110,
      pm10: 170,
      aqi,
      dominantPollutant: 'PM2.5',
      category: 'Poor',
      chipBg: '#EA580C',
      textColor: '#FFFFFF',
      description: 'Poor air quality.',
    },
    hourly: Array.from({ length: 24 }, (_, i) => ({
      time: `2026-11-19T${String(i).padStart(2, '0')}:00`,
      pm25: 110,
      pm10: 170,
      aqi,
      category: 'Poor' as const,
    })),
    windowRecommendations: {
      bestAvailableWindow: bestWindow,
      worstWindow,
      rankedWindows: [bestWindow],
      noSafeWindowAvailable: false,
      alertHeadline: 'Caution',
      forecastConfidence: 'Model Estimate',
      dataProvenance: 'Test',
    },
    bestWindow,
    worstWindow,
  };
}

describe('Home Page Orchestrator', () => {
  beforeEach(() => {
    window.location.hash = '';
    mockFetchAirQuality.mockReset();
    mockFetchAirQuality.mockResolvedValue(buildAirData('Delhi, India'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('preserves active language when clicking Regenerate Plan in My Plan view', async () => {
    const planBodies: Array<{ language?: string }> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        const parsed = JSON.parse(String(init?.body || '{}'));
        planBodies.push(parsed);
        const exposure = calculateDailyExposure({
          ...DEFAULT_HOUSEHOLD_PROFILE,
          currentAqi: 240,
          pm25Concentration: 110,
          timeOutdoorsHours: 2,
          indoorHours: 22,
          vulnerableMembers: { hasKids: true, hasElderly: false },
        });
        const air = buildAirData('Delhi, India');
        const plan = generateFallbackPlan({
          cityName: 'Delhi, India',
          profile: DEFAULT_HOUSEHOLD_PROFILE,
          exposure,
          bestWindow: air.bestWindow,
          worstWindow: air.worstWindow,
          language: parsed.language || 'en',
        });
        return new Response(
          JSON.stringify({ plan, exposure, source: 'deterministic_engine_fallback' }),
          { status: 200 }
        );
      })
    );

    render(<Home />);

    await waitFor(() => expect(planBodies.length).toBeGreaterThanOrEqual(1));

    // Switch language to Hindi
    const hindiBtn = screen.getAllByRole('button', { name: 'हिन्दी' })[0];
    fireEvent.click(hindiBtn);

    await waitFor(() => expect(planBodies.some((b) => b.language === 'hi')).toBe(true));

    // Navigate to My Plan view
    const planNav = screen.getByRole('link', { name: /my plan/i });
    fireEvent.click(planNav);

    const regenBtn = await screen.findByRole('button', { name: /regenerate plan/i });
    const countBeforeRegen = planBodies.length;
    fireEvent.click(regenBtn);

    await waitFor(() => expect(planBodies.length).toBeGreaterThan(countBeforeRegen));
    expect(planBodies[planBodies.length - 1].language).toBe('hi');
  });

  it('ignores stale out-of-order fetchAirQuality responses when user switches cities rapidly', async () => {
    let resolveFirst!: (val: ProcessedAirQuality) => void;
    let resolveSecond!: (val: ProcessedAirQuality) => void;

    mockFetchAirQuality
      .mockImplementationOnce(() => new Promise<ProcessedAirQuality>((res) => { resolveFirst = res; }))
      .mockImplementationOnce(() => new Promise<ProcessedAirQuality>((res) => { resolveSecond = res; }));

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({}), { status: 500 }))
    );

    render(<Home />);

    // Trigger city switch before initial Delhi request completes
    await waitFor(() => expect(mockFetchAirQuality).toHaveBeenCalledTimes(1));
    const mumbaiBtn = screen.getByRole('button', { name: 'Mumbai' });
    fireEvent.click(mumbaiBtn);

    await waitFor(() => expect(mockFetchAirQuality).toHaveBeenCalledTimes(2));

    // Resolve newer Mumbai request first, then stale Delhi request second
    await act(async () => {
      resolveSecond(buildAirData('Mumbai, Maharashtra', 130));
    });
    await waitFor(() => expect(screen.getAllByText(/Mumbai, Maharashtra/i).length).toBeGreaterThan(0));

    await act(async () => {
      resolveFirst(buildAirData('Delhi, India', 390));
    });
    expect(screen.queryByRole('heading', { name: /Delhi, India/i })).not.toBeInTheDocument();
  });
});
