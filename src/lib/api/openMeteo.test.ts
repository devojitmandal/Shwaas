import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  processAirQualityData,
  analyzeDynamicWindows,
  HourlyAqiPoint,
  MAX_CACHE_ENTRIES,
  clearOpenMeteoCache,
  getOpenMeteoCacheSize,
  fetchAirQuality,
  searchCities,
} from './openMeteo';

describe('Multi-Factor Dynamic Window Analysis Engine', () => {
  const mockHourlyTimes = [
    '2026-11-19T06:00',
    '2026-11-19T07:00',
    '2026-11-19T08:00',
    '2026-11-19T13:00',
    '2026-11-19T14:00',
    '2026-11-19T15:00',
    '2026-11-19T21:00',
    '2026-11-19T22:00',
  ];

  const mockPm25 = [220, 240, 260, 45, 40, 50, 210, 230];
  const mockPm10 = [300, 320, 350, 80, 75, 90, 290, 310];
  const mockWind = [2.0, 1.8, 1.5, 7.5, 8.0, 6.5, 2.2, 1.9];
  const mockTemp = [14.0, 14.5, 16.0, 24.0, 25.0, 24.5, 18.0, 17.0];

  it('ranks windows by combining PM2.5 with wind dispersion and temperature', () => {
    const processed = processAirQualityData({
      current: { pm2_5: 180, pm10: 240, time: '2026-11-19T08:00' },
      hourly: {
        time: mockHourlyTimes,
        pm2_5: mockPm25,
        pm10: mockPm10,
        wind_speed_10m: mockWind,
        temperature_2m: mockTemp,
      },
      cityName: 'Delhi',
      latitude: 28.6,
      longitude: 77.2,
    });

    const recs = processed.windowRecommendations;
    expect(recs.bestAvailableWindow).toBeDefined();
    expect(recs.bestAvailableWindow.startTime).toContain('13:00');
    expect(recs.bestAvailableWindow.reasoning.length).toBeGreaterThan(0);
    expect(recs.bestAvailableWindow.reasoning.join(' ')).toContain('wind');
    expect(recs.dataProvenance).toContain('Open-Meteo');
  });

  it('detects severe smog lockout when NAQI > 300 for all 24 hours and warns user', () => {
    // 24 hours of severe pollution with AQI > 300 all day
    const severeHours: HourlyAqiPoint[] = Array.from({ length: 24 }, (_, i) => ({
      time: `2026-11-19T${String(i).padStart(2, '0')}:00`,
      pm25: 310 + (i % 5) * 5,
      pm10: 450,
      aqi: 380,
      category: 'Very Poor',
      windSpeedKmh: 1.2,
      temperatureC: 16,
    }));

    const result = analyzeDynamicWindows(severeHours);
    expect(result.noSafeWindowAvailable).toBe(true);
    expect(result.alertHeadline).toContain('NAQI > 300 for All 24 Hours');
    expect(result.bestAvailableWindow.isSafe).toBe(false);
    expect(result.bestAvailableWindow.advisory).toContain('Severe Smog Lockout');
  });

  it('does NOT trigger severe smog lockout if at least one hour dips to NAQI <= 300', () => {
    // 23 hours of >300, but 1 afternoon hour dips to 260 (Poor, <= 300)
    const mixedHours: HourlyAqiPoint[] = Array.from({ length: 24 }, (_, i) => ({
      time: `2026-11-19T${String(i).padStart(2, '0')}:00`,
      pm25: i === 13 ? 100 : 320,
      pm10: i === 13 ? 200 : 450,
      aqi: i === 13 ? 260 : 350,
      category: i === 13 ? 'Poor' : 'Very Poor',
    }));

    const result = analyzeDynamicWindows(mixedHours);
    expect(result.noSafeWindowAvailable).toBe(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearOpenMeteoCache();
  });

  it('gracefully degrades when weather arrays (wind/temp) are missing or empty without inventing 0s', () => {
    const pointsWithoutWeather: HourlyAqiPoint[] = [
      { time: '2026-11-19T12:00', pm25: 60, pm10: 100, aqi: 100, category: 'Satisfactory' },
      { time: '2026-11-19T13:00', pm25: 50, pm10: 90, aqi: 90, category: 'Satisfactory' },
    ];

    const result = analyzeDynamicWindows(pointsWithoutWeather);
    expect(result.bestAvailableWindow.averageAqi).toBeLessThanOrEqual(100);
    expect(result.bestAvailableWindow.isSafe).toBe(true);
    expect(result.bestAvailableWindow.windSpeedKmh).toBeUndefined();
    expect(result.bestAvailableWindow.temperatureC).toBeUndefined();
    expect(result.bestAvailableWindow.reasoning.join(' ')).not.toContain('Stagnant surface air');
    expect(result.bestAvailableWindow.reasoning.join(' ')).not.toContain('Cooler ground temperatures');
  });

  it('averages only defined weather readings when a window has partial telemetry', () => {
    const partialWeather: HourlyAqiPoint[] = [
      { time: '2026-11-19T12:00', pm25: 60, pm10: 100, aqi: 100, category: 'Satisfactory', windSpeedKmh: 10 },
      { time: '2026-11-19T13:00', pm25: 50, pm10: 90, aqi: 90, category: 'Satisfactory' },
    ];

    const result = analyzeDynamicWindows(partialWeather);
    expect(result.bestAvailableWindow.windSpeedKmh).toBe(10);
    expect(result.bestAvailableWindow.temperatureC).toBeUndefined();
  });

  it('aligns current weather metrics with the current air-quality timestamp rather than midnight index 0', async () => {
    const times = Array.from({ length: 24 }, (_, i) => `2026-11-19T${String(i).padStart(2, '0')}:00`);
    const temps = times.map((_, i) => (i === 14 ? 27.5 : 11.0));
    const winds = times.map((_, i) => (i === 14 ? 9.2 : 1.1));
    const humidities = times.map((_, i) => (i === 14 ? 38 : 85));

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('air-quality-api')) {
          return new Response(
            JSON.stringify({
              current: { time: '2026-11-19T14:15', pm2_5: 55, pm10: 95 },
              hourly: { time: times, pm2_5: times.map(() => 60), pm10: times.map(() => 100) },
            }),
            { status: 200 }
          );
        }
        return new Response(
          JSON.stringify({
            hourly: {
              time: times,
              temperature_2m: temps,
              wind_speed_10m: winds,
              relative_humidity_2m: humidities,
            },
          }),
          { status: 200 }
        );
      })
    );

    const processed = await fetchAirQuality(28.65, 77.23, 'Delhi');
    expect(processed.current.temperatureC).toBe(27.5);
    expect(processed.current.windSpeedKmh).toBe(9.2);
    expect(processed.current.relativeHumidity).toBe(38);
  });

  it('evicts the least-recently-used entry when cache exceeds MAX_CACHE_ENTRIES', async () => {
    clearOpenMeteoCache();
    let fetchCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        fetchCount++;
        return new Response(
          JSON.stringify({
            results: [{ id: fetchCount, name: `City${fetchCount}`, latitude: 28, longitude: 77 }],
          }),
          { status: 200 }
        );
      })
    );

    for (let i = 0; i < MAX_CACHE_ENTRIES; i++) {
      await searchCities(`city-query-${i}`);
    }
    expect(getOpenMeteoCacheSize()).toBe(MAX_CACHE_ENTRIES);

    // Touch entry 0 so entry 1 becomes least recently used
    await searchCities('city-query-0');
    expect(fetchCount).toBe(MAX_CACHE_ENTRIES); // served from cache

    // Insert one more entry -> entry 1 should be evicted
    await searchCities('city-query-overflow');
    expect(getOpenMeteoCacheSize()).toBe(MAX_CACHE_ENTRIES);

    // Entry 0 still cached, entry 1 triggers a fresh fetch
    await searchCities('city-query-0');
    expect(fetchCount).toBe(MAX_CACHE_ENTRIES + 1);
    await searchCities('city-query-1');
    expect(fetchCount).toBe(MAX_CACHE_ENTRIES + 2);
  });
});
