'use client';

import { ExposureResult } from '@/lib/exposure/engine';
import { Activity, Sparkles, TrendingDown, Info } from 'lucide-react';

interface ImpactExplainerProps {
  exposure: ExposureResult;
}

export default function ImpactExplainer({ exposure }: ImpactExplainerProps) {
  const outdoorSharePercent =
    exposure.baselineDose > 0
      ? Math.round((exposure.outdoorDose / exposure.baselineDose) * 100)
      : 50;
  const indoorSharePercent = Math.max(0, 100 - outdoorSharePercent);

  return (
    <section
      aria-labelledby="impact-explainer-heading"
      className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-teal-800">
            <Activity className="w-4 h-4 text-teal-800" aria-hidden="true" />
            <span id="impact-explainer-heading">Deterministic Exposure Impact Model</span>
          </div>
          <h3 className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Daily Inhaled Particulate Burden
          </h3>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-[65ch]">
            Calculated via microenvironmental time-activity mass concentration equations (not arbitrary AI estimates).
          </p>
        </div>

        {/* Estimated Reduction Badge */}
        {exposure.potentialReductionPercent > 0 && (
          <div className="flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-sm font-semibold shrink-0">
            <TrendingDown className="w-4 h-4 text-teal-800 shrink-0" aria-hidden="true" />
            <span>Up to {exposure.potentialReductionPercent}% Reduction Possible</span>
          </div>
        )}
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-600 block">
            Baseline Inhaled Dose
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-serif font-bold text-slate-900">
              {exposure.baselineDose}
            </span>
            <span className="text-xs text-slate-600 font-mono">µg·h/m³</span>
          </div>
          <p className="mt-2 text-xs text-slate-600 leading-normal">
            Total particulate mass passing into respiratory pathways over 24 hours.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-600 block">
            Estimated Indoor PM2.5
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-serif font-bold text-teal-900">
              {exposure.indoorConcentration}
            </span>
            <span className="text-xs text-slate-600 font-mono">µg/m³</span>
          </div>
          <p className="mt-2 text-xs text-slate-600 leading-normal">
            Steady-state room density governed by window sealing and purifier clearance.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-600 block">
            Health Risk Tier
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-bold ${
                exposure.healthRiskTier === 'Critical Emergency' ||
                exposure.healthRiskTier === 'Extreme Hazard'
                  ? 'text-red-700'
                  : 'text-amber-800'
              }`}
            >
              {exposure.healthRiskTier}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600 leading-normal">
            Keyed to CPCB NAQI and adjusted for vulnerable infants & seniors.
          </p>
        </div>
      </div>

      {/* Proportional Exposure Split Bar */}
      <div>
        <div className="flex items-center justify-between text-sm text-slate-700 mb-2 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-900" aria-hidden="true" />
            <span>Outdoor: {outdoorSharePercent}% (<span className="font-mono">{exposure.outdoorDose} µg·h/m³</span>)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-teal-800" aria-hidden="true" />
            <span>Indoor: {indoorSharePercent}% (<span className="font-mono">{exposure.indoorDose} µg·h/m³</span>)</span>
          </div>
        </div>

        <div
          role="progressbar"
          aria-valuenow={outdoorSharePercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Proportional exposure breakdown between outdoor and indoor environments"
          className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden flex"
        >
          <div
            style={{ width: `${outdoorSharePercent}%` }}
            className="bg-slate-900 h-full transition-all duration-500"
          />
          <div
            style={{ width: `${indoorSharePercent}%` }}
            className="bg-teal-800 h-full transition-all duration-500"
          />
        </div>
        <span className="text-xs text-slate-600 mt-1.5 block max-w-[65ch]">
          Notice: Because 85–90% of hours are spent indoors, indoor air infiltration often dominates cumulative daily exposure unless rooms are actively purified.
        </span>
      </div>

      {/* Verified Interventions Checklist */}
      {exposure.recommendedInterventions.length > 0 && (
        <div className="pt-4 border-t border-slate-200">
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-[0.04em] mb-3">
            Engine Recommended Exposure Reductions:
          </h4>
          <ul className="space-y-2 text-sm text-slate-700">
            {exposure.recommendedInterventions.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-teal-800 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Assumptions and Model Verification Link */}
      <div className="pt-2 text-xs text-slate-600 flex items-center justify-between flex-wrap gap-2">
        <span className="flex items-center gap-1.5">
          <Info className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
          <span>All factors (mask leakage, air infiltration, commute ventilation) are unit-tested and documented.</span>
        </span>
        <span className="italic">
          Label: Scientific Exposure Estimates (non-clinical)
        </span>
      </div>
    </section>
  );
}
