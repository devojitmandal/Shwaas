'use client';

import { useRef, useState } from 'react';
import { NaqiCategory, getNaqiCategory } from '@/lib/aqi/naqi';
import { OutdoorWindow } from '@/lib/api/openMeteo';
import { Download, Check, MessageCircle, Copy } from 'lucide-react';

interface WhatsAppShareCardProps {
  cityName: string;
  aqi: number;
  pm25: number;
  category: NaqiCategory;
  bestWindow: OutdoorWindow;
  worstWindow: OutdoorWindow;
  dominantPollutant: 'PM2.5' | 'PM10';
  dataSource?: string;
  noSafeWindowAvailable?: boolean;
  alertHeadline?: string;
}

export default function WhatsAppShareCard({
  cityName,
  aqi,
  pm25,
  category,
  bestWindow,
  worstWindow,
  dominantPollutant,
  dataSource = 'Open-Meteo Model Forecast (CAMS/ECMWF)',
  noSafeWindowAvailable = false,
}: WhatsAppShareCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const categoryMeta = getNaqiCategory(aqi);

  const formatWindow = (start: string, end: string) => {
    try {
      const s = new Date(start).toLocaleTimeString([], { hour: 'numeric', hour12: true });
      const e = new Date(end).toLocaleTimeString([], { hour: 'numeric', hour12: true });
      return `${s} – ${e}`;
    } catch {
      return `${start.substring(11, 16)} – ${end.substring(11, 16)}`;
    }
  };

  const bestRange = formatWindow(bestWindow.startTime, bestWindow.endTime);
  const worstRange = formatWindow(worstWindow.startTime, worstWindow.endTime);

  const shareSummaryText = `🌫️ *Shwaas (श्वास) Smog Protocol — ${cityName}*
🚨 *National AQI:* ${aqi} (${category}) | PM2.5: ${pm25} µg/m³
📡 *Data Source:* ${dataSource}

${
  noSafeWindowAvailable
    ? `⚠️ *Critical Alert:* No safe outdoor window exists today (all hours >200 AQI). Least polluted: ${bestRange}.`
    : `✅ *Best Available Window:* ${bestRange} (Safest time for mandatory errands & 15-min air flush)`
}

⛔ *Peak Inversion Smog Trap:* ${worstRange}
(Ground-level exhaust trapped. Keep kids, seniors & asthmatics strictly indoors!)

🛡️ *3 Actionable Family Rules:*
1. Commute: Wear certified N95; avoid open two-wheelers.
2. Home: Keep windows sealed until 1 PM; wet-mop floors (no dry sweeping).
3. Society: Urge RWA to provide electric heaters to night guards to eliminate open waste fires.

*India CPCB NAQI Standard • shwaas.in*`;

  // Draw high-res canvas image for download and sharing
  const generateCanvasImage = (): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '';

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
    ctx.fillText('Shwaas (श्वास) • हर सांस का हिसाब • Decision-Support (Not Medical Advice) • shwaas.in', 50, 940);

    return canvas.toDataURL('image/png');
  };

  const handleDownloadImage = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const dataUrl = generateCanvasImage();
      if (!dataUrl) {
        setIsGenerating(false);
        return;
      }
      const link = document.createElement('a');
      link.download = `shwaas-smog-alert-${cityName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
      setIsGenerating(false);
    }, 100);
  };

  const handleShareWhatsApp = async () => {
    if (navigator.share) {
      try {
        const dataUrl = generateCanvasImage();
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `shwaas-${cityName}.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Shwaas Smog Alert: ${cityName}`,
            text: shareSummaryText,
            files: [file],
          });
          return;
        }
      } catch (err) {
        console.warn('Native file share skipped, falling back to text URL:', err);
      }
    }

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareSummaryText)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyText = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareSummaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section
      aria-labelledby="whatsapp-card-heading"
      className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6"
    >
      {/* Hidden canvas for high-res PNG export */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[13px] tracking-[0.04em] font-semibold uppercase text-teal-800">
            <MessageCircle className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <span id="whatsapp-card-heading">Family &amp; Society WhatsApp Card</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            One-Tap Visual Share for WhatsApp
          </h2>
          <p className="text-base text-slate-700 max-w-[65ch] leading-relaxed">
            Generate an image of today&apos;s plan to share with family groups, school parent chats, and apartment society committees.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleCopyText}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors shadow-2xs min-h-[44px] focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:outline-hidden"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
            <span>{copied ? 'Copied Text' : 'Copy Text'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isGenerating}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors shadow-2xs min-h-[44px] focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:outline-hidden disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-teal-800" />
            <span>{isGenerating ? 'Rendering...' : 'Download Image'}</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-hidden"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Share on WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Live Card Visual Preview */}
      <div className="p-6 sm:p-7 rounded-2xl bg-slate-50 border border-slate-200 max-w-xl mx-auto shadow-xs text-slate-900 space-y-4">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <span className="text-xs font-bold tracking-wider text-teal-800 uppercase block">
              Shwaas Daily Protocol
            </span>
            <span className="text-xl font-bold text-slate-900">{cityName}</span>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium text-slate-600 block">
              {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
            </span>
            <span className="text-xs text-slate-600 block">Model Forecast</span>
          </div>
        </div>

        {/* Big AQI Callout Box */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-600 block">
              National AQI
            </span>
            <span className="text-4xl font-serif font-bold text-slate-950">
              {aqi}
            </span>
          </div>
          <div
            className="px-4 py-2 rounded-xl text-sm font-semibold shadow-2xs"
            style={{ backgroundColor: categoryMeta.chipBg, color: categoryMeta.textColor }}
          >
            {category}
          </div>
        </div>

        {/* Windows Summary */}
        <div className="space-y-2 text-sm text-slate-800">
          <div className="p-3.5 rounded-xl bg-white border border-emerald-200 flex items-start gap-2.5">
            <span className="text-emerald-700 font-bold shrink-0">✓</span>
            <div>
              <span className="font-bold text-emerald-950 block">
                {noSafeWindowAvailable ? 'Least-polluted window: ' : 'Cleanest activity window: '}
                {bestRange}
              </span>
              <span className="text-xs text-slate-600 block mt-0.5">
                {bestWindow.advisory}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-rose-200 flex items-start gap-2.5">
            <span className="text-rose-700 font-bold shrink-0">✕</span>
            <div>
              <span className="font-bold text-rose-950 block">
                Peak inversion smog trap: {worstRange}
              </span>
              <span className="text-xs text-slate-600 block mt-0.5">
                {worstWindow.advisory}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
