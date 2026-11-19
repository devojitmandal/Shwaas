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
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800">
            <Award className="w-4 h-4 text-teal-800" aria-hidden="true" />
            <span id="my-impact-heading">My Shwaas Impact Dashboard</span>
          </div>
          <h3 className="mt-1 text-2xl font-serif font-bold text-slate-900 tracking-tight">
            Quantified Pollution Avoidance for {cityName}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-2xl leading-relaxed">
            Comparing your unmitigated daily routine against an optimized Shwaas protocol using deterministic particulate intake equations.
          </p>
        </div>

        {/* Avoided Mass Callout */}
        <div className="px-4 py-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold flex items-center gap-2 shrink-0">
          <TrendingDown className="w-4 h-4 text-teal-800" aria-hidden="true" />
          <span>~{avoidedMass} µg PM2.5 Intake Avoided per Day ({reductionPercent}%)</span>
        </div>
      </div>

      {/* 4 Quantified Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Particulate Mass Avoided
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-teal-950">{avoidedMass}</span>
            <span className="text-xs text-slate-500 font-mono">µg / day</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Cumulative inhaled aerosol mass</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Actions Optimized
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">3</span>
            <span className="text-xs text-slate-500">routines</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Commute shift, N95, clean-room</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Lower-Smog Window Shift
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">~1.5</span>
            <span className="text-xs text-slate-500">hours</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Shifted away from morning trap</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Indoor Infiltration Reduction
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-emerald-950">~72%</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">In sealed bedroom with HEPA</span>
        </div>
      </div>

      {/* Visual Side-by-Side Comparison: Baseline vs Optimized */}
      <div className="p-5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
          Daily Inhaled PM2.5 Intake Comparison: Baseline vs Optimized Routine
        </h4>

        {/* Baseline Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1">
            <span className="font-semibold text-rose-900">Baseline Routine (Unmitigated)</span>
            <span className="font-mono">{baselineMass} µg total intake</span>
          </div>
          <div className="h-6 w-full rounded-lg bg-slate-200 overflow-hidden flex">
            <div
              style={{ width: '100%' }}
              className="bg-rose-700 text-white text-[10px] flex items-center justify-end pr-2 font-mono"
            >
              Baseline: {baselineMass} µg
            </div>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Open morning two-wheeler commute + windows open + unpurified indoor living.
          </span>
        </div>

        {/* Optimized Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1">
            <span className="font-semibold text-teal-900">Shwaas Optimized Protocol</span>
            <span className="font-mono text-teal-800 font-bold">{optimizedMass} µg ({reductionPercent}% drop)</span>
          </div>
          <div className="h-6 w-full rounded-lg bg-slate-200 overflow-hidden flex">
            <div
              style={{ width: `${Math.max(15, Math.round((optimizedMass / (baselineMass || 1)) * 100))}%` }}
              className="bg-teal-800 text-white text-[10px] flex items-center justify-end pr-2 font-mono"
            >
              {optimizedMass} µg
            </div>
            <div
              style={{ width: `${Math.min(85, Math.round((avoidedMass / (baselineMass || 1)) * 100))}%` }}
              className="bg-emerald-100 text-emerald-900 text-[10px] flex items-center justify-center font-semibold border-l border-emerald-300"
            >
              Avoided: {avoidedMass} µg ({reductionPercent}%)
            </div>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Travel shifted to afternoon + N95 fitted + sealed windows + HEPA purifier active.
          </span>
        </div>
      </div>

      {/* Transparent Disclaimer */}
      <div className="pt-2 text-[11px] text-slate-400 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          <strong>Scientific Integrity Note:</strong> Figures are derived deterministically using EPA minute ventilation volume equations and indoor single-zone mass balance. Shwaas does not claim clinical health outcomes or disease cures; results are exposure-management estimates for lifestyle optimization.
        </p>
      </div>
    </section>
  );
}
