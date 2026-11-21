'use client';

import { useState } from 'react';
import {
  BudgetActivity,
  calculateBreathBudget,
  calculateHouseholdPerPersonBudgets,
  WhatIfBudgetOverrides,
} from '@/lib/exposure/breathBudget';
import { MaskType, CommuteType } from '@/lib/exposure/engine';
import {
  BatteryCharging,
  Plus,
  Info,
  ShieldCheck,
  Wind,
  Train,
  Sun,
  Users,
} from 'lucide-react';
import MemberBudgetCard from './MemberBudgetCard';
import AddActivityForm from './AddActivityForm';
import ActivityLedgerItem from './ActivityLedgerItem';

interface BreathBudgetTrackerProps {
  currentAqi: number;
  pm25: number;
  hourlyPm25Forecast?: number[];
  hasPurifier: boolean;
  maskType: MaskType;
  commuteType: CommuteType;
  numKids?: number;
  numElderly?: number;
  outdoorHours?: number;
}

export default function BreathBudgetTracker({
  currentAqi,
  pm25,
  hourlyPm25Forecast = [],
  hasPurifier,
  maskType,
  commuteType,
  numKids = 0,
  numElderly = 0,
  outdoorHours = 2.5,
}: BreathBudgetTrackerProps) {
  // What-If live interactive overrides affecting all household member budgets
  const [whatIf, setWhatIf] = useState<WhatIfBudgetOverrides>({});

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

  // Compute live per-person budgets across all household members
  const memberBudgets = calculateHouseholdPerPersonBudgets(
    {
      numKids,
      numElderly,
      commuteType,
      hasPurifier,
      maskType,
      outdoorHours,
    },
    pm25,
    hourlyPm25Forecast,
    whatIf
  );

  // Compute live ledger budget for primary user
  const effectiveMask = whatIf.maskType ?? maskType;
  const effectivePurifier = whatIf.hasPurifier ?? hasPurifier;
  const budget = calculateBreathBudget({
    currentAqi,
    currentPm25: pm25,
    hourlyPm25Forecast,
    hasPurifier: effectivePurifier,
    maskType: effectiveMask,
    activities,
  });

  const handleToggleWhatIfMask = () => {
    setWhatIf((prev) => ({
      ...prev,
      maskType: prev.maskType === 'n95_kn95' ? undefined : 'n95_kn95',
    }));
  };

  const handleToggleWhatIfPurifier = () => {
    setWhatIf((prev) => ({
      ...prev,
      hasPurifier: prev.hasPurifier ? undefined : true,
    }));
  };

  const handleToggleWhatIfMetro = () => {
    setWhatIf((prev) => ({
      ...prev,
      commuteType: prev.commuteType === 'metro_bus_transit' ? undefined : 'metro_bus_transit',
    }));
  };

  const handleToggleWhatIfShift = () => {
    setWhatIf((prev) => ({
      ...prev,
      shiftedWindow: !prev.shiftedWindow,
    }));
  };

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
          <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-teal-800">
            <BatteryCharging className="w-4 h-4 text-teal-800" aria-hidden="true" />
            <span id="breath-budget-heading">Relative Exposure-Management Score</span>
          </div>
          <h3 className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Daily Breath Budget Ledger
          </h3>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-[65ch] leading-relaxed">
            A relative personal exposure index calibrated against the WHO 24-hr guideline benchmark (100 relative points = reference intake of 24 hours at 15 µg/m³).
          </p>
        </div>

        {/* Status Badge */}
        <div
          role="status"
          className="min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-2xs shrink-0"
          style={{
            backgroundColor: budget.statusColor,
            color: budget.statusTextColor,
          }}
        >
          <span>{budget.budgetStatus}</span>
          <span className="opacity-90">({budget.percentageOfReferenceIntake}% of reference)</span>
        </div>
      </div>

      {/* Scientific Clarification Box */}
      <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-100 flex items-start gap-3 text-sm text-teal-950">
        <Info className="w-5 h-5 text-teal-800 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed max-w-[65ch]">
          <strong>Decision-Support Notice:</strong> The 100-point Breath Budget is a comparative lifestyle-management score, not a medical safety threshold. Fine particulate matter (PM2.5) has no established safe lower limit. Use this ledger to schedule outdoor routines during cleaner forecast windows and protect indoor breathing air.
        </p>
      </div>

      {/* Interactive What-If Mitigation Controls */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-800" />
            Live What-If Mitigation Toggles (Updates All Members)
          </span>
          <span className="text-xs text-slate-600">
            Click to simulate instant exposure reductions across your family
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handleToggleWhatIfMask}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium border flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-teal-700 ${
              whatIf.maskType === 'n95_kn95'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{whatIf.maskType === 'n95_kn95' ? '✓ Fitted N95 Active' : '+ Simulate N95 Mask'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleWhatIfPurifier}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium border flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-teal-700 ${
              whatIf.hasPurifier
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Wind className="w-4 h-4" />
            <span>{whatIf.hasPurifier ? '✓ Clean-Room HEPA Active' : '+ Simulate Indoor Purifier'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleWhatIfMetro}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium border flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-teal-700 ${
              whatIf.commuteType === 'metro_bus_transit'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Train className="w-4 h-4" />
            <span>{whatIf.commuteType === 'metro_bus_transit' ? '✓ Metro Transit Active' : '+ Shift to Metro'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleWhatIfShift}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium border flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-teal-700 ${
              whatIf.shiftedWindow
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>{whatIf.shiftedWindow ? '✓ 1 PM Window Active' : '+ Shift Outdoors to 1 PM'}</span>
          </button>
        </div>
      </div>

      {/* Per-Person Household Budgets Side-by-Side */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h4 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-slate-800 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-teal-800" />
            Per-Person Household Breath Budgets
          </h4>
          <span className="text-xs text-slate-600">
            Age-appropriate inhalation rates (EPA Exposure Factors Handbook)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {memberBudgets.map((member) => (
            <MemberBudgetCard key={member.memberType} member={member} />
          ))}
        </div>
      </div>

      {/* Progress Bar / Scale */}
      <div>
        <div className="flex items-center justify-between text-sm font-semibold text-slate-800 mb-2">
          <span>Inhaled burden: {budget.netPointsSpent} points (~{budget.totalInhaledMassUg} µg PM2.5)</span>
          <span className="text-slate-600">Reference benchmark: 100 points (216 µg)</span>
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

        <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
          <span>0 pts (Clean)</span>
          <span className="font-semibold text-slate-800">100 pts (WHO 15 µg/m³ Benchmark)</span>
          <span>200+ pts (Severe Burden)</span>
        </div>
      </div>

      {/* Activity Spending Ledger */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-slate-800">
            Daily Activities & Exposure Breakdown
          </h4>
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="min-h-[44px] px-3.5 py-1.5 text-sm font-medium text-teal-800 hover:text-teal-950 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-teal-700"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdding ? 'Close form' : 'Add activity'}</span>
          </button>
        </div>

        {/* Add custom activity inline form */}
        {isAdding && (
          <AddActivityForm
            name={newActName}
            onNameChange={setNewActName}
            duration={newActDuration}
            onDurationChange={setNewActDuration}
            hour={newActHour}
            onHourChange={setNewActHour}
            type={newActType}
            onTypeChange={setNewActType}
            onSubmit={handleAddActivity}
          />
        )}

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
          {budget.items.map((item) => {
            const act = activities.find((a) => a.id === item.id);
            if (!act) return null;

            return (
              <ActivityLedgerItem
                key={item.id}
                item={item}
                activity={act}
                onToggleMask={handleToggleMask}
                onShiftToAfternoon={handleShiftToAfternoon}
                onTogglePurifier={handleTogglePurifier}
                onRemove={handleRemove}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
