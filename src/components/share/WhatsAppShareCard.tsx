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
}

export default function WhatsAppShareCard({
  cityName,
  aqi,
  pm25,
  category,
  bestWindow,
  worstWindow,
  dominantPollutant,
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

  const shareSummaryText = `🌫️ *AirWise Smog Alert — ${cityName}*
🚨 *National AQI:* ${aqi} (${category}) | PM2.5: ${pm25} µg/m³

✅ *Best Outdoor Window:* ${bestRange}
(Safest time for mandatory errands, school sports or 15-min air flush)

⛔ *Peak Inversion Smog Trap:* ${worstRange}
(Ground-level exhaust trapped. Keep kids, seniors & asthmatics strictly indoors!)

🛡️ *3 Golden Rules for Today:*
1. Morning Commute: Wear snug N95 mask; avoid open two-wheelers.
2. Home: Windows sealed tight; wet-mop floors (no dry sweeping).
3. Society: Urge RWA to provide electric heaters to night guards to ban open trash fires.

*Calculated via India CPCB Standards • airwise.in*`;

  // Draw high-res canvas image for download and sharing
  const generateCanvasImage = (): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '';

    const width = 800;
    const height = 1000;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Background: Mist Slate
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, width, height);

    // Top Accent Brand Banner
    ctx.fillStyle = '#0E7490';
    ctx.fillRect(0, 0, width, 14);

    // Header Tag
    ctx.fillStyle = '#0E7490';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('AIRWISE • URBAN CLEAN AIR GUARD', 50, 60);

    // Date
    ctx.fillStyle = '#64748B';
    ctx.font = '14px sans-serif';
    const dateStr = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    ctx.fillText(dateStr, 50, 85);

    // City Title
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 36px serif';
    ctx.fillText(cityName, 50, 130);

    // Big AQI Box Card
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(50, 160, 700, 150, 16);
    ctx.fill();
    ctx.stroke();

    // Inside AQI Box: Big Number
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 64px serif';
    ctx.fillText(String(aqi), 80, 240);

    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('NATIONAL AQI (CPCB)', 80, 265);

    // Category Chip Fill inside box
    ctx.fillStyle = categoryMeta.chipBg;
    ctx.beginPath();
    ctx.roundRect(360, 195, 350, 60, 12);
    ctx.fill();

    ctx.fillStyle = categoryMeta.textColor;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`${category.toUpperCase()}`, 385, 233);

    ctx.fillStyle = '#475569';
    ctx.font = '14px sans-serif';
    ctx.fillText(`PM2.5: ${pm25} µg/m³ • Driver: ${dominantPollutant}`, 360, 285);

    // Window Cards: Best Window
    ctx.fillStyle = '#F0FDF4';
    ctx.strokeStyle = '#BBF7D0';
    ctx.beginPath();
    ctx.roundRect(50, 335, 700, 105, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#15803D';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('🟢 OPTIMAL OUTDOOR WINDOW: ' + bestRange, 75, 370);
    ctx.fillStyle = '#166534';
    ctx.font = '14px sans-serif';
    ctx.fillText('Safest afternoon period for school runs, groceries, and 15-min home ventilation.', 75, 405);

    // Worst Window
    ctx.fillStyle = '#FEF2F2';
    ctx.strokeStyle = '#FECACA';
    ctx.beginPath();
    ctx.roundRect(50, 460, 700, 105, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#DC2626';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('🔴 PEAK INVERSION SMOG TRAP: ' + worstRange, 75, 495);
    ctx.fillStyle = '#991B1B';
    ctx.font = '14px sans-serif';
    ctx.fillText('Ground exhaust trapped. Strictly avoid morning jogs and outdoor physical play.', 75, 530);

    // 3 Actionable Family Rules Card
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#CBD5E1';
    ctx.beginPath();
    ctx.roundRect(50, 585, 700, 280, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 18px serif';
    ctx.fillText("TODAY'S 3 FAMILY DEFENSE RULES", 75, 625);

    ctx.fillStyle = '#1E293B';
    ctx.font = '15px sans-serif';
    ctx.fillText('1. Commute & Transit:', 75, 665);
    ctx.fillStyle = '#475569';
    ctx.font = '14px sans-serif';
    ctx.fillText('Wear certified N95 respirators. Avoid open two-wheelers during inversion hours.', 95, 690);

    ctx.fillStyle = '#1E293B';
    ctx.font = '15px sans-serif';
    ctx.fillText('2. Home Sealing & Cleaning:', 75, 730);
    ctx.fillStyle = '#475569';
    ctx.font = '14px sans-serif';
    ctx.fillText('Seal bedroom windows. Use wet-mopping rather than dry brooms to avoid dust plumes.', 95, 755);

    ctx.fillStyle = '#1E293B';
    ctx.font = '15px sans-serif';
    ctx.fillText('3. Vulnerable Care (Kids & Seniors):', 75, 795);
    ctx.fillStyle = '#475569';
    ctx.font = '14px sans-serif';
    ctx.fillText('Keep infants and elders in purified clean-rooms with HEPA or DIY box-fan filtration.', 95, 820);

    // Footer Branding
    ctx.fillStyle = '#64748B';
    ctx.font = '12px sans-serif';
    ctx.fillText('Generated by AirWise • India CPCB Standards • Not Medical Advice • airwise.in', 50, 930);

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
      link.download = `airwise-smog-alert-${cityName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
      setIsGenerating(false);
    }, 100);
  };

  const handleShareWhatsApp = async () => {
    // If mobile Web Share API supports file sharing, generate blob and share native image!
    if (navigator.share) {
      try {
        const dataUrl = generateCanvasImage();
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `airwise-${cityName}.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `AirWise Smog Alert: ${cityName}`,
            text: shareSummaryText,
            files: [file],
          });
          return;
        }
      } catch (err) {
        console.warn('Native file share skipped, falling back to text URL:', err);
      }
    }

    // Direct WhatsApp Web / App intent URL
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
      className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6"
    >
      {/* Hidden canvas for high-res PNG export */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800">
            <MessageCircle className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <span id="whatsapp-card-heading">Family & Society WhatsApp Card</span>
          </div>
          <h3 className="mt-1 text-2xl font-serif font-bold text-slate-900 tracking-tight">
            One-Tap Visual Share for WhatsApp
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-xl leading-relaxed">
            Generate a clean, high-resolution visual card of today&apos;s smog plan to share with family groups, school parent chats, and apartment society committees.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleCopyText}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs focus-visible:outline-2 focus-visible:outline-teal-800"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
            <span>{copied ? 'Copied Text' : 'Copy Text'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs focus-visible:outline-2 focus-visible:outline-teal-800 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-teal-800" />
            <span>{isGenerating ? 'Rendering...' : 'Download Image'}</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors focus-visible:outline-2 focus-visible:outline-emerald-600"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Share on WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Live Card Visual Preview */}
      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 max-w-lg mx-auto shadow-xs text-slate-900 space-y-4">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-teal-800 uppercase block">
              AirWise Daily Protocol
            </span>
            <span className="text-lg font-serif font-bold text-slate-900">{cityName}</span>
          </div>
          <span className="text-[11px] text-slate-500">
            {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Big AQI Callout inside Card */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              National AQI
            </span>
            <span className="text-3xl font-serif font-bold text-slate-950">{aqi}</span>
          </div>

          <div
            className="px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{
              backgroundColor: categoryMeta.chipBg,
              color: categoryMeta.textColor,
            }}
          >
            {category} (PM2.5: {pm25} µg/m³)
          </div>
        </div>

        {/* Windows */}
        <div className="space-y-2 text-xs">
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950">
            <span className="font-bold block">🟢 Best Outdoor Window: {bestRange}</span>
            <span className="text-[11px] text-emerald-800">Safest time for school transit, errands & 15-min home ventilation.</span>
          </div>

          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-950">
            <span className="font-bold block">🔴 Inversion Smog Trap: {worstRange}</span>
            <span className="text-[11px] text-rose-800">Peak ground pollutants trapped. Keep kids & elders strictly indoors.</span>
          </div>
        </div>

        {/* 3 Core Rules */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5">
          <span className="font-serif font-bold text-slate-900 block text-xs">
            3 Golden Rules for Today:
          </span>
          <p className="text-[11px] text-slate-700">
            <strong>1. Commute:</strong> Wear certified N95; avoid open two-wheelers.
          </p>
          <p className="text-[11px] text-slate-700">
            <strong>2. Home:</strong> Keep windows sealed until 1 PM; wet-mop floors.
          </p>
          <p className="text-[11px] text-slate-700">
            <strong>3. Society:</strong> Give electric heaters to night guards to eliminate open waste fires.
          </p>
        </div>

        <div className="text-[10px] text-slate-400 text-center pt-1">
          India CPCB NAQI Standard • Decision-Support (Not Medical Advice)
        </div>
      </div>
    </section>
  );
}
