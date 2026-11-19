'use client';

import { useState } from 'react';
import {
  VentilationStrategy,
  CookingFuel,
  calculateIndoorMassBalance,
  DEFAULT_ROOM_AREA_SQM,
  DEFAULT_CEILING_HEIGHT_M,
  DEFAULT_PURIFIER_CADR_M3H,
} from '@/lib/exposure/engine';
import { Home, AlertCircle, Sliders, ShieldCheck } from 'lucide-react';

interface IndoorAirModelProps {
  outdoorPm25: number;
}

export default function IndoorAirModel({ outdoorPm25 }: IndoorAirModelProps) {
  const [roomArea, setRoomArea] = useState<number>(DEFAULT_ROOM_AREA_SQM);
  const ceilingHeight = DEFAULT_CEILING_HEIGHT_M;
  const [ventilation, setVentilation] = useState<VentilationStrategy>('sealed_windows');
  const [cookingFuel, setCookingFuel] = useState<CookingFuel>('lpg_electric');
  const [hasPurifier, setHasPurifier] = useState<boolean>(true);
  const [cadr, setCadr] = useState<number>(DEFAULT_PURIFIER_CADR_M3H);
  const indoorHours = 20;

  const balance = calculateIndoorMassBalance(
    outdoorPm25,
    {
      roomAreaSqM: roomArea,
      ceilingHeightM: ceilingHeight,
      ventilationStrategy: ventilation,
      cookingFuel,
      hasPurifier,
      cadrM3H: cadr,
    },
    indoorHours
  );

  const infiltrationPercentage =
    outdoorPm25 > 0
      ? Math.round((balance.estimatedIndoorConcentration / outdoorPm25) * 100)
      : 50;

  return (
    <section
      aria-labelledby="indoor-model-heading"
      className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800">
            <Home className="w-4 h-4 text-teal-800" aria-hidden="true" />
            <span id="indoor-model-heading">Indoor Air Mass-Balance Micro-Environment</span>
          </div>
          <h3 className="mt-1 text-2xl font-serif font-bold text-slate-900 tracking-tight">
            Single-Zone Room Air Quality Model
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-2xl leading-relaxed">
            Estimates indoor PM2.5 steady-state concentrations based on room volume, building envelope air exchange rate (AER), Clean Air Delivery Rate (CADR), and internal emission sources.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium shrink-0">
          Model Estimate (Non-Sensor)
        </div>
      </div>

      {/* Comparison Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Outdoor Ambient PM2.5
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-serif font-bold text-slate-900">{Math.round(outdoorPm25)}</span>
            <span className="text-xs text-slate-500">µg/m³</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Surrounding outdoor air</span>
        </div>

        <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-100">
          <span className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider block">
            Estimated Indoor PM2.5
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-serif font-bold text-teal-950">
              {balance.estimatedIndoorConcentration}
            </span>
            <span className="text-xs text-teal-700">µg/m³</span>
          </div>
          <span className="text-[11px] text-teal-800 mt-1 block font-medium">
            ~{infiltrationPercentage}% of outdoor levels
          </span>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
            Daily Particulate Avoided
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-serif font-bold text-emerald-950">
              {Math.round(balance.indoorExposureAvoidedPerDayUg)}
            </span>
            <span className="text-xs text-emerald-700">µg</span>
          </div>
          <span className="text-[11px] text-emerald-800 mt-1 block font-medium">
            Over {indoorHours} indoor hours via filtration
          </span>
        </div>
      </div>

      {/* Configurable Parameters Grid */}
      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700">
          <Sliders className="w-3.5 h-3.5 text-teal-800" />
          <span>Room Geometry & Mitigation Controls</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label htmlFor="room-area" className="block text-slate-700 font-medium mb-1">
              Room Area: {roomArea} m² (~{Math.round(roomArea * 10.76)} sq ft)
            </label>
            <input
              id="room-area"
              type="range"
              min="8"
              max="50"
              step="1"
              value={roomArea}
              onChange={(e) => setRoomArea(parseInt(e.target.value) || 16)}
              className="w-full accent-teal-800"
            />
          </div>

          <div>
            <label htmlFor="indoor-ventilation" className="block text-slate-700 font-medium mb-1">
              Window Enclosure
            </label>
            <select
              id="indoor-ventilation"
              value={ventilation}
              onChange={(e) => setVentilation(e.target.value as VentilationStrategy)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900"
            >
              <option value="sealed_windows">Sealed Windows (AER ~0.35 h⁻¹)</option>
              <option value="timed_afternoon">Timed Afternoon Flush (AER ~0.65 h⁻¹)</option>
              <option value="windows_open">Windows Regularly Kept Open (AER ~2.5 h⁻¹)</option>
            </select>
          </div>

          <div>
            <label htmlFor="indoor-purifier" className="block text-slate-700 font-medium mb-1">
              Filtration Unit
            </label>
            <select
              id="indoor-purifier"
              value={hasPurifier ? cadr : 0}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val === 0) {
                  setHasPurifier(false);
                } else {
                  setHasPurifier(true);
                  setCadr(val);
                }
              }}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900"
            >
              <option value="0">No Purifier Active</option>
              <option value="200">Compact HEPA (CADR 200 m³/h)</option>
              <option value="250">Standard HEPA (CADR 250 m³/h)</option>
              <option value="350">High-CADR Purifier (350 m³/h)</option>
              <option value="300">DIY Box-Fan + MERV 13 (~300 m³/h)</option>
            </select>
          </div>

          <div>
            <label htmlFor="indoor-cooking" className="block text-slate-700 font-medium mb-1">
              Cooking Combustion Source
            </label>
            <select
              id="indoor-cooking"
              value={cookingFuel}
              onChange={(e) => setCookingFuel(e.target.value as CookingFuel)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900"
            >
              <option value="lpg_electric">LPG / Electric Induction (Clean)</option>
              <option value="biomass_kerosene">Kerosene / Biomass Pellets</option>
              <option value="wood">Unvented Wood / Charcoal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Practical Indoor Safety & Quality Rules */}
      <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
        <div className="space-y-1.5">
          <span className="font-bold text-slate-900 block flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-800" />
            Recommended Indoor Actions:
          </span>
          <p>• Keep windows sealed when outdoor AQI is higher than indoor air.</p>
          <p>• Flush the home for 15 minutes during the warmest afternoon hours to disperse indoor CO₂ without trapping night smog.</p>
          <p>• Clean room floors using damp wet-mops rather than dry brooms to prevent dust re-suspension.</p>
        </div>

        <div className="space-y-1.5">
          <span className="font-bold text-rose-800 block flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
            Combustion Hazards to Avoid:
          </span>
          <p>• Avoid burning incense sticks (agarbatti), dhoop, or mosquito coils inside closed bedrooms; they produce concentrated ultrafine PM2.5.</p>
          <p>• Never run open charcoal kangris or unvented heaters in closed sleeping quarters (carbon monoxide risk).</p>
        </div>
      </div>
    </section>
  );
}
