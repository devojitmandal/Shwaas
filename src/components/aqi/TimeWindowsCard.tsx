'use client';

import { OutdoorWindow } from '@/lib/api/openMeteo';
import { Sun, Moon, Clock, AlertTriangle } from 'lucide-react';
import { getNaqiCategory } from '@/lib/aqi/naqi';
import { formatTimeRange } from '@/lib/utils/timeFormat';

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

  const bestCategoryMeta = getNaqiCategory(bestWindow.averageAqi);
  const worstCategoryMeta = getNaqiCategory(worstWindow.averageAqi);

  return (
    <div className="space-y-6">
      {/* Critical Alert Banner if no safe window exists */}
      {noSafeWindowAvailable && (
        <div
          role="alert"
          className="p-6 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 flex items-start gap-4 shadow-2xs"
        >
          <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-rose-900">
              {alertHeadline || 'Critical Smog Lockout: NAQI > 300 for All 24 Hours'}
            </h3>
            <p className="text-base text-rose-950 leading-relaxed max-w-[65ch]">
              Every single hour today has projected NAQI &gt; 300 (Very Poor / Severe). No safe outdoor window exists today. The window recommended below is merely the least-polluted interval—not a safe threshold. Cancel sports and postpone non-urgent travel.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Best Outdoor Time Window */}
        <article
          aria-labelledby="best-window-title"
          className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col justify-between space-y-5"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="flex items-center gap-2 text-[13px] tracking-[0.04em] font-semibold uppercase text-teal-800">
                <Sun className="w-4 h-4 text-teal-800" aria-hidden="true" />
                <span id="best-window-title">
                  {noSafeWindowAvailable ? 'Least-polluted available window' : 'Cleanest activity window'}
                </span>
              </span>
              <div
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-2xs min-h-[32px] flex items-center"
                style={{
                  backgroundColor: bestCategoryMeta.chipBg,
                  color: bestCategoryMeta.textColor,
                }}
              >
                Avg AQI <span className="font-mono font-bold ml-1">{bestWindow.averageAqi}</span>&nbsp;({bestWindow.category})
              </div>
            </div>

            <div className="flex items-baseline gap-2 pt-1">
              <Clock className="w-5 h-5 text-slate-500" aria-hidden="true" />
              <h4 className="text-2xl font-bold text-slate-900 tracking-tight">
                {formatTimeRange(bestWindow.startTime, bestWindow.endTime)}
              </h4>
            </div>

            <p className="text-base leading-relaxed text-slate-700 max-w-[65ch]">
              {bestWindow.advisory}
            </p>

            {/* Scientific Reasoning Badges (Collapsible Why? expander) */}
            {bestWindow.reasoning && bestWindow.reasoning.length > 0 && (
              <details className="mt-3 pt-3 border-t border-slate-200 group">
                <summary className="cursor-pointer text-sm font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1.5 select-none focus-visible:outline-hidden">
                  <span>Why this window?</span>
                  <span className="text-xs font-normal text-slate-600 group-open:hidden">
                    (tap to expand)
                  </span>
                </summary>
                <ul className="mt-2.5 space-y-1.5 text-sm text-slate-700 max-w-[65ch]">
                  {bestWindow.reasoning.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-teal-800 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          <div className="pt-3.5 border-t border-slate-200 flex items-center justify-between text-sm text-slate-600">
            <span>Forecast model telemetry</span>
            <span className="font-medium text-slate-700">{bestWindow.isSafe ? 'Low inversion risk' : 'N95 protection mandatory'}</span>
          </div>
        </article>

        {/* Worst Outdoor Time Window */}
        <article
          aria-labelledby="worst-window-title"
          className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col justify-between space-y-5"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="flex items-center gap-2 text-[13px] tracking-[0.04em] font-semibold uppercase text-rose-800">
                <Moon className="w-4 h-4 text-rose-800" aria-hidden="true" />
                <span id="worst-window-title">Peak inversion smog trap</span>
              </span>
              <div
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-2xs min-h-[32px] flex items-center"
                style={{
                  backgroundColor: worstCategoryMeta.chipBg,
                  color: worstCategoryMeta.textColor,
                }}
              >
                Avg AQI <span className="font-mono font-bold ml-1">{worstWindow.averageAqi}</span>&nbsp;({worstWindow.category})
              </div>
            </div>

            <div className="flex items-baseline gap-2 pt-1">
              <Clock className="w-5 h-5 text-slate-500" aria-hidden="true" />
              <h4 className="text-2xl font-bold text-slate-900 tracking-tight">
                {formatTimeRange(worstWindow.startTime, worstWindow.endTime)}
              </h4>
            </div>

            <p className="text-base leading-relaxed text-slate-700 max-w-[65ch]">
              {worstWindow.advisory}
            </p>

            <details className="mt-3 pt-3 border-t border-slate-200 group">
              <summary className="cursor-pointer text-sm font-bold text-rose-800 hover:text-rose-950 flex items-center gap-1.5 select-none focus-visible:outline-hidden">
                <span>Atmospheric dynamics &amp; risks</span>
                <span className="text-xs font-normal text-slate-600 group-open:hidden">
                  (tap to expand)
                </span>
              </summary>
              <p className="mt-2.5 text-sm text-slate-700 leading-relaxed max-w-[65ch]">
                Cool surface air and weak boundary-layer winds prevent vertical dispersion. Vehicle emissions and biomass smoke concentrate directly in human breathing zones.
              </p>
            </details>
          </div>

          <div className="pt-3.5 border-t border-slate-200 flex items-center justify-between text-sm text-rose-800 font-semibold">
            <span>Action: Keep windows sealed</span>
            <span>Halt outdoor exercise</span>
          </div>
        </article>
      </div>
    </div>
  );
}
