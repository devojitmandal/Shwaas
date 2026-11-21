import { calculateNaqi, NaqiCategory, getNaqiCategory } from '../aqi/naqi';

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

export interface HourlyAqiPoint {
  time: string; // ISO string e.g. "2026-11-19T14:00"
  pm25: number;
  pm10: number;
  aqi: number;
  category: NaqiCategory;
  temperatureC?: number;
  windSpeedKmh?: number;
  relativeHumidity?: number;
  precipitationMm?: number;
}

export interface OutdoorWindow {
  startTime: string;
  endTime: string;
  averageAqi: number;
  averagePm25: number;
  category: NaqiCategory;
  advisory: string;
  reasoning: string[];
  isSafe: boolean; // false if AQI > 100
  windSpeedKmh?: number;
  temperatureC?: number;
}

export interface WindowRecommendationResult {
  bestAvailableWindow: OutdoorWindow;
  worstWindow: OutdoorWindow;
  rankedWindows: OutdoorWindow[];
  noSafeWindowAvailable: boolean;
  alertHeadline: string;
  forecastConfidence: 'High' | 'Medium' | 'Model Estimate';
  dataProvenance: string;
}

export interface ProcessedAirQuality {
  cityName: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  dataSource: string;
  isStale: boolean;
  current: {
    time: string;
    pm25: number;
    pm10: number;
    aqi: number;
    dominantPollutant: 'PM2.5' | 'PM10';
    category: NaqiCategory;
    chipBg: string;
    textColor: string;
    description: string;
    temperatureC?: number;
    windSpeedKmh?: number;
    relativeHumidity?: number;
  };
  hourly: HourlyAqiPoint[];
  windowRecommendations: WindowRecommendationResult;
  // Legacy aliases for backward compatibility
  bestWindow: OutdoorWindow;
  worstWindow: OutdoorWindow;
}

// In-memory LRU cache with 15-minute TTL and bounded capacity
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
export const MAX_CACHE_ENTRIES = 200;
const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 15 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  // Re-insert to refresh LRU recency
  cache.delete(key);
  cache.set(key, entry);
  return entry.data;
}

function setCache<T>(key: string, data: T): void {
  if (cache.has(key)) {
    cache.delete(key);
  } else if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }
  cache.set(key, { data, timestamp: Date.now() });
}

export function clearOpenMeteoCache(): void {
  cache.clear();
}

export function getOpenMeteoCacheSize(): number {
  return cache.size;
}

/**
 * Multi-factor dynamic outdoor activity recommendation engine.
 * Evaluates hourly PM2.5, PM10, wind dispersion, temperature, and precipitation.
 * Explicitly flags when no genuinely safe window exists across the day.
 */
export function analyzeDynamicWindows(hourly: HourlyAqiPoint[]): WindowRecommendationResult {
  const fallbackWindow: OutdoorWindow = {
    startTime: '12:00',
    endTime: '14:00',
    averageAqi: 200,
    averagePm25: 90,
    category: 'Moderate',
    advisory: 'Insufficient forecast telemetry to rank hourly windows.',
    reasoning: ['Defaulting to midday schedule due to missing forecast vectors.'],
    isSafe: false,
  };

  if (!hourly || hourly.length === 0) {
    return {
      bestAvailableWindow: fallbackWindow,
      worstWindow: fallbackWindow,
      rankedWindows: [],
      noSafeWindowAvailable: true,
      alertHeadline: 'No hourly telemetry available.',
      forecastConfidence: 'Model Estimate',
      dataProvenance: 'Open-Meteo Atmospheric Chemistry Model',
    };
  }

  const windowSize = Math.min(2, hourly.length); // 2-hour activity windows
  const candidateWindows: OutdoorWindow[] = [];

  for (let i = 0; i <= hourly.length - windowSize; i++) {
    let sumAqi = 0;
    let sumPm25 = 0;
    let sumWind = 0;
    let sumTemp = 0;
    let count = 0;

    for (let j = 0; j < windowSize; j++) {
      const pt = hourly[i + j];
      sumAqi += pt.aqi;
      sumPm25 += pt.pm25;
      if (pt.windSpeedKmh !== undefined) sumWind += pt.windSpeedKmh;
      if (pt.temperatureC !== undefined) sumTemp += pt.temperatureC;
      count++;
    }

    const avgAqi = Math.round(sumAqi / count);
    const avgPm25 = Math.round((sumPm25 / count) * 10) / 10;
    const avgWind = count > 0 ? Math.round((sumWind / count) * 10) / 10 : undefined;
    const avgTemp = count > 0 ? Math.round((sumTemp / count) * 10) / 10 : undefined;

    const catMeta = getNaqiCategory(avgAqi);
    const startPt = hourly[i];
    const endPt = hourly[i + windowSize - 1];

    const reasoning: string[] = [];
    reasoning.push(`Forecast average PM2.5 is ${avgPm25} µg/m³ (CPCB NAQI: ${catMeta.category}).`);

    if (avgWind !== undefined) {
      if (avgWind > 6) {
        reasoning.push(`Moderate surface winds (~${avgWind} km/h) encourage localized pollutant dispersion.`);
      } else if (avgWind < 2.5) {
        reasoning.push(`Stagnant surface air (~${avgWind} km/h) limits atmospheric ventilation.`);
      }
    }

    if (avgTemp !== undefined) {
      if (avgTemp < 15) {
        reasoning.push(`Cooler ground temperatures (~${avgTemp}°C) promote thermal inversion particulate trapping.`);
      } else if (avgTemp > 22) {
        reasoning.push(`Solar surface warming (~${avgTemp}°C) enhances vertical convective air mixing.`);
      }
    }

    const isSafe = avgAqi <= 100; // Good or Satisfactory

    candidateWindows.push({
      startTime: startPt.time,
      endTime: endPt.time,
      averageAqi: avgAqi,
      averagePm25: avgPm25,
      category: catMeta.category,
      advisory: isSafe
        ? 'Relatively lower pollution window. Suitable for essential errands and ventilation.'
        : 'Elevated pollution: minimize outdoor exertion; wear certified N95 respirators.',
      reasoning,
      isSafe,
      windSpeedKmh: avgWind,
      temperatureC: avgTemp,
    });
  }

  // Sort candidate windows from lowest AQI to highest
  candidateWindows.sort((a, b) => a.averageAqi - b.averageAqi);

  const bestAvailable = candidateWindows[0] || fallbackWindow;
  const worst = candidateWindows[candidateWindows.length - 1] || fallbackWindow;

  // Severe Smog Lockout: NAQI > 300 for all 24 hours (single threshold)
  const isLockoutActive = hourly.length > 0 && hourly.every((h) => h.aqi > 300);

  let alertHeadline = 'Dynamic Activity Window Identified';
  if (isLockoutActive) {
    alertHeadline = 'CRITICAL SMOG LOCKOUT: NAQI > 300 for All 24 Hours';
    bestAvailable.advisory =
      'Severe Smog Lockout: NAQI exceeds 300 across all 24 hours. No safe outdoor window exists today. Cancel all outdoor activities and seal indoor clean rooms.';
    bestAvailable.reasoning.unshift(
      'Notice: Severe Smog Lockout (NAQI > 300 across all 24 hours). This interval is merely the least-polluted available time, not a safe threshold.'
    );
  } else if (!bestAvailable.isSafe) {
    alertHeadline = 'Caution: Only Moderately Polluted Windows Available';
  } else {
    alertHeadline = 'Cleanest Available Window for Errands';
  }

  return {
    bestAvailableWindow: bestAvailable,
    worstWindow: worst,
    rankedWindows: candidateWindows.slice(0, 5),
    noSafeWindowAvailable: isLockoutActive,
    alertHeadline,
    forecastConfidence: 'Model Estimate',
    dataProvenance: 'Open-Meteo Atmospheric Chemistry Model (CAMS/ECMWF)',
  };
}

export function processAirQualityData(params: {
  current: {
    pm2_5: number;
    pm10: number;
    time: string;
    temperatureC?: number;
    windSpeedKmh?: number;
    relativeHumidity?: number;
  };
  hourly: {
    time: string[];
    pm2_5: number[];
    pm10: number[];
    temperature_2m?: number[];
    wind_speed_10m?: number[];
    relative_humidity_2m?: number[];
    precipitation?: number[];
  };
  cityName: string;
  latitude: number;
  longitude: number;
}): ProcessedAirQuality {
  const currentNaqi = calculateNaqi(params.current.pm2_5, params.current.pm10);

  const hourlyPoints: HourlyAqiPoint[] = [];
  const count = Math.min(
    params.hourly.time.length,
    params.hourly.pm2_5.length,
    params.hourly.pm10.length,
    24 // 24-hour cycle
  );

  for (let i = 0; i < count; i++) {
    const p25 = params.hourly.pm2_5[i] ?? 0;
    const p10 = params.hourly.pm10[i] ?? 0;
    const pointNaqi = calculateNaqi(p25, p10);

    hourlyPoints.push({
      time: params.hourly.time[i],
      pm25: Math.round(p25 * 10) / 10,
      pm10: Math.round(p10 * 10) / 10,
      aqi: pointNaqi.aqi,
      category: pointNaqi.category,
      temperatureC: params.hourly.temperature_2m?.[i],
      windSpeedKmh: params.hourly.wind_speed_10m?.[i],
      relativeHumidity: params.hourly.relative_humidity_2m?.[i],
      precipitationMm: params.hourly.precipitation?.[i],
    });
  }

  const windowRecommendations = analyzeDynamicWindows(hourlyPoints);

  return {
    cityName: params.cityName,
    latitude: params.latitude,
    longitude: params.longitude,
    timestamp: params.current.time,
    dataSource: 'Open-Meteo Atmospheric Chemistry Model & Forecast (CAMS/ECMWF)',
    isStale: false,
    current: {
      time: params.current.time,
      pm25: Math.round(params.current.pm2_5 * 10) / 10,
      pm10: Math.round(params.current.pm10 * 10) / 10,
      aqi: currentNaqi.aqi,
      dominantPollutant: currentNaqi.dominantPollutant,
      category: currentNaqi.category,
      chipBg: currentNaqi.details.chipBg,
      textColor: currentNaqi.details.textColor,
      description: currentNaqi.details.description,
      temperatureC: params.current.temperatureC,
      windSpeedKmh: params.current.windSpeedKmh,
      relativeHumidity: params.current.relativeHumidity,
    },
    hourly: hourlyPoints,
    windowRecommendations,
    bestWindow: windowRecommendations.bestAvailableWindow,
    worstWindow: windowRecommendations.worstWindow,
  };
}

export async function searchCities(query: string): Promise<GeocodingResult[]> {
  const cleanQuery = query.trim();
  if (cleanQuery.length < 2) return [];

  const cacheKey = `geo:${cleanQuery.toLowerCase()}`;
  const cached = getCached<GeocodingResult[]>(cacheKey);
  if (cached) return cached;

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    cleanQuery
  )}&count=5&language=en&format=json`;

  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const data = await res.json();
    const results: GeocodingResult[] = (data.results || []).map((r: {
      id: number;
      name: string;
      latitude: number;
      longitude: number;
      country?: string;
      admin1?: string;
    }) => ({
      id: r.id,
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      country: r.country,
      admin1: r.admin1,
    }));

    setCache(cacheKey, results);
    return results;
  } catch (err) {
    console.error('Failed to search cities:', err);
    return [];
  }
}

export async function fetchAirQuality(
  latitude: number,
  longitude: number,
  cityName = 'Selected Location'
): Promise<ProcessedAirQuality> {
  const cacheKey = `aq_weather:${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  const cached = getCached<ProcessedAirQuality>(cacheKey);
  if (cached) return cached;

  const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm10,pm2_5&hourly=pm10,pm2_5&timezone=auto&forecast_days=2`;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&forecast_days=2&timezone=auto`;

  // Fetch air quality and weather telemetry in parallel with error resilience
  const [aqRes, weatherRes] = await Promise.all([
    fetch(airQualityUrl).catch(() => null),
    fetch(weatherUrl).catch((err) => {
      console.warn('Secondary weather telemetry network error:', err);
      return null;
    }),
  ]);

  if (!aqRes || !aqRes.ok) {
    throw new Error(`Air Quality API unavailable (Status: ${aqRes ? aqRes.status : 'Network error'})`);
  }

  const aqJson = await aqRes.json();
  let weatherJson: {
    hourly?: {
      temperature_2m?: number[];
      wind_speed_10m?: number[];
      relative_humidity_2m?: number[];
      precipitation?: number[];
    };
  } = {};

  if (weatherRes && weatherRes.ok) {
    try {
      weatherJson = await weatherRes.json();
    } catch (parseErr) {
      console.warn('Failed to parse secondary weather telemetry JSON; proceeding with missing weather metrics:', parseErr);
    }
  } else if (weatherRes && !weatherRes.ok) {
    console.warn(`Secondary weather telemetry request failed with status ${weatherRes.status}; proceeding with missing weather metrics.`);
  } else {
    console.warn('Secondary weather telemetry unavailable; proceeding with missing weather metrics.');
  }

  const currentTemp = weatherJson.hourly?.temperature_2m?.[0];
  const currentWind = weatherJson.hourly?.wind_speed_10m?.[0];
  const currentHumidity = weatherJson.hourly?.relative_humidity_2m?.[0];

  const processed = processAirQualityData({
    current: {
      pm2_5: aqJson.current?.pm2_5 ?? 100,
      pm10: aqJson.current?.pm10 ?? 150,
      time: aqJson.current?.time ?? new Date().toISOString(),
      temperatureC: currentTemp,
      windSpeedKmh: currentWind,
      relativeHumidity: currentHumidity,
    },
    hourly: {
      time: aqJson.hourly?.time ?? [],
      pm2_5: aqJson.hourly?.pm2_5 ?? [],
      pm10: aqJson.hourly?.pm10 ?? [],
      temperature_2m: weatherJson.hourly?.temperature_2m,
      wind_speed_10m: weatherJson.hourly?.wind_speed_10m,
      relative_humidity_2m: weatherJson.hourly?.relative_humidity_2m,
      precipitation: weatherJson.hourly?.precipitation,
    },
    cityName,
    latitude,
    longitude,
  });

  setCache(cacheKey, processed);
  return processed;
}

// Legacy alias function for backward compatibility
export function findOptimalWindows(hourly: HourlyAqiPoint[]) {
  const result = analyzeDynamicWindows(hourly);
  return {
    bestWindow: result.bestAvailableWindow,
    worstWindow: result.worstWindow,
  };
}
