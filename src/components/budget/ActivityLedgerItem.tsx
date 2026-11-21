'use client';

import { BudgetActivity, BudgetActivityItemResult } from '@/lib/exposure/breathBudget';
import { Trash2 } from 'lucide-react';

interface ActivityLedgerItemProps {
  item: BudgetActivityItemResult;
  activity: BudgetActivity;
  onToggleMask: (id: string) => void;
  onShiftToAfternoon: (id: string) => void;
  onTogglePurifier: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function ActivityLedgerItem({
  item,
  activity,
  onToggleMask,
  onShiftToAfternoon,
  onTogglePurifier,
  onRemove,
}: ActivityLedgerItemProps) {
  const isAfternoon = activity.scheduledHour >= 12 && activity.scheduledHour <= 15;

  return (
    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm sm:text-base text-slate-900">{item.name}</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
            {item.durationMinutes} min • {item.timeOfDay} (PM2.5: <span className="font-mono">{item.appliedConcentrationUgM3} µg/m³</span>)
          </span>
          {item.mitigatedMassAvoidedUg > 0 && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              ~{item.mitigatedMassAvoidedUg} µg avoided
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-600 max-w-[65ch]">{item.explanation}</p>

        {/* Interactivity mitigation toggles */}
        <div className="mt-2.5 flex items-center gap-3.5 text-xs">
          {!activity.isIndoor && (
            <button
              type="button"
              onClick={() => onToggleMask(activity.id)}
              className={`underline font-medium transition-colors ${
                activity.maskType === 'n95_kn95'
                  ? 'text-emerald-800 hover:text-emerald-950'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {activity.maskType === 'n95_kn95' ? '✓ N95 Fitted (~75–85% off)' : '+ Put on N95 mask'}
            </button>
          )}

          {!activity.isIndoor && (
            <button
              type="button"
              onClick={() => onShiftToAfternoon(activity.id)}
              className={`underline font-medium transition-colors ${
                isAfternoon
                  ? 'text-teal-800 hover:text-teal-950'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAfternoon
                ? '✓ Shifted to 1 PM (Lower Smog)'
                : 'Shift to 1 PM solar window'}
            </button>
          )}

          {activity.isIndoor && (
            <button
              type="button"
              onClick={() => onTogglePurifier(activity.id)}
              className={`underline font-medium transition-colors ${
                activity.hasPurifier
                  ? 'text-emerald-800 hover:text-emerald-950'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {activity.hasPurifier ? '✓ HEPA Purifier Active' : '+ Turn on HEPA purifier'}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 sm:self-center self-end">
        <div className="text-right">
          <span className="text-sm font-bold font-mono text-slate-900 block">
            {item.pointsSpent} pts
          </span>
          <span className="text-xs text-slate-600">
            ~{item.inhaledMassUg} µg intake
          </span>
        </div>

        <button
          type="button"
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.name}`}
          className="p-2 text-slate-500 hover:text-rose-600 transition-colors rounded-lg focus-visible:ring-2 focus-visible:ring-rose-500"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
