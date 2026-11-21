'use client';

import LocationSearch from '@/components/aqi/LocationSearch';

interface TopBarProps {
  currentCity: string;
  onSelectCity: (city: { name: string; latitude: number; longitude: number }) => void;
  isLoading?: boolean;
  aqi?: number;
  category?: string;
  chipBg?: string;
  textColor?: string;
}

export default function TopBar({
  currentCity,
  onSelectCity,
  isLoading = false,
  aqi,
  category,
  chipBg = '#f1f5f9',
  textColor = '#0f172a',
}: TopBarProps) {
  return (
    <header
      role="banner"
      className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 transition-colors"
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* City Search + Geolocation */}
        <div className="flex-1 min-w-0 max-w-2xl">
          <LocationSearch
            currentCity={currentCity}
            onSelectCity={onSelectCity}
            isLoading={isLoading}
          />
        </div>

        {/* Compact Live AQI Chip (NAQI number + category name, never color alone) */}
        {aqi !== undefined && category && (
          <div
            role="status"
            aria-label={`Current atmospheric condition: NAQI ${aqi}, ${category}`}
            className="self-end sm:self-auto shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200/80 shadow-2xs font-sans min-h-[44px]"
            style={{ backgroundColor: chipBg, color: textColor }}
          >
            <div className="flex flex-col text-right leading-none">
              <span className="text-[11px] uppercase font-semibold tracking-[0.04em] opacity-80">
                NAQI
              </span>
              <span className="font-mono text-base font-bold">{aqi}</span>
            </div>
            <div className="h-5 w-px bg-current opacity-20" aria-hidden="true" />
            <span className="text-sm font-semibold tracking-tight">
              {category}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
