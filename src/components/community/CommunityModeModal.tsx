'use client';

import { useState } from 'react';
import { X, Printer, Share2, Download, CheckSquare, Users, Building, GraduationCap, Check } from 'lucide-react';

interface CommunityModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  cityName: string;
  currentAqi: number;
}

export default function CommunityModeModal({
  isOpen,
  onClose,
  cityName,
  currentAqi,
}: CommunityModeModalProps) {
  const [activeTab, setActiveTab] = useState<'rwa' | 'schools' | 'ward'>('rwa');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const text = `AirWise Community Clean Air Action Plan for ${cityName} (Current NAQI: ${currentAqi})\n\n1. Stop open waste/leaf burning on premises.\n2. Provide electric room heaters to night security guards to replace open fires.\n3. Cancel morning outdoor assemblies and move sports to 1 PM-3 PM.\n4. Wet-mop common corridors instead of dry sweeping.\n\nGenerated with AirWise Urban Air Quality Assistant.`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="community-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 print:shadow-none print:border-none print:m-0 print:w-full">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-800 flex items-center justify-center text-white">
              <Users className="w-4 h-4 text-teal-200" />
            </div>
            <div>
              <h2 id="community-modal-title" className="text-lg font-serif font-bold text-slate-900">
                Community Smog Action Plan & Checklist
              </h2>
              <p className="text-xs text-slate-500">
                Shareable and printable protocols for Apartment RWAs, Societies, and Schools in {cityName}.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200/60 flex items-center justify-between flex-wrap gap-2 print:hidden">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('rwa')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'rwa'
                  ? 'bg-teal-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Apartments & RWAs</span>
            </button>
            <button
              onClick={() => setActiveTab('schools')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'schools'
                  ? 'bg-teal-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Schools & Daycares</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-2xs"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Share2 className="w-3.5 h-3.5 text-teal-800" />
              )}
              <span>{copied ? 'Copied to Clipboard!' : 'Share Text'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Checklist</span>
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto print:max-h-none print:overflow-visible">
          {/* Print Header */}
          <div className="hidden print:block pb-4 border-b border-slate-300">
            <h1 className="text-2xl font-serif font-bold text-slate-900">
              AirWise Community Clean Air Checklist — {cityName}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              National AQI Alert Level: {currentAqi} • Issued for Community Self-Defense & Emission Abatement
            </p>
          </div>

          {activeTab === 'rwa' ? (
            <div className="space-y-4">
              <div className="border-l-4 border-teal-800 pl-4 py-1">
                <h3 className="text-base font-serif font-bold text-slate-900">
                  Residential Welfare Association (RWA) & Society Protocol
                </h3>
                <p className="text-xs text-slate-600">
                  Collective actions apartment complexes and gated societies can implement within 24 hours.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: 'Supply Electric Heaters to Night Security Guards',
                    desc: 'Issue radiant or oil-filled electric room heaters to all guard booths and night patrol staff. Strictly eliminate open drum fires, wood scraps, and trash burning on society perimeter.',
                    impact: 'Eliminates localized ground-level toxic smoke spikes of +300 µg/m³ at building gates.',
                  },
                  {
                    title: 'Enforce Wet-Mopping of Society Driveways & Common Corridors',
                    desc: 'Ban dry brooms and leaf-blowers which aerosolize settled respirable toxic dust back into the air. Instruct housekeeping staff to use damp mops or water mist sweeping.',
                    impact: 'Reduces re-suspended road and walkway PM10 dust by up to 60%.',
                  },
                  {
                    title: 'Establish a Centralized "Clean-Air Room" in Club House',
                    desc: 'Designate the society library, boardroom, or community room as an air-conditioned, HEPA-purified sanctuary for senior residents, asthmatics, and children during peak morning smog.',
                    impact: 'Provides safe refuge during severe winter inversion spikes.',
                  },
                  {
                    title: 'Restrict Non-Emergency Diesel Generators (DG Sets)',
                    desc: 'Coordinate with local power utility to minimize grid tripping. Prohibit routine maintenance load-testing of heavy diesel generators during severe smog days.',
                    impact: 'Prevents heavy sulfur and black carbon plumes in high-density residential towers.',
                  },
                  {
                    title: 'Society Metro Shuttle & Carpool Clusters',
                    desc: 'Facilitate shared electric auto-rickshaws or society shuttles to the nearest metro station to reduce individual cold-engine car and two-wheeler commutes.',
                    impact: 'Lowers vehicular trip emissions and reduces roadway corridor exposure.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 flex items-start gap-3">
                    <div className="mt-0.5 w-4 h-4 rounded border-2 border-slate-400 flex items-center justify-center shrink-0 print:border-black" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">{item.desc}</p>
                      <span className="inline-block mt-1 text-[11px] font-semibold text-teal-800 print:text-black">
                        Impact: {item.impact}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-l-4 border-teal-800 pl-4 py-1">
                <h3 className="text-base font-serif font-bold text-slate-900">
                  School & Daycare Administrative Protocol
                </h3>
                <p className="text-xs text-slate-600">
                  Mitigation measures to protect respiratory health in growing children during severe smog.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: 'Cancel Morning Outdoor Assemblies & Sports',
                    desc: 'Move morning assemblies, physical training (PT), and sports into indoor auditoriums or postpone to afternoon (1:00 PM – 3:00 PM) when atmospheric dispersion is highest.',
                    impact: 'Protects children from exercising during peak early morning thermal inversions.',
                  },
                  {
                    title: 'Mandate N95 / KF94 Masks for School Bus Transit',
                    desc: 'Cloth masks fail to seal against fine PM2.5. Mandate certified high-filtration respirators for bus conductors and students during morning transit in traffic corridors.',
                    impact: 'Reduces commute-inhaled roadway particle dose by up to 90%.',
                  },
                  {
                    title: 'Seal Classrooms & Upgrade Infirmary with True HEPA Cleaners',
                    desc: 'Keep classroom windows latched during morning hours. Install continuous HEPA filtration units in the school medical infirmary and nursery wings.',
                    impact: 'Maintains indoor classroom PM2.5 at safe baselines.',
                  },
                  {
                    title: 'Strict No-Idling Zones for School Buses & Parent Vehicles',
                    desc: 'Prohibit diesel buses and private cars from idling outside school gates during morning drop-off and afternoon dispersal.',
                    impact: 'Eliminates concentrated tailpipe exhaust clouds at school gates.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 flex items-start gap-3">
                    <div className="mt-0.5 w-4 h-4 rounded border-2 border-slate-400 flex items-center justify-center shrink-0 print:border-black" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">{item.desc}</p>
                      <span className="inline-block mt-1 text-[11px] font-semibold text-teal-800 print:text-black">
                        Impact: {item.impact}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Note */}
          <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>AirWise Urban Clean Air Guard • Hack2Skill Urban Air Quality Challenge</span>
            <span>Document: Community Checklist (Printable)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
