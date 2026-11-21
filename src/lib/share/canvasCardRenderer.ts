import { NaqiCategory } from '@/lib/aqi/naqi';

export interface RenderWhatsAppCardOptions {
  cityName: string;
  aqi: number;
  pm25: number;
  category: NaqiCategory;
  categoryMeta: { chipBg: string; textColor: string };
  bestRange: string;
  worstRange: string;
  dominantPollutant: 'PM2.5' | 'PM10';
  dataSource?: string;
  noSafeWindowAvailable?: boolean;
}

/**
 * Renders the high-resolution (800x1050) WhatsApp smog protocol card onto an HTMLCanvasElement
 * and returns the image data URL in PNG format.
 *
 * Preserves high-contrast typography, CPCB NAQI color standards, and Devanagari/Kannada font rendering.
 */
export function renderWhatsAppCardCanvas(
  canvas: HTMLCanvasElement,
  options: RenderWhatsAppCardOptions
): string {
  const {
    cityName,
    aqi,
    pm25,
    category,
    categoryMeta,
    bestRange,
    worstRange,
    dominantPollutant,
    dataSource = 'Open-Meteo Model Forecast (CAMS/ECMWF)',
    noSafeWindowAvailable = false,
  } = options;

  const width = 800;
  const height = 1050;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const FONT_SANS = "'Noto Sans Devanagari', 'Noto Sans Kannada', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const FONT_MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

  // Background: Mist Slate
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, width, height);

  // Top Accent Brand Banner
  ctx.fillStyle = '#0E7490';
  ctx.fillRect(0, 0, width, 14);

  // Header Tag
  ctx.fillStyle = '#0E7490';
  ctx.font = `bold 16px ${FONT_SANS}`;
  ctx.fillText('SHWAAS (श्वास) • हर सांस का हिसाब', 50, 55);

  // Date & Time
  ctx.fillStyle = '#475569';
  ctx.font = `14px ${FONT_SANS}`;
  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  ctx.fillText(`${dateStr} • ${timeStr}`, 50, 80);

  // City Title
  ctx.fillStyle = '#0F172A';
  ctx.font = `bold 36px ${FONT_SANS}`;
  ctx.fillText(cityName, 50, 125);

  // Big AQI Box Card
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(50, 150, 700, 150, 16);
  ctx.fill();
  ctx.stroke();

  // Inside AQI Box: Big Number
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 64px serif';
  ctx.fillText(String(aqi), 80, 230);

  ctx.fillStyle = '#475569';
  ctx.font = `bold 13px ${FONT_SANS}`;
  ctx.fillText('National AQI', 80, 255);

  // Category Chip Fill inside box
  ctx.fillStyle = categoryMeta.chipBg;
  ctx.beginPath();
  ctx.roundRect(360, 185, 350, 60, 12);
  ctx.fill();

  ctx.fillStyle = categoryMeta.textColor;
  ctx.font = `bold 22px ${FONT_SANS}`;
  ctx.fillText(`${category}`, 385, 223);

  ctx.fillStyle = '#334155';
  ctx.font = `14px ${FONT_MONO}`;
  ctx.fillText(`PM2.5: ${pm25} µg/m³ • Driver: ${dominantPollutant}`, 360, 275);

  // Window Cards: Best Window
  ctx.fillStyle = noSafeWindowAvailable ? '#FFFBEB' : '#F0FDF4';
  ctx.strokeStyle = noSafeWindowAvailable ? '#FDE68A' : '#BBF7D0';
  ctx.beginPath();
  ctx.roundRect(50, 320, 700, 110, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = noSafeWindowAvailable ? '#B45309' : '#15803D';
  ctx.font = `bold 16px ${FONT_SANS}`;
  ctx.fillText(
    (noSafeWindowAvailable ? 'Least-polluted window: ' : 'Cleanest activity window: ') + bestRange,
    75,
    355
  );
  ctx.fillStyle = noSafeWindowAvailable ? '#78350F' : '#166534';
  ctx.font = `14px ${FONT_SANS}`;
  ctx.fillText(
    noSafeWindowAvailable
      ? 'All hours are elevated (>200 AQI). Step out only if mandatory; keep visits brief.'
      : 'Safest afternoon period for school runs, groceries, and 15-min home ventilation flush.',
    75,
    390
  );

  // Worst Window
  ctx.fillStyle = '#FEF2F2';
  ctx.strokeStyle = '#FECACA';
  ctx.beginPath();
  ctx.roundRect(50, 450, 700, 110, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#DC2626';
  ctx.font = `bold 16px ${FONT_SANS}`;
  ctx.fillText('Peak inversion smog trap: ' + worstRange, 75, 485);
  ctx.fillStyle = '#991B1B';
  ctx.font = `14px ${FONT_SANS}`;
  ctx.fillText(
    'Ground exhaust trapped by cool air. Strictly avoid morning jogging and outdoor physical play.',
    75,
    520
  );

  // 3 Actionable Family Rules Card
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#CBD5E1';
  ctx.beginPath();
  ctx.roundRect(50, 580, 700, 290, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0F172A';
  ctx.font = `bold 20px ${FONT_SANS}`;
  ctx.fillText("Today's 3 Family Defense Rules", 75, 620);

  ctx.fillStyle = '#1E293B';
  ctx.font = `bold 15px ${FONT_SANS}`;
  ctx.fillText('1. Commute & Transit:', 75, 655);
  ctx.fillStyle = '#475569';
  ctx.font = `14px ${FONT_SANS}`;
  ctx.fillText('Wear certified N95 respirators. Avoid open two-wheelers during morning inversion hours.', 95, 680);

  ctx.fillStyle = '#1E293B';
  ctx.font = `bold 15px ${FONT_SANS}`;
  ctx.fillText('2. Home Sealing & Cleaning:', 75, 720);
  ctx.fillStyle = '#475569';
  ctx.font = `14px ${FONT_SANS}`;
  ctx.fillText('Keep bedroom windows sealed. Wet-mop floors rather than dry sweeping to prevent dust plumes.', 95, 745);

  ctx.fillStyle = '#1E293B';
  ctx.font = `bold 15px ${FONT_SANS}`;
  ctx.fillText('3. Vulnerable Care (Kids & Seniors):', 75, 785);
  ctx.fillStyle = '#475569';
  ctx.font = `14px ${FONT_SANS}`;
  ctx.fillText('Keep infants and elders in purified clean-rooms with HEPA or DIY box-fan filtration.', 95, 810);

  // Footer & Data Provenance
  ctx.fillStyle = '#475569';
  ctx.font = `13px ${FONT_SANS}`;
  ctx.fillText(`Telemetry: ${dataSource} • India CPCB NAQI Standard`, 50, 915);
  ctx.fillText('Shwaas (श्वास) • हर सांस का हिसाब • Decision-Support (Not Medical Advice) • https://shwaas-alpha.vercel.app/', 50, 940);

  return canvas.toDataURL('image/png');
}
