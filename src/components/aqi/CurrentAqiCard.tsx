'use client';

import { NaqiCategory } from '@/lib/aqi/naqi';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface CurrentAqiCardProps {
  cityName: string;
  aqi: number;
  pm25: number;
  pm10: number;
  dominantPollutant: 'PM2.5' | 'PM10';
  category: NaqiCategory;
  chipBg: string;
  textColor: string;
  description: string;
  timestamp: string;
}

export default function CurrentAqiCard({
  cityName,
  aqi,
  pm25,
  pm10,
  dominantPollutant,
  category,
  chipBg,
  textColor,
  description,
  timestamp,
}: CurrentAqiCardProps) {
  // Format readable time
  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <article
      aria-labelledby="current-aqi-title"
      className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200 relative overflow-hidden space-y-6"
    >
      {/* Subtle atmospheric ambient tint bar at top */}
      <div
        className="absolute top-0 inset-x-0 h-1.5"
        style={{ backgroundColor: chipBg }}
        aria-hidden="true"
      />

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[13px] tracking-[0.04em] font-semibold uppercase text-slate-600">
            <span className="inline-block w-2 h-2 rounded-full bg-teal-800" aria-hidden="true" />
            <span id="current-aqi-title">Live Urban Air Quality</span>
            <span>•</span>
            <time dateTime={timestamp} className="font-normal">{formattedTime}</time>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {cityName}
          </h2>

          <p className="text-base sm:text-[17px] leading-[1.7] text-slate-800 max-w-[65ch]">
            {description}
          </p>
        </div>

        {/* Big AQI Callout: Serif reserved for AQI number */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-sm font-semibold text-slate-600 tracking-wide block">
              National AQI
            </span>
            <span className="text-5xl sm:text-6xl font-serif font-bold text-slate-950 tracking-tight leading-none">
              {aqi}
            </span>
          </div>

          {/* Accessible Category Chip: Fill + Contrast Text + Category Name */}
          <div
            className="px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 shadow-2xs min-h-[44px]"
            style={{ backgroundColor: chipBg, color: textColor }}
            role="status"
            aria-label={`Air Quality Category: ${category}, AQI value ${aqi}`}
          >
            {category === 'Good' || category === 'Satisfactory' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
            <span>{category}</span>
          </div>
        </div>
      </div>

      {/* Pollutant metrics strip */}
      <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <span className="text-xs font-semibold text-slate-600 block">
            PM2.5 concentration
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-slate-900">{pm25}</span>
            <span className="text-xs font-mono text-slate-600">µg/m³</span>
          </div>
          <span className="text-sm text-slate-600 block leading-normal">
            WHO guideline: 15 µg/m³
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <span className="text-xs font-semibold text-slate-600 block">
            PM10 concentration
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-slate-900">{pm10}</span>
            <span className="text-xs font-mono text-slate-600">µg/m³</span>
          </div>
          <span className="text-sm text-slate-600 block leading-normal">
            WHO guideline: 45 µg/m³
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <span className="text-xs font-semibold text-slate-600 block">
            Dominant pollutant
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-teal-900">{dominantPollutant}</span>
          </div>
          <span className="text-sm text-slate-600 block leading-normal">
            Governs primary sub-index
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <span className="text-xs font-semibold text-slate-600 block">
            Standard basis
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-semibold text-slate-900">CPCB India NAQI</span>
          </div>
          <span className="text-sm text-slate-600 block leading-normal">
            24-hr piecewise breakpoint
          </span>
        </div>
      </div>
    </article>
  );
}
