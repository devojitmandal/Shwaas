import { describe, it, expect } from 'vitest';
import {
  calculateSubIndex,
  calculateNaqi,
  getNaqiCategory,
  PM25_BREAKPOINTS,
  PM10_BREAKPOINTS,
} from './naqi';

describe('NAQI Sub-Index Calculation (CPCB Breakpoints)', () => {
  it('calculates PM2.5 sub-index accurately across all categories', () => {
    // Good: 0 - 30 -> 0 - 50
    expect(calculateSubIndex(0, PM25_BREAKPOINTS)).toBe(0);
    expect(calculateSubIndex(15, PM25_BREAKPOINTS)).toBe(25);
    expect(calculateSubIndex(30, PM25_BREAKPOINTS)).toBe(50);

    // Satisfactory: 31 - 60 -> 51 - 100
    expect(calculateSubIndex(31, PM25_BREAKPOINTS)).toBe(51);
    expect(calculateSubIndex(60, PM25_BREAKPOINTS)).toBe(100);

    // Moderate: 61 - 90 -> 101 - 200
    expect(calculateSubIndex(61, PM25_BREAKPOINTS)).toBe(101);
    expect(calculateSubIndex(90, PM25_BREAKPOINTS)).toBe(200);

    // Poor: 91 - 120 -> 201 - 300
    expect(calculateSubIndex(91, PM25_BREAKPOINTS)).toBe(201);
    expect(calculateSubIndex(120, PM25_BREAKPOINTS)).toBe(300);

    // Very Poor: 121 - 250 -> 301 - 400
    expect(calculateSubIndex(121, PM25_BREAKPOINTS)).toBe(301);
    expect(calculateSubIndex(250, PM25_BREAKPOINTS)).toBe(400);

    // Severe: 251 - 380 (or higher) -> 401 - 500
    expect(calculateSubIndex(251, PM25_BREAKPOINTS)).toBe(401);
    expect(calculateSubIndex(380, PM25_BREAKPOINTS)).toBe(500);
  });

  it('caps the sub-index at 500 when concentration exceeds severe upper limit', () => {
    expect(calculateSubIndex(450, PM25_BREAKPOINTS)).toBe(500);
    expect(calculateSubIndex(800, PM25_BREAKPOINTS)).toBe(500);
    expect(calculateSubIndex(999, PM10_BREAKPOINTS)).toBe(500);
  });

  it('calculates PM10 sub-index accurately across all categories', () => {
    // Good: 0 - 50 -> 0 - 50
    expect(calculateSubIndex(0, PM10_BREAKPOINTS)).toBe(0);
    expect(calculateSubIndex(50, PM10_BREAKPOINTS)).toBe(50);

    // Satisfactory: 51 - 100 -> 51 - 100
    expect(calculateSubIndex(75, PM10_BREAKPOINTS)).toBe(75);
    expect(calculateSubIndex(100, PM10_BREAKPOINTS)).toBe(100);

    // Moderate: 101 - 250 -> 101 - 200
    expect(calculateSubIndex(250, PM10_BREAKPOINTS)).toBe(200);

    // Poor: 251 - 350 -> 201 - 300
    expect(calculateSubIndex(350, PM10_BREAKPOINTS)).toBe(300);

    // Very Poor: 351 - 430 -> 301 - 400
    expect(calculateSubIndex(430, PM10_BREAKPOINTS)).toBe(400);

    // Severe: 431 - 510 -> 401 - 500
    expect(calculateSubIndex(510, PM10_BREAKPOINTS)).toBe(500);
  });

  it('handles negative or invalid concentrations gracefully', () => {
    expect(calculateSubIndex(-10, PM25_BREAKPOINTS)).toBe(0);
  });
});

describe('Overall NAQI and Category Classification', () => {
  it('takes the higher of PM2.5 and PM10 sub-indices', () => {
    // PM2.5 = 60 (AQI 100), PM10 = 250 (AQI 200) -> NAQI should be 200
    const result = calculateNaqi(60, 250);
    expect(result.aqi).toBe(200);
    expect(result.dominantPollutant).toBe('PM10');
    expect(result.category).toBe('Moderate');

    // PM2.5 = 250 (AQI 400), PM10 = 100 (AQI 100) -> NAQI should be 400
    const result2 = calculateNaqi(250, 100);
    expect(result2.aqi).toBe(400);
    expect(result2.dominantPollutant).toBe('PM2.5');
    expect(result2.category).toBe('Very Poor');
  });

  it('correctly categorizes every NAQI band', () => {
    expect(getNaqiCategory(0).category).toBe('Good');
    expect(getNaqiCategory(50).category).toBe('Good');
    expect(getNaqiCategory(51).category).toBe('Satisfactory');
    expect(getNaqiCategory(100).category).toBe('Satisfactory');
    expect(getNaqiCategory(101).category).toBe('Moderate');
    expect(getNaqiCategory(200).category).toBe('Moderate');
    expect(getNaqiCategory(201).category).toBe('Poor');
    expect(getNaqiCategory(300).category).toBe('Poor');
    expect(getNaqiCategory(301).category).toBe('Very Poor');
    expect(getNaqiCategory(400).category).toBe('Very Poor');
    expect(getNaqiCategory(401).category).toBe('Severe');
    expect(getNaqiCategory(500).category).toBe('Severe');
  });

  it('provides chip fill colors with verified AA contrast text', () => {
    const good = getNaqiCategory(30);
    expect(good.chipBg).toBe('#15803D');
    expect(good.textColor).toBe('#FFFFFF');

    const mod = getNaqiCategory(150);
    expect(mod.chipBg).toBe('#D97706');
    expect(mod.textColor).toBe('#0F172A'); // dark text on amber passes contrast

    const severe = getNaqiCategory(450);
    expect(severe.chipBg).toBe('#7F1D1D');
    expect(severe.textColor).toBe('#FFFFFF');
  });
});
