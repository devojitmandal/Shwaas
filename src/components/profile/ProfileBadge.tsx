'use client';

import { HouseholdProfile } from '@/lib/validation/profileSchema';
import { Home, Users, Shield, Wind, Sparkles, Edit3 } from 'lucide-react';

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
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-800 shrink-0">
          <Users className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-900">
              Active Household Profile
            </span>
            {vulnerableCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                {vulnerableCount} Vulnerable Member{vulnerableCount > 1 ? 's' : ''} (
                {hasKids ? `${profile.numKids} kid${profile.numKids > 1 ? 's' : ''}` : ''}
                {hasKids && hasElderly ? ', ' : ''}
                {hasElderly ? `${profile.numElderly} senior${profile.numElderly > 1 ? 's' : ''}` : ''})
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                Adults only
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span>Commute: {commuteLabelMap[profile.commuteType] ?? profile.commuteType}</span>
            <span>•</span>
            <span>Outdoor: {profile.outdoorHours}h/day</span>
            <span>•</span>
            <span>Purifier: {profile.hasPurifier ? 'Yes' : 'None'}</span>
            <span>•</span>
            <span>Mask: {profile.maskType === 'n95_kn95' ? 'N95 Respirator' : profile.maskType === 'cloth_surgical' ? 'Cloth/Surgical' : 'None'}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onEditClick}
        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-teal-800"
      >
        <Edit3 className="w-3.5 h-3.5 text-teal-800" aria-hidden="true" />
        <span>Adjust Profile</span>
      </button>
    </div>
  );
}
