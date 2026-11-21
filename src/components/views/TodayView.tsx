'use client';

import { ProcessedAirQuality } from '@/lib/api/openMeteo';
import { MemberBudgetResult, REFERENCE_DAILY_MASS_UG } from '@/lib/exposure/breathBudget';
import CurrentAqiCard from '@/components/aqi/CurrentAqiCard';
import TimeWindowsCard from '@/components/aqi/TimeWindowsCard';
import { Activity, ArrowRight } from 'lucide-react';

interface TodayViewProps {
  airData: ProcessedAirQuality;
  perPersonSummary: MemberBudgetResult[];
  onNavigateToBudget: () => void;
}

export default function TodayView({
  airData,
  perPersonSummary,
  onNavigateToBudget,
}: TodayViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
      {/* Compact AQI Summary Card */}
      <div className="md:col-span-12">
        <CurrentAqiCard
          cityName={airData.cityName}
          aqi={airData.current.aqi}
          pm25={airData.current.pm25}
          pm10={airData.current.pm10}
          dominantPollutant={airData.current.dominantPollutant}
          category={airData.current.category}
          chipBg={airData.current.chipBg}
          textColor={airData.current.textColor}
          description={airData.current.description}
          timestamp={airData.current.time}
        />
      </div>

      {/* Cleanest / Peak Time Windows */}
      <div className="md:col-span-12">
        <TimeWindowsCard
          bestWindow={airData.bestWindow}
          worstWindow={airData.worstWindow}
          noSafeWindowAvailable={airData.windowRecommendations?.noSafeWindowAvailable}
          alertHeadline={airData.windowRecommendations?.alertHeadline}
        />
      </div>

      {/* Per-Person Breath Budget Bars Summary */}
      <div className="md:col-span-12">
        <section
          aria-labelledby="today-budget-summary-title"
          className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2
                  id="today-budget-summary-title"
                  className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight"
                >
                  Today&apos;s Family Breath Budget Summary
                </h2>
                <p className="text-sm text-slate-600 mt-0.5 max-w-[65ch]">
                  Estimated daily inhaled PM2.5 mass benchmarked against WHO 24h intake limit ({REFERENCE_DAILY_MASS_UG} µg)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onNavigateToBudget}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-teal-800 hover:bg-teal-900 text-white shadow-xs transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:outline-hidden min-h-[44px]"
            >
              <span>Full Budget Ledger &amp; What-If</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Summary bars for each household member */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
            {perPersonSummary.map((member, idx) => (
              <div
                key={idx}
                className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3.5 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-base font-bold text-slate-900 block leading-tight">
                      {member.label}
                    </span>
                    <span className="text-xs font-medium text-slate-600 block mt-0.5">
                      {member.ageCategory}
                    </span>
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: member.statusColor, color: member.statusTextColor }}
                  >
                    {member.percentageOfBudget}% WHO limit
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, member.percentageOfBudget)}%`,
                        backgroundColor: member.statusColor,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-700">
                    <span>Inhaled: <strong className="font-mono text-slate-900">{member.inhaledMassUg} µg</strong></span>
                    <span>Avoided: <strong className="font-mono text-slate-900">{member.avoidedMassUg} µg</strong></span>
                  </div>
                </div>

                {member.vulnerabilityNote && (
                  <p className="text-xs text-slate-600 italic pt-2 border-t border-slate-200 leading-normal">
                    {member.vulnerabilityNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
