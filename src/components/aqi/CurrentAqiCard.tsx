'use client';

import { NaqiCategory } from '@/lib/aqi/naqi';
import { Wind, AlertTriangle, Info, CheckCircle2, CloudRain } from 'lucide-react';

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
      className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/80 relative overflow-hidden"
    >
      {/* Subtle atmospheric ambient tint bar at top */}
      <div
        className="absolute top-0 inset-x-0 h-1.5"
        style={{ backgroundColor: chipBg }}
        aria-hidden="true"
      />

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-teal-800" aria-hidden="true" />
            <span id="current-aqi-title">Live Urban Air Quality</span>
            <span>•</span>
            <time dateTime={timestamp}>{formattedTime}</time>
          </div>

          <h2 className="mt-1 text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            {cityName}
          </h2>

          <p className="mt-2 text-sm text-slate-600 max-w-xl leading-relaxed">
            {description}
          </p>
        </div>

        {/* Big AQI Callout with strict Accessible Chip Fill */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest block">
              National AQI
            </span>
            <span className="text-5xl sm:text-6xl font-serif font-bold text-slate-950 tracking-tight leading-none">
              {aqi}
            </span>
          </div>

          {/* Accessible Category Chip: Fill + Contrast Text + Category Name */}
          <div
            className="px-3.5 py-1.5 rounded-full font-semibold text-xs flex items-center gap-1.5 shadow-2xs"
            style={{ backgroundColor: chipBg, color: textColor }}
            role="status"
            aria-label={`Air Quality Category: ${category}, AQI value ${aqi}`}
          >
            {category === 'Good' || category === 'Satisfactory' ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>{category}</span>
          </div>
        </div>
      </div>

      {/* Pollutant metrics strip */}
      <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
        <div className="p-3 rounded-xl bg-slate-50/70">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            PM2.5 Concentration
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold font-serif text-slate-900">{pm25}</span>
            <span className="text-xs text-slate-500">µg/m³</span>
          </div>
          <span className="mt-1 text-[11px] text-slate-400 block">
            WHO guide: 15 µg/m³
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50/70">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            PM10 Concentration
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold font-serif text-slate-900">{pm10}</span>
            <span className="text-xs text-slate-500">µg/m³</span>
          </div>
          <span className="mt-1 text-[11px] text-slate-400 block">
            WHO guide: 45 µg/m³
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50/70">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Dominant Driver
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold font-serif text-teal-900">{dominantPollutant}</span>
          </div>
          <span className="mt-1 text-[11px] text-slate-400 block">
            Governs primary sub-index
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50/70">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Standard Basis
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-sm font-semibold text-slate-800">CPCB India NAQI</span>
          </div>
          <span className="mt-1 text-[11px] text-slate-400 block">
            24-hr piecewise breakpoint
          </span>
        </div>
      </div>
    </article>
  );
}
