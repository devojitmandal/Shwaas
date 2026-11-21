'use client';

import { HouseholdProfile } from '@/lib/validation/profileSchema';
import { Users, Edit3 } from 'lucide-react';

interface ProfileBadgeProps {
  profile: HouseholdProfile;
  onEditClick: () => void;
}

export default function ProfileBadge({ profile, onEditClick }: ProfileBadgeProps) {
  const hasKids = profile.numKids > 0;
  const hasElderly = profile.numElderly > 0;
  const vulnerableCount = profile.numKids + profile.numElderly;

  const commuteLabelMap: Record<string, string> = {
    walk: 'Walking',
    bicycle: 'Bicycle',
    two_wheeler: 'Two-Wheeler',
    car_open: 'Car (Non-AC)',
    car_ac: 'Car (Closed AC)',
    metro_bus_transit: 'Metro Transit',
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start sm:items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-800 shrink-0">
          <Users className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-sm sm:text-base font-bold text-slate-900">
              Active Household Profile
            </span>
            {vulnerableCount > 0 ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300">
                {vulnerableCount} Vulnerable Member{vulnerableCount > 1 ? 's' : ''} (
                {hasKids ? `${profile.numKids} kid${profile.numKids > 1 ? 's' : ''}` : ''}
                {hasKids && hasElderly ? ', ' : ''}
                {hasElderly ? `${profile.numElderly} senior${profile.numElderly > 1 ? 's' : ''}` : ''})
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                Adults only
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-3 text-sm text-slate-600 flex-wrap">
            <span>Commute: {commuteLabelMap[profile.commuteType] ?? profile.commuteType}</span>
            <span>•</span>
            <span>Outdoor: <span className="font-mono">{profile.outdoorHours}</span>h/day</span>
            <span>•</span>
            <span>Purifier: {profile.hasPurifier ? 'Yes' : 'None'}</span>
            <span>•</span>
            <span>Mask: {profile.maskType === 'n95_kn95' ? 'N95 Respirator' : profile.maskType === 'cloth_surgical' ? 'Cloth / Surgical' : 'None'}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onEditClick}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition-colors shrink-0 min-h-[44px] focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:outline-hidden"
      >
        <Edit3 className="w-4 h-4 text-teal-800" aria-hidden="true" />
        <span>Adjust Profile</span>
      </button>
    </div>
  );
}
