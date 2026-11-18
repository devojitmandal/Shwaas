'use client';

import { useState } from 'react';
import {
  BudgetActivity,
  calculateBreathBudget,
} from '@/lib/exposure/breathBudget';
import { MaskType, CommuteType } from '@/lib/exposure/engine';
import {
  BatteryCharging,
  Plus,
  Trash2,
  Info,
} from 'lucide-react';

interface BreathBudgetTrackerProps {
  currentAqi: number;
  pm25: number;
  hourlyPm25Forecast?: number[];
  hasPurifier: boolean;
  maskType: MaskType;
  commuteType: CommuteType;
}

export default function BreathBudgetTracker({
  currentAqi,
  pm25,
  hourlyPm25Forecast = [],
  hasPurifier,
  maskType,
  commuteType,
}: BreathBudgetTrackerProps) {
  // Configured realistic daily routine with scheduled hour
  const [activities, setActivities] = useState<BudgetActivity[]>([
    {
      id: 'act-1',
      name: 'Morning Office / School Transit',
      timeOfDay: '08:30 AM',
      scheduledHour: 8,
      durationMinutes: 45,
      intensity: 'moderate_commute',
      commuteType,
      maskType,
    },
    {
      id: 'act-2',
      name: 'Evening Market / Errands Walk',
      timeOfDay: '06:30 PM',
      scheduledHour: 18,
      durationMinutes: 30,
      intensity: 'moderate_commute',
      commuteType: 'walk',
      maskType: 'none',
    },
    {
      id: 'act-3',
      name: 'Indoor Clean-Room Rest & Night Sleep',
      timeOfDay: '10:00 PM',
      scheduledHour: 22,
      durationMinutes: 480,
      intensity: 'sleep_rest',
      isIndoor: true,
      hasPurifier,
    },
  ]);

  const [newActName, setNewActName] = useState('');
  const [newActDuration, setNewActDuration] = useState(30);
  const [newActHour, setNewActHour] = useState(13); // default to afternoon
  const [newActType, setNewActType] = useState<'walk' | 'two_wheeler' | 'metro'>('walk');
  const [isAdding, setIsAdding] = useState(false);

  // Compute live budget using scientific mass-balance engine
  const budget = calculateBreathBudget({
    currentAqi,
    currentPm25: pm25,
    hourlyPm25Forecast,
    hasPurifier,
    maskType,
    activities,
  });

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActName.trim()) return;

    const formattedTime = `${newActHour % 12 || 12}:00 ${newActHour >= 12 ? 'PM' : 'AM'}`;
    const newActivity: BudgetActivity = {
      id: `act-${Date.now()}`,
      name: newActName.trim(),
      timeOfDay: formattedTime,
      scheduledHour: newActHour,
      durationMinutes: newActDuration,
      intensity: newActType === 'walk' || newActType === 'two_wheeler' ? 'moderate_commute' : 'light_transit',
      commuteType: newActType === 'metro' ? 'metro_bus_transit' : newActType,
      maskType: 'none',
    };

    setActivities([...activities, newActivity]);
    setNewActName('');
    setIsAdding(false);
  };

  const handleRemove = (id: string) => {
    setActivities(activities.filter((a) => a.id !== id));
  };

  const handleToggleMask = (id: string) => {
    setActivities(
      activities.map((a) => {
        if (a.id === id) {
          const nextMask: MaskType = a.maskType === 'n95_kn95' ? 'none' : 'n95_kn95';
          return { ...a, maskType: nextMask, maskFit: 'typical_fit' };
        }
        return a;
      })
    );
  };

  const handleTogglePurifier = (id: string) => {
    setActivities(
      activities.map((a) => {
        if (a.id === id) {
          return { ...a, hasPurifier: !a.hasPurifier };
        }
        return a;
      })
    );
  };

  const handleShiftToAfternoon = (id: string) => {
    setActivities(
      activities.map((a) => {
        if (a.id === id) {
          const isAfternoon = a.scheduledHour >= 12 && a.scheduledHour <= 15;
          const nextHour = isAfternoon ? 8 : 13;
          const timeLabel = isAfternoon ? '08:30 AM' : '01:30 PM';
          return {
            ...a,
            scheduledHour: nextHour,
            timeOfDay: timeLabel,
          };
        }
        return a;
      })
    );
  };

  return (
    <section
      aria-labelledby="breath-budget-heading"
      className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800">
            <BatteryCharging className="w-4 h-4 text-teal-800" aria-hidden="true" />
            <span id="breath-budget-heading">Relative Exposure-Management Score</span>
          </div>
          <h3 className="mt-1 text-2xl font-serif font-bold text-slate-900 tracking-tight">
            Daily Breath Budget Ledger
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-2xl leading-relaxed">
            A relative personal exposure index calibrated against the WHO 24-hr guideline benchmark (100 relative points = reference intake of 24 hours at 15 µg/m³).
          </p>
        </div>

        {/* Status Badge */}
        <div
          role="status"
          className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs shrink-0"
          style={{
            backgroundColor: budget.statusColor,
            color: budget.statusTextColor,
          }}
        >
          <span>{budget.budgetStatus}</span>
          <span className="opacity-80">({budget.percentageOfReferenceIntake}% of Reference)</span>
        </div>
      </div>

      {/* Scientific Clarification Box */}
      <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-100 flex items-start gap-2.5 text-xs text-teal-950">
        <Info className="w-4 h-4 text-teal-800 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">
          <strong>Decision-Support Notice:</strong> The 100-point Breath Budget is a comparative lifestyle-management score, not a medical safety threshold. Fine particulate matter (PM2.5) has no established safe lower limit. Use this ledger to schedule outdoor routines during cleaner forecast windows and protect indoor breathing air.
        </p>
      </div>

      {/* Progress Bar / Scale */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
          <span>Inhaled Burden: {budget.netPointsSpent} points (~{budget.totalInhaledMassUg} µg PM2.5)</span>
          <span className="text-slate-500">Reference Benchmark: 100 points (216 µg)</span>
        </div>

        <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex relative">
          {/* Reference baseline marker */}
          <div
            className="absolute top-0 bottom-0 border-r-2 border-slate-500 z-10"
            style={{ left: '50%' }}
            title="100 Pt Reference Level"
          />
          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{
              width: `${Math.min(100, (budget.netPointsSpent / 200) * 100)}%`,
              backgroundColor: budget.statusColor,
            }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>0 pts (Clean)</span>
          <span className="font-semibold text-slate-700">100 pts (WHO 15 µg/m³ Benchmark)</span>
          <span>200+ pts (Severe Burden)</span>
        </div>
      </div>

      {/* Activity Spending Ledger */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
            Daily Activities & Exposure Breakdown
          </h4>
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="text-xs font-medium text-teal-800 hover:text-teal-950 flex items-center gap-1 focus-visible:outline-hidden"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAdding ? 'Close Form' : 'Add Activity'}</span>
          </button>
        </div>

        {/* Add custom activity inline form */}
        {isAdding && (
          <form
            onSubmit={handleAddActivity}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs"
          >
            <div className="sm:col-span-2">
              <label htmlFor="new-act-name" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Activity Name
              </label>
              <input
                id="new-act-name"
                type="text"
                placeholder="e.g. Afternoon School Run"
                value={newActName}
                onChange={(e) => setNewActName(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900"
                required
              />
            </div>
            <div>
              <label htmlFor="new-act-duration" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Duration (Mins)
              </label>
              <input
                id="new-act-duration"
                type="number"
                min="5"
                max="300"
                value={newActDuration}
                onChange={(e) => setNewActDuration(parseInt(e.target.value) || 15)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900"
              />
            </div>
            <div>
              <label htmlFor="new-act-type" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Mode / Type
              </label>
              <select
                id="new-act-type"
                value={newActType}
                onChange={(e) => setNewActType(e.target.value as 'walk' | 'two_wheeler' | 'metro')}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900"
              >
                <option value="walk">Walking / Jogging</option>
                <option value="two_wheeler">Two-Wheeler / Bike</option>
                <option value="metro">Metro / Closed Bus</option>
              </select>
            </div>
            <div>
              <label htmlFor="new-act-hour" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Time Window
              </label>
              <select
                id="new-act-hour"
                value={newActHour}
                onChange={(e) => setNewActHour(parseInt(e.target.value) || 13)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900"
              >
                <option value="8">Morning (08:00 AM)</option>
                <option value="13">Afternoon (01:00 PM - Cleaner)</option>
                <option value="18">Evening (06:00 PM)</option>
                <option value="21">Night (09:00 PM)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-md font-semibold"
              >
                Add Activity
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
          {budget.items.map((item) => {
            const act = activities.find((a) => a.id === item.id);
            if (!act) return null;

            const isAfternoon = act.scheduledHour >= 12 && act.scheduledHour <= 15;

            return (
              <div
                key={item.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs text-slate-900">{item.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-slate-100 text-slate-600">
                      {item.durationMinutes} min • {item.timeOfDay} (PM2.5: {item.appliedConcentrationUgM3} µg/m³)
                    </span>
                    {item.mitigatedMassAvoidedUg > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-800 border border-emerald-200">
                        ~{item.mitigatedMassAvoidedUg} µg Avoided
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{item.explanation}</p>

                  {/* Interactivity mitigation toggles */}
                  <div className="mt-2 flex items-center gap-3 text-[11px]">
                    {!act.isIndoor && (
                      <button
                        type="button"
                        onClick={() => handleToggleMask(act.id)}
                        className={`underline font-medium transition-colors ${
                          act.maskType === 'n95_kn95'
                            ? 'text-emerald-700 hover:text-emerald-900'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {act.maskType === 'n95_kn95' ? '✓ N95 Fitted (~75–85% off)' : '+ Put on N95 Mask'}
                      </button>
                    )}

                    {!act.isIndoor && (
                      <button
                        type="button"
                        onClick={() => handleShiftToAfternoon(act.id)}
                        className={`underline font-medium transition-colors ${
                          isAfternoon
                            ? 'text-teal-800 hover:text-teal-950'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {isAfternoon
                          ? '✓ Shifted to 1 PM (Lower Smog)'
                          : 'Shift to 1 PM Solar Window'}
                      </button>
                    )}

                    {act.isIndoor && (
                      <button
                        type="button"
                        onClick={() => handleTogglePurifier(act.id)}
                        className={`underline font-medium transition-colors ${
                          act.hasPurifier
                            ? 'text-emerald-700 hover:text-emerald-900'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {act.hasPurifier ? '✓ HEPA Purifier Active' : '+ Turn on HEPA Purifier'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 sm:self-center self-end">
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-slate-900 block">
                      {item.pointsSpent} pts
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ~{item.inhaledMassUg} µg intake
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
