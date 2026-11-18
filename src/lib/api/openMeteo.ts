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
}

export interface OutdoorWindow {
  startTime: string;
  endTime: string;
  averageAqi: number;
  category: NaqiCategory;
  advisory: string;
}

export interface ProcessedAirQuality {
  cityName: string;
  latitude: number;
  longitude: number;
  timestamp: string;
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
  };
  hourly: HourlyAqiPoint[];
  bestWindow: OutdoorWindow;
  worstWindow: OutdoorWindow;
}

// In-memory cache with 15-minute TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 15 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function findOptimalWindows(hourly: HourlyAqiPoint[]): {
  bestWindow: OutdoorWindow;
  worstWindow: OutdoorWindow;
} {
  if (hourly.length === 0) {
    const fallbackWindow: OutdoorWindow = {
      startTime: '12:00',
      endTime: '14:00',
      averageAqi: 150,
      category: 'Moderate',
      advisory: 'No hourly forecast available.',
    };
    return { bestWindow: fallbackWindow, worstWindow: fallbackWindow };
  }

  // Look at sliding windows of 2 to 3 consecutive hours
  const windowSize = Math.min(3, hourly.length);
  let minAqiSum = Infinity;
  let maxAqiSum = -Infinity;
  let bestIdx = 0;
  let worstIdx = 0;

  for (let i = 0; i <= hourly.length - windowSize; i++) {
    let sum = 0;
    for (let j = 0; j < windowSize; j++) {
      sum += hourly[i + j].aqi;
    }
    if (sum < minAqiSum) {
      minAqiSum = sum;
      bestIdx = i;
    }
    if (sum > maxAqiSum) {
      maxAqiSum = sum;
      worstIdx = i;
    }
  }

  const bestAvg = Math.round(minAqiSum / windowSize);
  const worstAvg = Math.round(maxAqiSum / windowSize);

  const bestCategory = getNaqiCategory(bestAvg).category;
  const worstCategory = getNaqiCategory(worstAvg).category;

  const bestStart = hourly[bestIdx].time;
  const bestEnd = hourly[Math.min(hourly.length - 1, bestIdx + windowSize - 1)].time;

  const worstStart = hourly[worstIdx].time;
  const worstEnd = hourly[Math.min(hourly.length - 1, worstIdx + windowSize - 1)].time;

  return {
    bestWindow: {
      startTime: bestStart,
      endTime: bestEnd,
      averageAqi: bestAvg,
      category: bestCategory,
      advisory: `Lowest smog density period. Conduct required outdoor chores or brief ventilation.`,
    },
    worstWindow: {
      startTime: worstStart,
      endTime: worstEnd,
      averageAqi: worstAvg,
      category: worstCategory,
      advisory: `Peak thermal inversion trap. Strictly restrict all outdoor activities; keep doors/windows sealed.`,
    },
  };
}

export function processAirQualityData(params: {
  current: { pm2_5: number; pm10: number; time: string };
  hourly: { time: string[]; pm2_5: number[]; pm10: number[] };
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
    24 // Focus on 24-hour forecast
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
    });
  }

  const { bestWindow, worstWindow } = findOptimalWindows(hourlyPoints);

  return {
    cityName: params.cityName,
    latitude: params.latitude,
    longitude: params.longitude,
    timestamp: params.current.time,
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
    },
    hourly: hourlyPoints,
    bestWindow,
    worstWindow,
  };
}

/**
 * Searches cities using Open-Meteo free geocoding API with in-memory caching.
 */
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
    const results: GeocodingResult[] = (data.results || []).map((r: any) => ({
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

/**
 * Fetches air quality data for coordinates from Open-Meteo.
 */
export async function fetchAirQuality(
  latitude: number,
  longitude: number,
  cityName = 'Selected Location'
): Promise<ProcessedAirQuality> {
  const cacheKey = `aq:${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  const cached = getCached<ProcessedAirQuality>(cacheKey);
  if (cached) return cached;

  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm10,pm2_5&hourly=pm10,pm2_5&timezone=auto&forecast_days=2`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo API returned status ${res.status}`);
  }

  const json = await res.json();
  const processed = processAirQualityData({
    current: json.current,
    hourly: json.hourly,
    cityName,
    latitude,
    longitude,
  });

  setCache(cacheKey, processed);
  return processed;
}
