'use client';

import { useRef, useState } from 'react';
import { NaqiCategory, getNaqiCategory } from '@/lib/aqi/naqi';
import { OutdoorWindow } from '@/lib/api/openMeteo';
import { Download, Check, MessageCircle, Copy } from 'lucide-react';
import { renderWhatsAppCardCanvas } from '@/lib/share/canvasCardRenderer';

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

*India CPCB NAQI Standard • https://shwaas-alpha.vercel.app/*`;

  // Draw high-res canvas image for download and sharing
  const generateCanvasImage = (): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '';

    return renderWhatsAppCardCanvas(canvas, {
      cityName,
      aqi,
      pm25,
      category,
      categoryMeta,
      bestRange,
      worstRange,
      dominantPollutant,
      dataSource,
      noSafeWindowAvailable,
    });
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
