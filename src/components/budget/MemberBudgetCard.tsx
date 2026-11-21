'use client';

import { MemberBudgetResult } from '@/lib/exposure/breathBudget';

interface MemberBudgetCardProps {
  member: MemberBudgetResult;
}

export default function MemberBudgetCard({ member }: MemberBudgetCardProps) {
  return (
    <div
      key={member.memberType}
      className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs flex flex-col justify-between space-y-3"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-sm font-bold text-slate-900 block">{member.label}</span>
            <span className="text-xs text-slate-600 font-medium">{member.ageCategory}</span>
          </div>
          <span
            className="px-2.5 py-1 rounded-full text-xs font-bold shrink-0"
            style={{
              backgroundColor: member.statusColor,
              color: member.statusTextColor,
            }}
          >
            {member.status}
          </span>
        </div>

        <div className="mt-3 text-xs text-slate-700 space-y-1">
          <div className="flex justify-between">
            <span>Sedentary inhalation:</span>
            <span className="font-mono font-medium">{member.sedentaryBreathingRate} m³/h</span>
          </div>
          <div className="flex justify-between">
            <span>Active inhalation:</span>
            <span className="font-mono font-medium">{member.activeBreathingRate} m³/h</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
          <span>{member.pointsSpent} pts</span>
          <span className="text-xs font-normal text-slate-600">
            Ref: 100 pts ({member.referenceDailyMassUg} µg)
          </span>
        </div>

        <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden flex relative">
          {/* Reference line at 50% (100 pt benchmark out of 200 pt max) */}
          <div
            className="absolute top-0 bottom-0 border-r-2 border-slate-400 z-10"
            style={{ left: '50%' }}
            title="100 Pt Benchmark"
          />
          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{
              width: `${Math.min(100, (member.pointsSpent / 200) * 100)}%`,
              backgroundColor: member.statusColor,
            }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
          <span>~{member.inhaledMassUg} µg PM2.5</span>
          {member.avoidedMassUg > 0 ? (
            <span className="text-emerald-800 font-semibold">~{member.avoidedMassUg} µg avoided</span>
          ) : (
            <span>Unmitigated</span>
          )}
        </div>
      </div>
    </div>
  );
}
