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
  hasPurifier: boolean;
  maskType: MaskType;
  commuteType: CommuteType;
}

export default function BreathBudgetTracker({
  currentAqi,
  pm25,
  hasPurifier,
  maskType,
  commuteType,
}: BreathBudgetTrackerProps) {
  // Pre-populated realistic daily routine
  const [activities, setActivities] = useState<BudgetActivity[]>([
    {
      id: 'act-1',
      name: 'Morning Office / School Transit',
      timeOfDay: '08:30 AM',
      durationMinutes: 40,
      isPeakInversion: true,
      commuteType,
      maskType,
    },
    {
      id: 'act-2',
      name: 'Evening Market / Errands Walk',
      timeOfDay: '06:15 PM',
      durationMinutes: 30,
      isPeakInversion: true,
      commuteType: 'walk',
      maskType: 'none',
    },
    {
      id: 'act-3',
      name: 'Indoor Family Time & Night Sleep',
      timeOfDay: '10:00 PM',
      durationMinutes: 480,
      isPeakInversion: false,
      isIndoor: true,
      hasPurifier,
    },
  ]);

  const [newActName, setNewActName] = useState('');
  const [newActDuration, setNewActDuration] = useState(30);
  const [newActType, setNewActType] = useState<'walk' | 'two_wheeler' | 'metro'>('walk');
  const newActMask: MaskType = 'none';
  const [isAdding, setIsAdding] = useState(false);

  // Compute live budget
  const budget = calculateBreathBudget({
    currentAqi,
    pm25,
    hasPurifier,
    maskType,
    activities,
  });

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActName.trim()) return;

    const newActivity: BudgetActivity = {
      id: `act-${Date.now()}`,
      name: newActName.trim(),
      timeOfDay: '01:30 PM',
      durationMinutes: newActDuration,
      isPeakInversion: false,
      commuteType: newActType === 'metro' ? 'metro_bus_transit' : newActType,
      maskType: newActMask,
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
          return { ...a, maskType: nextMask };
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

  const handleToggleInversion = (id: string) => {
    setActivities(
      activities.map((a) => {
        if (a.id === id) {
          return { ...a, isPeakInversion: !a.isPeakInversion };
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
            <span id="breath-budget-heading">Personal Breath Budget</span>
          </div>
          <h3 className="mt-1 text-2xl font-serif font-bold text-slate-900 tracking-tight">
            Daily Exposure Allowance & Spending Ledger
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-2xl leading-relaxed">
            Think of particulate exposure like daily calories. Every high-smog activity spends your breath allowance; N95 masks discount the cost, and running your purifier gives you a clean-air refund.
          </p>
        </div>

        {/* Budget Status Badge */}
        <div
          role="status"
          className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs shrink-0"
          style={{
            backgroundColor: budget.statusColor,
            color: budget.statusTextColor,
          }}
        >
          <span>{budget.budgetStatus}</span>
          <span className="opacity-80">({budget.percentageUsed}% Spent)</span>
        </div>
      </div>

      {/* Meter Bar */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
          <span>Net Points Spent: {budget.netPointsSpent} pts</span>
          <span className="text-slate-500">Daily Safe Baseline: {budget.dailyAllowancePoints} pts</span>
        </div>

        <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex relative">
          {/* Safe 100 pt baseline marker */}
          <div
            className="absolute top-0 bottom-0 border-r-2 border-slate-400 z-10"
            style={{ left: '50%' }}
            title="100 Pt Safe Baseline Threshold"
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
          <span>0 pts</span>
          <span className="font-semibold text-slate-700">100 pts (WHO Baseline)</span>
          <span>200+ pts (Overdraft)</span>
        </div>
      </div>

      {/* Activity Spending Ledger */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
            Today&apos;s Activity Spending Ledger
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
                placeholder="e.g. Afternoon School Pick-Up"
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
                Travel Mode
              </label>
              <select
                id="new-act-type"
                value={newActType}
                onChange={(e) => setNewActType(e.target.value as any)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900"
              >
                <option value="walk">Walk</option>
                <option value="two_wheeler">Two-Wheeler</option>
                <option value="metro">Metro Transit</option>
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

            return (
              <div
                key={item.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs text-slate-900">{item.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-slate-100 text-slate-600">
                      {item.durationMinutes} min • {item.timeOfDay}
                    </span>
                    {act.isPeakInversion && !act.isIndoor && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-rose-50 text-rose-800 border border-rose-200">
                        Peak Inversion Window
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{item.explanation}</p>

                  {/* Quick Interactivity Toggles for this item */}
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
                        {act.maskType === 'n95_kn95' ? '✓ Wearing N95 (90% off)' : '+ Put on N95 Mask'}
                      </button>
                    )}

                    {!act.isIndoor && (
                      <button
                        type="button"
                        onClick={() => handleToggleInversion(act.id)}
                        className={`underline font-medium transition-colors ${
                          !act.isPeakInversion
                            ? 'text-teal-800 hover:text-teal-950'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {act.isPeakInversion
                          ? 'Shift to 1 PM afternoon'
                          : '✓ Afternoon Window'}
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
                        {act.hasPurifier ? '✓ Purifier Active (+Refund)' : '+ Turn on Purifier'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 sm:self-center self-end">
                  <div className="text-right">
                    {item.pointsRefund > 0 ? (
                      <div>
                        <span className="text-xs font-bold text-emerald-700 block">
                          +{item.pointsRefund} Refund
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Net: {item.netCost} pts
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-bold font-mono text-slate-900">
                        -{item.pointsCost} pts
                      </span>
                    )}
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

      {/* Summary Note */}
      <div className="pt-2 text-xs text-slate-500 flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-teal-800 shrink-0" />
        <span>
          <strong>Pro-tip:</strong> Shifting high-exposure morning routines to the 1 PM solar mixing window and deploying bedroom HEPA filtration can recover over 50% of your daily breath allowance.
        </span>
      </div>
    </section>
  );
}
