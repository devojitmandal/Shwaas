'use client';

import { useState, useEffect } from 'react';
import { PlanResponse, PlanSource } from '@/lib/plan/planSchema';
import {
  Sparkles,
  ShieldAlert,
  Lightbulb,
  HeartHandshake,
  RefreshCw,
  Info,
  Volume2,
  Square,
} from 'lucide-react';

interface TodaysPlanViewProps {
  plan: PlanResponse;
  isLoading?: boolean;
  onRefresh?: () => void;
  source?: PlanSource;
}

export default function TodaysPlanView({
  plan,
  isLoading = false,
  onRefresh,
  source,
}: TodaysPlanViewProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleReadAloud = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    const hasDevanagari = /[\u0900-\u097F]/.test(plan.headline);
    const hasKannada = /[\u0C80-\u0CFF]/.test(plan.headline);
    const langCode = hasDevanagari ? 'hi-IN' : hasKannada ? 'kn-IN' : 'en-IN';

    const textToRead = `${plan.headline}. ${plan.executiveSummary}. ${plan.dailyBriefing || ''}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = langCode;
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find((v) => v.lang.startsWith(langCode.substring(0, 2)));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* Plan Header Card */}
      <section
        aria-labelledby="todays-plan-title"
        className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[13px] tracking-[0.04em] font-semibold uppercase text-teal-800">
              <Sparkles className="w-4 h-4 text-teal-800" aria-hidden="true" />
              <span id="todays-plan-title">Personalized Defense Protocol</span>
              {source && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {source === 'gemini_personalized' ? 'Gemini 3.8 + Deterministic Engine' : 'Rule-based plan'}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {plan.headline}
            </h2>
            <p className="text-base sm:text-[17px] leading-[1.7] text-slate-800 max-w-[65ch]">
              {plan.executiveSummary}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={handleToggleReadAloud}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all shadow-2xs min-h-[44px] focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:outline-hidden ${
                isSpeaking
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800'
              }`}
              aria-label={isSpeaking ? 'Stop reading plan aloud' : 'Read plan aloud using text-to-speech'}
            >
              {isSpeaking ? (
                <>
                  <Square className="w-4 h-4 text-rose-700 fill-current animate-pulse" />
                  <span>Stop Reading</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-teal-800" />
                  <span>Read Aloud</span>
                </>
              )}
            </button>

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors shadow-2xs min-h-[44px] focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:outline-hidden disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-teal-800 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Updating...' : 'Regenerate Plan'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sensitive Group Alert Banner */}
        {plan.sensitiveGroupGuidance && (
          <div
            role="alert"
            className="p-5 sm:p-6 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 shadow-2xs"
          >
            <div className="flex items-start gap-3.5">
              <ShieldAlert className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <span className="text-sm font-bold uppercase tracking-wide text-amber-900 block">
                  {plan.sensitiveGroupGuidance.alertLevel} — Protect{' '}
                  {plan.sensitiveGroupGuidance.vulnerableGroupsCovered.join(' & ')}
                </span>
                <p className="text-base text-amber-950 leading-relaxed max-w-[65ch]">
                  {plan.sensitiveGroupGuidance.advice}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Low-Emission Daily Routine */}
      <section aria-labelledby="routine-heading" className="space-y-4">
        <div>
          <h3
            id="routine-heading"
            className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight"
          >
            1. Low-Emission Daily Routine
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Actionable daily schedule tailored to ambient diurnal inversion patterns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {plan.lowEmissionRoutine.map((item, idx) => (
            <article
              key={idx}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-teal-900 bg-teal-50 border border-teal-200/80 px-2.5 py-1 rounded-lg">
                    {item.timeOfDay}
                  </span>
                  <span className="text-xs font-semibold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {item.estimatedExposureReduction}
                  </span>
                </div>

                <h4 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
                  {item.title}
                </h4>

                <p className="text-base leading-relaxed text-slate-800 max-w-[65ch]">
                  {item.action}
                </p>
              </div>

              <details className="pt-3 border-t border-slate-200 group">
                <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-teal-800 hover:text-teal-950 flex items-center justify-between select-none focus-visible:outline-hidden">
                  <span>Why it matters</span>
                  <span className="text-xs font-normal lowercase text-slate-600 group-open:hidden">
                    (expand)
                  </span>
                </summary>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-[65ch]">
                  {item.rationale}
                </p>
              </details>
            </article>
          ))}
        </div>
      </section>

      {/* Indoor Air Hacks with Myth-Check */}
      <section aria-labelledby="indoor-hacks-heading" className="space-y-4">
        <div>
          <h3
            id="indoor-hacks-heading"
            className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight"
          >
            2. Indoor Air Quality Hacks &amp; Myth-Checks
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Zero-cost and low-cost physics hacks to reduce indoor PM2.5 infiltration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {plan.indoorAirHacks.map((hack, idx) => (
            <article
              key={idx}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-teal-800">
                    <Lightbulb className="w-4 h-4 text-teal-800" aria-hidden="true" />
                    Indoor Strategy
                  </span>
                  <span className="text-xs font-semibold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {hack.estimatedExposureReduction}
                  </span>
                </div>

                <h4 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
                  {hack.title}
                </h4>

                <p className="text-base leading-relaxed text-slate-800 max-w-[65ch]">
                  {hack.instructions}
                </p>
              </div>

              {/* Myth Check Box */}
              <details className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 group">
                <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-rose-800 hover:text-rose-950 flex items-center justify-between select-none focus-visible:outline-hidden">
                  <span>Scientific Myth-Check</span>
                  <span className="text-xs font-normal lowercase text-slate-600 group-open:hidden">
                    (tap to verify)
                  </span>
                </summary>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed max-w-[65ch]">
                  {hack.mythCheck}
                </p>
              </details>
            </article>
          ))}
        </div>
      </section>

      {/* Community Action Callout */}
      {plan.communityAction && (
        <section
          aria-labelledby="community-action-heading"
          className="bg-teal-900 text-white rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
        >
          <div className="space-y-2">
            <span
              id="community-action-heading"
              className="text-[13px] tracking-[0.04em] font-semibold uppercase text-teal-200 flex items-center gap-2"
            >
              <HeartHandshake className="w-4 h-4 text-teal-200" aria-hidden="true" />
              Community &amp; Neighborhood Resilience
            </span>
            <p className="text-base sm:text-[17px] text-teal-50 max-w-[65ch] leading-[1.7]">
              {plan.communityAction}
            </p>
          </div>
        </section>
      )}

      {/* Prominent Visible Not Medical Advice Disclaimer */}
      <aside
        aria-label="Medical Disclaimer"
        className="p-5 sm:p-6 rounded-2xl bg-slate-100 border border-slate-200 text-sm text-slate-700 leading-relaxed flex items-start gap-3 shadow-2xs"
      >
        <Info className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1 max-w-[65ch]">
          <span className="font-bold text-slate-900 block">
            Decision-Support &amp; Medical Disclaimer
          </span>
          <p className="text-sm text-slate-700 leading-relaxed">
            {plan.disclaimer}
          </p>
          <p className="text-xs text-slate-600 leading-relaxed pt-1">
            Shwaas calculates exposure doses and reductions strictly from deterministic environmental equations and CPCB NAQI tables. Always consult a licensed pulmonologist or medical doctor for personal health symptoms, asthma management, or medication.
          </p>
        </div>
      </aside>
    </div>
  );
}
