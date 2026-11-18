'use client';

import { PlanResponse } from '@/lib/plan/planSchema';
import {
  Sparkles,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  HeartHandshake,
  RefreshCw,
  Info,
} from 'lucide-react';

interface TodaysPlanViewProps {
  plan: PlanResponse;
  isLoading?: boolean;
  onRefresh?: () => void;
  source?: string;
}

export default function TodaysPlanView({
  plan,
  isLoading = false,
  onRefresh,
  source,
}: TodaysPlanViewProps) {
  return (
    <div className="space-y-6">
      {/* Plan Header Card */}
      <section
        aria-labelledby="todays-plan-title"
        className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800">
              <Sparkles className="w-4 h-4 text-teal-800" aria-hidden="true" />
              <span id="todays-plan-title">Personalized Defense Protocol</span>
              {source && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {source === 'gemini_personalized' ? 'Gemini 2.5 + Deterministic Engine' : 'Deterministic Engine Rules'}
                </span>
              )}
            </div>
            <h2 className="mt-1 text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
              {plan.headline}
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-3xl">
              {plan.executiveSummary}
            </p>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shrink-0 shadow-2xs focus-visible:outline-2 focus-visible:outline-teal-800 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-teal-800 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Updating...' : 'Regenerate Plan'}</span>
            </button>
          )}
        </div>

        {/* Sensitive Group Alert Banner */}
        {plan.sensitiveGroupGuidance && (
          <div
            role="alert"
            className="mt-6 p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950"
          >
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block">
                  {plan.sensitiveGroupGuidance.alertLevel} — Protect{' '}
                  {plan.sensitiveGroupGuidance.vulnerableGroupsCovered.join(' & ')}
                </span>
                <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                  {plan.sensitiveGroupGuidance.advice}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Low-Emission Daily Routine */}
      <section aria-labelledby="routine-heading">
        <h3
          id="routine-heading"
          className="text-lg font-serif font-bold text-slate-900 tracking-tight mb-3"
        >
          1. Low-Emission Daily Routine
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plan.lowEmissionRoutine.map((item, idx) => (
            <article
              key={idx}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono uppercase font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                    {item.timeOfDay}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    {item.estimatedExposureReduction}
                  </span>
                </div>

                <h4 className="text-base font-serif font-bold text-slate-900 tracking-tight">
                  {item.title}
                </h4>

                <p className="mt-2 text-xs text-slate-700 leading-relaxed font-medium">
                  {item.action}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 leading-normal">
                <strong>Why it matters:</strong> {item.rationale}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Indoor Air Hacks with Myth-Check */}
      <section aria-labelledby="indoor-hacks-heading">
        <h3
          id="indoor-hacks-heading"
          className="text-lg font-serif font-bold text-slate-900 tracking-tight mb-3"
        >
          2. Indoor Air Quality Hacks & Myth-Checks
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plan.indoorAirHacks.map((hack, idx) => (
            <article
              key={idx}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-teal-800">
                    <Lightbulb className="w-3.5 h-3.5" aria-hidden="true" />
                    Indoor Strategy
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    {hack.estimatedExposureReduction}
                  </span>
                </div>

                <h4 className="text-base font-serif font-bold text-slate-900 tracking-tight">
                  {hack.title}
                </h4>

                <p className="mt-2 text-xs text-slate-700 leading-relaxed">
                  {hack.instructions}
                </p>
              </div>

              {/* Myth Check Box */}
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-normal">
                <span className="font-semibold text-rose-700 block mb-0.5">
                  Scientific Myth-Check:
                </span>
                <span>{hack.mythCheck}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Community Action Callout */}
      {plan.communityAction && (
        <section
          aria-labelledby="community-action-heading"
          className="bg-teal-900 text-white rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <span
              id="community-action-heading"
              className="text-xs font-semibold uppercase tracking-wider text-teal-300 flex items-center gap-1.5"
            >
              <HeartHandshake className="w-4 h-4 text-teal-300" aria-hidden="true" />
              Community & Neighborhood Resilience
            </span>
            <p className="text-sm text-teal-50 max-w-2xl leading-relaxed">
              {plan.communityAction}
            </p>
          </div>
        </section>
      )}

      {/* Prominent Visible Not Medical Advice Disclaimer */}
      <aside
        aria-label="Medical Disclaimer"
        className="p-4 rounded-xl bg-slate-100/80 border border-slate-200/80 text-xs text-slate-600 leading-relaxed flex items-start gap-2.5"
      >
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <span className="font-bold text-slate-800">Decision-Support & Medical Disclaimer: </span>
          <span>{plan.disclaimer}</span>
          <span className="block mt-0.5 text-slate-500">
            AirWise calculates exposure doses and reductions strictly from deterministic environmental equations and CPCB NAQI tables. Always consult a licensed pulmonologist or medical doctor for personal health symptoms, asthma management, or medication.
          </span>
        </div>
      </aside>
    </div>
  );
}
