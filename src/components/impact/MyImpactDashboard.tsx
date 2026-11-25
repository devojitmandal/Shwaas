'use client';

import { ExposureResult } from '@/lib/exposure/engine';
import { TrendingDown, Award, Info } from 'lucide-react';

interface MyImpactDashboardProps {
  exposure: ExposureResult;
  cityName: string;
}

export default function MyImpactDashboard({ exposure, cityName }: MyImpactDashboardProps) {
  const baselineMass = exposure.totalInhaledMassUg;
  const optimizedMass = exposure.optimizedInhaledMassUg;
  const avoidedMass = exposure.avoidedInhaledMassUg;
  const reductionPercent = exposure.potentialReductionPercent;

  return (
    <section
      aria-labelledby="my-impact-heading"
      className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-teal-800">
            <Award className="w-4 h-4 text-teal-800" aria-hidden="true" />
            <span id="my-impact-heading">My Shwaas Impact Dashboard</span>
          </div>
          <h3 className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Quantified Pollution Avoidance for {cityName}
          </h3>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-[65ch] leading-relaxed">
            Comparing your unmitigated daily routine against an optimized Shwaas protocol using deterministic particulate intake equations.
          </p>
        </div>

        {/* Avoided Mass Callout */}
        <div className="min-h-[44px] px-4 py-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-sm font-bold flex items-center gap-2 shrink-0">
          <TrendingDown className="w-4 h-4 text-teal-800" aria-hidden="true" />
          <span>~{avoidedMass} µg PM2.5 Intake Avoided per Day ({reductionPercent}%)</span>
        </div>
      </div>

      {/* 4 Quantified Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-600 block">
            Particulate mass avoided
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-teal-950">{avoidedMass}</span>
            <span className="text-xs text-slate-600 font-mono">µg / day</span>
          </div>
          <span className="text-xs text-slate-600 mt-1 block">Cumulative inhaled aerosol mass</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-600 block">
            Priority interventions
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {exposure.recommendedInterventions.length}
            </span>
            <span className="text-xs text-slate-600">
              {exposure.recommendedInterventions.length === 1 ? 'action' : 'actions'}
            </span>
          </div>
          <span className="text-xs text-slate-600 mt-1 block">
            {exposure.recommendedInterventions.length > 0
              ? 'Flagged for your routine'
              : 'Routine already optimized'}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-600 block">
            Outdoor particulate intake
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
              {exposure.outdoorInhaledMassUg}
            </span>
            <span className="text-xs text-slate-600 font-mono">µg / day</span>
          </div>
          <span className="text-xs text-slate-600 mt-1 block">From current commute profile</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-600 block">
            Modeled indoor PM2.5
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-950">
              {exposure.indoorConcentration}
            </span>
            <span className="text-xs text-slate-600 font-mono">µg/m³</span>
          </div>
          <span className="text-xs text-slate-600 mt-1 block">Steady-state room concentration</span>
        </div>
      </div>

      {/* Visual Side-by-Side Comparison: Baseline vs Optimized */}
      <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-800">
          Daily Inhaled PM2.5 Intake Comparison: Baseline vs Optimized Routine
        </h4>

        {/* Baseline Bar */}
        <div>
          <div className="flex items-center justify-between text-sm font-medium text-slate-800 mb-1.5">
            <span className="font-semibold text-rose-900">Baseline routine (unmitigated)</span>
            <span className="font-mono text-xs">{baselineMass} µg total intake</span>
          </div>
          <div className="h-7 w-full rounded-xl bg-slate-200 overflow-hidden flex">
            <div
              style={{ width: '100%' }}
              className="bg-rose-700 text-white text-xs flex items-center justify-end pr-3 font-mono font-medium"
            >
              Baseline: {baselineMass} µg
            </div>
          </div>
          <span className="text-xs text-slate-600 mt-1 block">
            Open morning two-wheeler commute + windows open + unpurified indoor living.
          </span>
        </div>

        {/* Optimized Bar */}
        <div>
          <div className="flex items-center justify-between text-sm font-medium text-slate-800 mb-1.5">
            <span className="font-semibold text-teal-900">Shwaas optimized protocol</span>
            <span className="font-mono text-teal-900 font-bold text-xs">{optimizedMass} µg ({reductionPercent}% drop)</span>
          </div>
          <div className="h-7 w-full rounded-xl bg-slate-200 overflow-hidden flex">
            <div
              style={{ width: `${Math.max(15, Math.round((optimizedMass / (baselineMass || 1)) * 100))}%` }}
              className="bg-teal-800 text-white text-xs flex items-center justify-end pr-3 font-mono font-medium"
            >
              {optimizedMass} µg
            </div>
            <div
              style={{ width: `${Math.min(85, Math.round((avoidedMass / (baselineMass || 1)) * 100))}%` }}
              className="bg-emerald-100 text-emerald-950 text-xs flex items-center justify-center font-semibold border-l border-emerald-300"
            >
              Avoided: {avoidedMass} µg ({reductionPercent}%)
            </div>
          </div>
          <span className="text-xs text-slate-600 mt-1 block">
            Travel shifted to afternoon + N95 fitted + sealed windows + HEPA purifier active.
          </span>
        </div>
      </div>

      {/* Transparent Disclaimer */}
      <div className="pt-2 text-xs sm:text-sm text-slate-600 flex items-start gap-2.5 max-w-[65ch]">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          <strong>Scientific Integrity Note:</strong> Figures are derived deterministically using EPA minute ventilation volume equations and indoor single-zone mass balance. Shwaas does not claim clinical health outcomes or disease cures; results are exposure-management estimates for lifestyle optimization.
        </p>
      </div>
    </section>
  );
}
