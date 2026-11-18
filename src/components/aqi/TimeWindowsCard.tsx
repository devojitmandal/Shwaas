'use client';

import { OutdoorWindow } from '@/lib/api/openMeteo';
import { Sun, Moon, Clock, AlertTriangle } from 'lucide-react';
import { getNaqiCategory } from '@/lib/aqi/naqi';

interface TimeWindowsCardProps {
  bestWindow: OutdoorWindow;
  worstWindow: OutdoorWindow;
  noSafeWindowAvailable?: boolean;
  alertHeadline?: string;
}

export default function TimeWindowsCard({
  bestWindow,
  worstWindow,
  noSafeWindowAvailable = false,
  alertHeadline,
}: TimeWindowsCardProps) {
  const formatTimeRange = (start: string, end: string) => {
    try {
      const s = new Date(start).toLocaleTimeString([], { hour: 'numeric', hour12: true });
      const e = new Date(end).toLocaleTimeString([], { hour: 'numeric', hour12: true });
      return `${s} – ${e}`;
    } catch {
      return `${start.substring(11, 16)} – ${end.substring(11, 16)}`;
    }
  };

  const bestCategoryMeta = getNaqiCategory(bestWindow.averageAqi);
  const worstCategoryMeta = getNaqiCategory(worstWindow.averageAqi);

  return (
    <div className="space-y-3">
      {/* Critical Alert Banner if no safe window exists */}
      {noSafeWindowAvailable && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">
              {alertHeadline || 'Critical Smog Alert: No Safe Outdoor Window Today'}
            </h4>
            <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
              Every hour today is projected in hazardous or very poor pollution bands. The window recommended below is merely the <em>least-polluted interval</em>—not a safe threshold. Cancel sports and postpone non-urgent travel.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Best Outdoor Time Window */}
        <article
          aria-labelledby="best-window-title"
          className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-800">
                <Sun className="w-4 h-4 text-teal-800" aria-hidden="true" />
                <span id="best-window-title">
                  {noSafeWindowAvailable ? 'Least-Polluted Available Window' : 'Cleanest Activity Window'}
                </span>
              </span>
              <div
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-2xs"
                style={{
                  backgroundColor: bestCategoryMeta.chipBg,
                  color: bestCategoryMeta.textColor,
                }}
              >
                Avg AQI {bestWindow.averageAqi} ({bestWindow.category})
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <Clock className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <h4 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
                {formatTimeRange(bestWindow.startTime, bestWindow.endTime)}
              </h4>
            </div>

            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {bestWindow.advisory}
            </p>

            {/* Scientific Reasoning Badges */}
            {bestWindow.reasoning && bestWindow.reasoning.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Why this window?
                </span>
                <ul className="space-y-1 text-xs text-slate-600">
                  {bestWindow.reasoning.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-teal-800">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Forecast Model Telemetry</span>
            <span>{bestWindow.isSafe ? 'Low Inversion Risk' : 'N95 Protection Mandatory'}</span>
          </div>
        </article>

        {/* Worst Outdoor Time Window */}
        <article
          aria-labelledby="worst-window-title"
          className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-800">
                <Moon className="w-4 h-4 text-rose-800" aria-hidden="true" />
                <span id="worst-window-title">Peak Inversion Smog Trap</span>
              </span>
              <div
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-2xs"
                style={{
                  backgroundColor: worstCategoryMeta.chipBg,
                  color: worstCategoryMeta.textColor,
                }}
              >
                Avg AQI {worstWindow.averageAqi} ({worstWindow.category})
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <Clock className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <h4 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
                {formatTimeRange(worstWindow.startTime, worstWindow.endTime)}
              </h4>
            </div>

            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {worstWindow.advisory}
            </p>

            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Atmospheric Dynamics:
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cool surface air and weak boundary-layer winds prevent vertical dispersion. Vehicle emissions and biomass smoke concentrate directly in human breathing zones.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-rose-800 font-semibold">
            <span>Action: Keep windows sealed</span>
            <span>Halt outdoor exercise</span>
          </div>
        </article>
      </div>
    </div>
  );
}
