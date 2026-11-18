'use client';

import { useState } from 'react';
import { HourlyAqiPoint } from '@/lib/api/openMeteo';
import { getNaqiCategory } from '@/lib/aqi/naqi';

interface HourlyChartProps {
  hourly: HourlyAqiPoint[];
  bestStartTime?: string;
  worstStartTime?: string;
}

export default function HourlyChart({
  hourly,
  bestStartTime,
  worstStartTime,
}: HourlyChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!hourly || hourly.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-sm text-slate-500">
        No hourly forecast records available for this location.
      </div>
    );
  }

  // Calculate layout bounds
  const maxAqi = Math.max(300, ...hourly.map((h) => h.aqi));

  const formatHour = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: 'numeric', hour12: true });
    } catch {
      return isoString.split('T')[1]?.substring(0, 5) || isoString;
    }
  };

  return (
    <section
      aria-labelledby="hourly-forecast-heading"
      className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/80"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3
            id="hourly-forecast-heading"
            className="text-lg font-serif font-bold text-slate-900 tracking-tight"
          >
            24-Hour Smog Progression & Inversion Cycle
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Hourly National AQI forecast indicating nocturnal inversions and afternoon dispersion.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-800" aria-hidden="true" />
            <span>Optimal Window</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" aria-hidden="true" />
            <span>Peak Smog Inversion</span>
          </div>
        </div>
      </div>

      {/* Accessible Interactive Forecast Timeline */}
      <div className="relative pt-4">
        {/* Active Inspection Tooltip */}
        {hoveredIdx !== null && hourly[hoveredIdx] && (
          <div
            className="absolute top-0 transform -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs shadow-md pointer-events-none z-10 transition-all"
            style={{
              left: `${((hoveredIdx + 0.5) / hourly.length) * 100}%`,
            }}
            role="tooltip"
          >
            <div className="font-semibold flex items-center gap-1.5">
              <span>{formatHour(hourly[hoveredIdx].time)}</span>
              <span>— AQI {hourly[hoveredIdx].aqi}</span>
            </div>
            <div className="text-[10px] text-slate-300">
              {hourly[hoveredIdx].category} (PM2.5: {hourly[hoveredIdx].pm25} µg/m³)
            </div>
          </div>
        )}

        {/* Chart Bars Grid */}
        <div
          role="region"
          aria-label="Interactive hourly air quality forecast graph"
          className="flex items-end gap-1.5 sm:gap-2 h-44 w-full overflow-x-auto pb-6 pt-6"
          tabIndex={0}
        >
          {hourly.map((point, idx) => {
            const barHeightPercent = Math.max(8, Math.round((point.aqi / maxAqi) * 100));
            const categoryMeta = getNaqiCategory(point.aqi);
            const isBest = bestStartTime && point.time.startsWith(bestStartTime.substring(0, 13));
            const isWorst = worstStartTime && point.time.startsWith(worstStartTime.substring(0, 13));

            return (
              <div
                key={point.time}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx(null)}
                tabIndex={0}
                role="button"
                aria-label={`${formatHour(point.time)}: AQI ${point.aqi}, ${point.category}`}
                className="flex-1 min-w-[28px] sm:min-w-0 flex flex-col items-center justify-end h-full group cursor-pointer focus:outline-hidden"
              >
                {/* Bar */}
                <div className="w-full flex flex-col items-center justify-end h-32 relative">
                  {(isBest || isWorst) && (
                    <span
                      className={`absolute -top-3 w-1.5 h-1.5 rounded-full ${
                        isBest ? 'bg-teal-800' : 'bg-red-600'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                  <div
                    className="w-full rounded-t-sm transition-all group-hover:opacity-90 group-focus:ring-2 group-focus:ring-teal-700"
                    style={{
                      height: `${barHeightPercent}%`,
                      backgroundColor: categoryMeta.chipBg,
                    }}
                  />
                </div>

                {/* Time Label */}
                <span className="mt-2 text-[10px] font-mono text-slate-400 group-hover:text-slate-900 group-focus:text-slate-900 truncate">
                  {formatHour(point.time)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Screen-reader accessible alternative table */}
      <details className="mt-4 text-xs text-slate-500">
        <summary className="cursor-pointer font-medium hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-teal-800">
          View hourly forecast data as text table
        </summary>
        <div className="mt-3 overflow-x-auto max-h-48 border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-semibold">
              <tr>
                <th className="px-3 py-2">Hour</th>
                <th className="px-3 py-2">NAQI</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">PM2.5 (µg/m³)</th>
                <th className="px-3 py-2">PM10 (µg/m³)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {hourly.map((h) => (
                <tr key={h.time} className="hover:bg-slate-50">
                  <td className="px-3 py-1.5 font-mono">{formatHour(h.time)}</td>
                  <td className="px-3 py-1.5 font-semibold text-slate-900">{h.aqi}</td>
                  <td className="px-3 py-1.5">{h.category}</td>
                  <td className="px-3 py-1.5">{h.pm25}</td>
                  <td className="px-3 py-1.5">{h.pm10}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
