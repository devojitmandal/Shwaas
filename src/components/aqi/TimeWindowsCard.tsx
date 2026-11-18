'use client';

import { OutdoorWindow } from '@/lib/api/openMeteo';
import { Sun, Moon, Clock, ArrowRight } from 'lucide-react';
import { getNaqiCategory } from '@/lib/aqi/naqi';

interface TimeWindowsCardProps {
  bestWindow: OutdoorWindow;
  worstWindow: OutdoorWindow;
}

export default function TimeWindowsCard({
  bestWindow,
  worstWindow,
}: TimeWindowsCardProps) {
  const formatTimeRange = (start: string, end: string) => {
    try {
      const s = new Date(start).toLocaleTimeString([], { hour: 'numeric', hour12: true });
      const e = new Date(end).toLocaleTimeString([], { hour: 'numeric', hour12: true });
      return `${s} – ${e}`;
    } catch {
      return `${start} to ${end}`;
    }
  };

  const bestCategoryMeta = getNaqiCategory(bestWindow.averageAqi);
  const worstCategoryMeta = getNaqiCategory(worstWindow.averageAqi);

  return (
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
              <span id="best-window-title">Optimal Outdoor Window</span>
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

          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            {bestWindow.advisory}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-teal-900 font-medium">
          <span>Action:</span>
          <span className="text-slate-600">Schedule mandatory errands, school runs, or brief ventilation flushes here.</span>
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

          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            {worstWindow.advisory}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-rose-900 font-medium">
          <span>Action:</span>
          <span className="text-slate-600">Postpone morning jogs; cancel outdoor school assemblies; keep doors sealed.</span>
        </div>
      </article>
    </div>
  );
}
