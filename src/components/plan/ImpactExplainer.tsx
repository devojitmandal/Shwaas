'use client';

import { ExposureResult } from '@/lib/exposure/engine';
import { Activity, ShieldAlert, Sparkles, TrendingDown, Info } from 'lucide-react';
import Link from 'next/link';

interface ImpactExplainerProps {
  exposure: ExposureResult;
  currentAqi: number;
}

export default function ImpactExplainer({ exposure, currentAqi }: ImpactExplainerProps) {
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
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800">
            <Activity className="w-4 h-4 text-teal-800" aria-hidden="true" />
            <span id="impact-explainer-heading">Deterministic Exposure Impact Model</span>
          </div>
          <h3 className="mt-1 text-2xl font-serif font-bold text-slate-900 tracking-tight">
            Daily Inhaled Particulate Burden
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Calculated via microenvironmental time-activity mass concentration equations (not arbitrary AI estimates).
          </p>
        </div>

        {/* Estimated Reduction Badge */}
        {exposure.potentialReductionPercent > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold shrink-0">
            <TrendingDown className="w-4 h-4 text-teal-800 shrink-0" aria-hidden="true" />
            <span>Up to {exposure.potentialReductionPercent}% Reduction Possible</span>
          </div>
        )}
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Baseline Inhaled Dose
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-serif font-bold text-slate-900">
              {exposure.baselineDose}
            </span>
            <span className="text-xs text-slate-500 font-mono">µg·h/m³</span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 leading-normal">
            Total particulate mass passing into respiratory pathways over 24 hours.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Estimated Indoor PM2.5
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-serif font-bold text-teal-900">
              {exposure.indoorConcentration}
            </span>
            <span className="text-xs text-slate-500 font-mono">µg/m³</span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 leading-normal">
            Steady-state room density governed by window sealing and purifier clearance.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Health Risk Tier
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span
              className={`text-xl font-serif font-bold ${
                exposure.healthRiskTier === 'Critical Emergency' ||
                exposure.healthRiskTier === 'Extreme Hazard'
                  ? 'text-red-700'
                  : 'text-amber-700'
              }`}
            >
              {exposure.healthRiskTier}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 leading-normal">
            Keyed to CPCB NAQI and adjusted for vulnerable infants & seniors.
          </p>
        </div>
      </div>

      {/* Proportional Exposure Split Bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-600 mb-2 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900" aria-hidden="true" />
            <span>Outdoor Component: {outdoorSharePercent}% ({exposure.outdoorDose} µg·h/m³)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-800" aria-hidden="true" />
            <span>Indoor Component: {indoorSharePercent}% ({exposure.indoorDose} µg·h/m³)</span>
          </div>
        </div>

        <div
          role="progressbar"
          aria-valuenow={outdoorSharePercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Proportional exposure breakdown between outdoor and indoor environments"
          className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex"
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
        <span className="text-[10px] text-slate-400 mt-1 block">
          Notice: Because 85–90% of hours are spent indoors, indoor air infiltration often dominates cumulative daily exposure unless rooms are actively purified.
        </span>
      </div>

      {/* Verified Interventions Checklist */}
      {exposure.recommendedInterventions.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2.5">
            Engine Recommended Exposure Reductions:
          </h4>
          <ul className="space-y-2 text-xs text-slate-700">
            {exposure.recommendedInterventions.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-teal-800 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Assumptions and Model Verification Link */}
      <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between flex-wrap gap-2">
        <span className="flex items-center gap-1">
          <Info className="w-3.5 h-3.5" aria-hidden="true" />
          <span>All factors (mask leakage, air infiltration, commute ventilation) are unit-tested and documented.</span>
        </span>
        <span className="italic">
          Label: Scientific Exposure Estimates (non-clinical)
        </span>
      </div>
    </section>
  );
}
