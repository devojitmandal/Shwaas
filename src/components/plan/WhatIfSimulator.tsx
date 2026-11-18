'use client';

import { useState } from 'react';
import {
  ExposureProfile,
  evaluateWhatIf,
  WhatIfScenarioResult,
  CommuteType,
  MaskType,
  VentilationStrategy,
} from '@/lib/exposure/engine';
import { Sliders, ArrowRight, Zap, Check, AlertCircle } from 'lucide-react';

interface WhatIfSimulatorProps {
  currentProfile: ExposureProfile;
}

export default function WhatIfSimulator({ currentProfile }: WhatIfSimulatorProps) {
  // Scenario simulation state
  const [hypoCommute, setHypoCommute] = useState<CommuteType>(currentProfile.commuteType);
  const [hypoMask, setHypoMask] = useState<MaskType>(currentProfile.maskType);
  const [hypoPurifier, setHypoPurifier] = useState<boolean>(currentProfile.hasPurifier);
  const [hypoVentilation, setHypoVentilation] = useState<VentilationStrategy>(
    currentProfile.ventilationStrategy
  );
  const [hypoOutdoorHours, setHypoOutdoorHours] = useState<number>(
    currentProfile.timeOutdoorsHours
  );

  // Compute live what-if evaluation
  const result: WhatIfScenarioResult = evaluateWhatIf(currentProfile, {
    commuteType: hypoCommute,
    maskType: hypoMask,
    hasPurifier: hypoPurifier,
    ventilationStrategy: hypoVentilation,
    timeOutdoorsHours: hypoOutdoorHours,
    indoorHours: Math.max(0, 24 - hypoOutdoorHours),
  });

  const isDoseReduced = result.doseReductionPercent > 0;
  const isDoseIncreased = result.doseReductionPercent < 0;

  return (
    <section
      aria-labelledby="what-if-heading"
      className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800">
            <Sliders className="w-4 h-4 text-teal-800" aria-hidden="true" />
            <span id="what-if-heading">Real-Time What-If Sandbox</span>
          </div>
          <h3 className="mt-1 text-2xl font-serif font-bold text-slate-900 tracking-tight">
            Simulate Interventions & Measure Gain
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Toggle lifestyle changes below to see immediate deterministic re-computations of your daily exposure.
          </p>
        </div>

        {/* Live Delta Callout */}
        <div
          role="status"
          aria-live="polite"
          className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 shrink-0 ${
            isDoseReduced
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : isDoseIncreased
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <Zap className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>
            {isDoseReduced
              ? `–${result.doseReductionPercent}% Inhaled Dose (${result.doseDifference} µg·h/m³ saved)`
              : isDoseIncreased
              ? `+${Math.abs(result.doseReductionPercent)}% Inhaled Dose (Risk Increase)`
              : 'Baseline (No Change)'}
          </span>
        </div>
      </div>

      {/* Preset Scenario Buttons for Fast One-Click Simulation */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs font-semibold text-slate-500 mr-1">Quick Scenarios:</span>
        <button
          type="button"
          onClick={() => {
            setHypoCommute('metro_bus_transit');
            setHypoMask('n95_kn95');
          }}
          className="px-3 py-1.5 rounded-full text-xs bg-slate-100 hover:bg-teal-50 hover:text-teal-900 font-medium text-slate-700 transition-colors border border-slate-200"
        >
          Metro + N95 Respirator
        </button>
        <button
          type="button"
          onClick={() => {
            setHypoPurifier(true);
            setHypoVentilation('sealed_windows');
          }}
          className="px-3 py-1.5 rounded-full text-xs bg-slate-100 hover:bg-teal-50 hover:text-teal-900 font-medium text-slate-700 transition-colors border border-slate-200"
        >
          Deploy Purifier + Seal Windows
        </button>
        <button
          type="button"
          onClick={() => {
            setHypoOutdoorHours(Math.max(0.5, currentProfile.timeOutdoorsHours * 0.5));
          }}
          className="px-3 py-1.5 rounded-full text-xs bg-slate-100 hover:bg-teal-50 hover:text-teal-900 font-medium text-slate-700 transition-colors border border-slate-200"
        >
          Cut Outdoor Time by 50%
        </button>
        <button
          type="button"
          onClick={() => {
            setHypoCommute(currentProfile.commuteType);
            setHypoMask(currentProfile.maskType);
            setHypoPurifier(currentProfile.hasPurifier);
            setHypoVentilation(currentProfile.ventilationStrategy);
            setHypoOutdoorHours(currentProfile.timeOutdoorsHours);
          }}
          className="px-3 py-1.5 rounded-full text-xs text-slate-500 hover:text-slate-800 transition-colors ml-auto"
        >
          Reset to My Profile
        </button>
      </div>

      {/* Interactive Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
        <div>
          <label htmlFor="sim-commute" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Commute Mode
          </label>
          <select
            id="sim-commute"
            value={hypoCommute}
            onChange={(e) => setHypoCommute(e.target.value as any)}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white text-slate-900"
          >
            <option value="two_wheeler">Two-Wheeler</option>
            <option value="walk">Walking</option>
            <option value="bicycle">Bicycle</option>
            <option value="car_open">Car (Open / Non-AC)</option>
            <option value="car_ac">Car (Closed AC)</option>
            <option value="metro_bus_transit">Metro / Closed Transit</option>
          </select>
        </div>

        <div>
          <label htmlFor="sim-mask" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Outdoor Mask
          </label>
          <select
            id="sim-mask"
            value={hypoMask}
            onChange={(e) => setHypoMask(e.target.value as any)}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white text-slate-900"
          >
            <option value="none">No Mask</option>
            <option value="cloth_surgical">Cloth / Surgical Mask</option>
            <option value="n95_kn95">N95 / FFP2 Respirator</option>
          </select>
        </div>

        <div>
          <label htmlFor="sim-purifier" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Indoor HEPA / Box-Fan
          </label>
          <select
            id="sim-purifier"
            value={hypoPurifier ? 'yes' : 'no'}
            onChange={(e) => setHypoPurifier(e.target.value === 'yes')}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white text-slate-900"
          >
            <option value="yes">Running Purifier / DIY Filter</option>
            <option value="no">No Mechanical Purifier</option>
          </select>
        </div>

        <div>
          <label htmlFor="sim-ventilation" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Window Sealing
          </label>
          <select
            id="sim-ventilation"
            value={hypoVentilation}
            onChange={(e) => setHypoVentilation(e.target.value as any)}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white text-slate-900"
          >
            <option value="sealed_windows">Sealed Windows</option>
            <option value="timed_afternoon">Timed Afternoon Flush</option>
            <option value="windows_open">Windows Kept Open</option>
          </select>
        </div>
      </div>

      {/* Comparison Verdict Strip */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="font-semibold text-slate-900">Engine Verdict:</span>
          <span>{result.verdict}</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
          <span>Current: {result.originalDose} µg·h/m³</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <span className="font-semibold text-slate-900">Simulated: {result.newDose} µg·h/m³</span>
        </div>
      </div>
    </section>
  );
}
