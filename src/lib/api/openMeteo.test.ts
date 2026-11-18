import { describe, it, expect } from 'vitest';
import { processAirQualityData, findOptimalWindows } from './openMeteo';

describe('Open-Meteo Air Quality Processor & Window Analyzer', () => {
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

  // Morning inversion (high smog), afternoon solar mixing (lowest smog), night peak
  const mockPm25 = [220, 240, 260, 45, 40, 50, 210, 230];
  const mockPm10 = [300, 320, 350, 80, 75, 90, 290, 310];

  it('transforms raw pollutant vectors into NAQI hourly points', () => {
    const processed = processAirQualityData({
      current: { pm2_5: 180, pm10: 240, time: '2026-11-19T08:00' },
      hourly: {
        time: mockHourlyTimes,
        pm2_5: mockPm25,
        pm10: mockPm10,
      },
      cityName: 'Delhi',
      latitude: 28.6,
      longitude: 77.2,
    });

    expect(processed.current.aqi).toBeGreaterThan(0);
    expect(processed.hourly.length).toBe(8);
    expect(processed.hourly[3].aqi).toBeLessThan(processed.hourly[0].aqi);
    expect(processed.cityName).toBe('Delhi');
  });

  it('correctly identifies the best (lowest AQI) and worst (peak smog) outdoor time windows', () => {
    const hourlyPoints = mockHourlyTimes.map((time, idx) => ({
      time,
      pm25: mockPm25[idx],
      pm10: mockPm10[idx],
      aqi: mockPm25[idx] < 60 ? 80 : 350,
      category: mockPm25[idx] < 60 ? ('Satisfactory' as const) : ('Very Poor' as const),
    }));

    const windows = findOptimalWindows(hourlyPoints);
    expect(windows.bestWindow.startTime).toContain('13:00');
    expect(windows.bestWindow.averageAqi).toBeLessThan(100);
    expect(windows.worstWindow.startTime).toContain('06:00');
    expect(windows.worstWindow.averageAqi).toBeGreaterThan(300);
  });
});
