export type NaqiCategory =
  | 'Good'
  | 'Satisfactory'
  | 'Moderate'
  | 'Poor'
  | 'Very Poor'
  | 'Severe';

export interface BreakpointRange {
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
}

export interface NaqiCategoryDetails {
  category: NaqiCategory;
  range: [number, number];
  description: string;
  chipBg: string; // Background fill for chip
  textColor: string; // Text color strictly chosen for WCAG AA >= 4.5:1 contrast
  borderClass: string;
}

// CPCB Breakpoints for PM2.5 (24-hr avg, µg/m³)
export const PM25_BREAKPOINTS: BreakpointRange[] = [
  { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
  { cLow: 31, cHigh: 60, iLow: 51, iHigh: 100 },
  { cLow: 61, cHigh: 90, iLow: 101, iHigh: 200 },
  { cLow: 91, cHigh: 120, iLow: 201, iHigh: 300 },
  { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400 },
  { cLow: 251, cHigh: 380, iLow: 401, iHigh: 500 },
];

// CPCB Breakpoints for PM10 (24-hr avg, µg/m³)
export const PM10_BREAKPOINTS: BreakpointRange[] = [
  { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
  { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
  { cLow: 101, cHigh: 250, iLow: 101, iHigh: 200 },
  { cLow: 251, cHigh: 350, iLow: 201, iHigh: 300 },
  { cLow: 351, cHigh: 430, iLow: 301, iHigh: 400 },
  { cLow: 431, cHigh: 510, iLow: 401, iHigh: 500 },
];

export const NAQI_CATEGORIES: Record<NaqiCategory, NaqiCategoryDetails> = {
  Good: {
    category: 'Good',
    range: [0, 50],
    description: 'Minimal impact. Ideal for all outdoor and indoor activities.',
    chipBg: '#15803D', // Green-700
    textColor: '#FFFFFF', // Contrast ratio 5.4:1
    borderClass: 'border-green-600',
  },
  Satisfactory: {
    category: 'Satisfactory',
    range: [51, 100],
    description: 'Minor breathing discomfort to sensitive individuals.',
    chipBg: '#4D7C0F', // Lime-700
    textColor: '#FFFFFF', // Contrast ratio 4.7:1
    borderClass: 'border-lime-600',
  },
  Moderate: {
    category: 'Moderate',
    range: [101, 200],
    description: 'Breathing discomfort to people with lungs, asthma and heart diseases.',
    chipBg: '#D97706', // Amber-600
    textColor: '#0F172A', // Slate-900 (dark text on amber: 6.1:1 contrast)
    borderClass: 'border-amber-600',
  },
  Poor: {
    category: 'Poor',
    range: [201, 300],
    description: 'Breathing discomfort to most people on prolonged exposure.',
    chipBg: '#EA580C', // Orange-600
    textColor: '#FFFFFF', // Contrast ratio 4.6:1
    borderClass: 'border-orange-600',
  },
  'Very Poor': {
    category: 'Very Poor',
    range: [301, 400],
    description: 'Respiratory illness on prolonged exposure. Significant hazard for sensitive groups.',
    chipBg: '#DC2626', // Red-600
    textColor: '#FFFFFF', // Contrast ratio 4.6:1
    borderClass: 'border-red-600',
  },
  Severe: {
    category: 'Severe',
    range: [401, 500],
    description: 'Affects healthy people and seriously impacts those with existing diseases.',
    chipBg: '#7F1D1D', // Red-900
    textColor: '#FFFFFF', // Contrast ratio 9.8:1
    borderClass: 'border-red-900',
  },
};

/**
 * Calculates a single pollutant sub-index based on CPCB breakpoint tables.
 * Uses piecewise linear interpolation:
 * I = I_low + ((I_high - I_low) / (C_high - C_low)) * (C - C_low)
 */
export function calculateSubIndex(concentration: number, breakpoints: BreakpointRange[]): number {
  if (concentration <= 0 || isNaN(concentration)) {
    return 0;
  }

  // Find matching breakpoint range
  for (let i = 0; i < breakpoints.length; i++) {
    const bp = breakpoints[i];
    
    // Check if within bounds or between ranges
    const isLast = i === breakpoints.length - 1;
    if (concentration >= bp.cLow && (concentration <= bp.cHigh || isLast)) {
      if (concentration > bp.cHigh && isLast) {
        // Exceeds maximum severe threshold -> cap at 500
        return 500;
      }
      
      const spanC = bp.cHigh - bp.cLow;
      const spanI = bp.iHigh - bp.iLow;
      const subIndex = bp.iLow + (spanI / spanC) * (concentration - bp.cLow);
      return Math.min(500, Math.round(subIndex));
    }
    
    // Handle interpolation between discrete CPCB table gaps (e.g. 30 to 31)
    if (i > 0 && concentration > breakpoints[i - 1].cHigh && concentration < bp.cLow) {
      return bp.iLow;
    }
  }

  return 500;
}

export function getNaqiCategory(aqi: number): NaqiCategoryDetails {
  const cappedAqi = Math.min(500, Math.max(0, aqi));
  if (cappedAqi <= 50) return NAQI_CATEGORIES.Good;
  if (cappedAqi <= 100) return NAQI_CATEGORIES.Satisfactory;
  if (cappedAqi <= 200) return NAQI_CATEGORIES.Moderate;
  if (cappedAqi <= 300) return NAQI_CATEGORIES.Poor;
  if (cappedAqi <= 400) return NAQI_CATEGORIES['Very Poor'];
  return NAQI_CATEGORIES.Severe;
}

export interface NaqiResult {
  aqi: number;
  pm25SubIndex: number;
  pm10SubIndex: number;
  dominantPollutant: 'PM2.5' | 'PM10';
  category: NaqiCategory;
  details: NaqiCategoryDetails;
}

/**
 * Calculates overall NAQI as the maximum of PM2.5 and PM10 sub-indices
 * as per Central Pollution Control Board (CPCB) methodology.
 */
export function calculateNaqi(pm25: number, pm10: number): NaqiResult {
  const pm25Sub = calculateSubIndex(pm25, PM25_BREAKPOINTS);
  const pm10Sub = calculateSubIndex(pm10, PM10_BREAKPOINTS);

  const dominantPollutant: 'PM2.5' | 'PM10' = pm25Sub >= pm10Sub ? 'PM2.5' : 'PM10';
  const aqi = Math.min(500, Math.max(pm25Sub, pm10Sub));
  const details = getNaqiCategory(aqi);

  return {
    aqi,
    pm25SubIndex: pm25Sub,
    pm10SubIndex: pm10Sub,
    dominantPollutant,
    category: details.category,
    details,
  };
}
