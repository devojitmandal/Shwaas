'use client';

import { useState } from 'react';
import { Printer, Share2, Users, Building, GraduationCap, MapPin, Check } from 'lucide-react';

interface CommunityViewProps {
  cityName: string;
  currentAqi: number;
}

export default function CommunityView({ cityName, currentAqi }: CommunityViewProps) {
  const [activeTab, setActiveTab] = useState<'rwa' | 'schools' | 'ward'>('rwa');
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const text =
      `Shwaas (श्वास) Community Clean Air Action Plan for ${cityName} (Current NAQI: ${currentAqi})\n\n` +
      `🏢 1. Residential Societies: Ban open waste burning, distribute electric room heaters to night security staff, and mandate wet-mopping.\n` +
      `🏫 2. Schools: Postpone outdoor morning sports to afternoon solar dispersion window; seal classroom windows.\n` +
      `🏘️ 3. Communities: Report illegal waste burning to municipal helpline and establish local metro-shuttle carpools.\n\n` +
      `Generated with Shwaas (श्वास) — हर सांस का हिसाब • shwaas.in`;

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* Top Banner Card */}
      <section
        aria-labelledby="community-view-title"
        className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800">
            <Users className="w-4 h-4 text-teal-800" aria-hidden="true" />
            <span>Community Clean-Air Action Protocols</span>
          </div>
          <h1
            id="community-view-title"
            className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight"
          >
            Apartment Society, School & Neighborhood Defense
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Standard operating procedures and printable compliance checklists to halt toxic ground-level emissions and protect vulnerable residents in {cityName}.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 print:hidden flex-wrap">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs min-h-[44px] focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:outline-hidden"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Share2 className="w-4 h-4 text-teal-800" />
            )}
            <span>{copied ? 'Copied' : 'Share Action Text'}</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold shadow-xs transition-colors min-h-[44px] focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:outline-hidden"
          >
            <Printer className="w-4 h-4" />
            <span>Printable SOP</span>
          </button>
        </div>
      </section>

      {/* Protocol Segmented Tab Selection */}
      <div
        role="tablist"
        aria-label="Community Action Protocols"
        className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80 overflow-x-auto print:hidden"
      >
        <button
          type="button"
          role="tab"
          id="tab-rwa"
          aria-selected={activeTab === 'rwa'}
          aria-controls="panel-rwa"
          onClick={() => setActiveTab('rwa')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap min-h-[44px] transition-all focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:outline-hidden ${
            activeTab === 'rwa'
              ? 'bg-teal-800 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>1. Residential Societies (RWAs)</span>
        </button>
        <button
          type="button"
          role="tab"
          id="tab-schools"
          aria-selected={activeTab === 'schools'}
          aria-controls="panel-schools"
          onClick={() => setActiveTab('schools')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap min-h-[44px] transition-all focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:outline-hidden ${
            activeTab === 'schools'
              ? 'bg-teal-800 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>2. Schools & Daycares</span>
        </button>
        <button
          type="button"
          role="tab"
          id="tab-ward"
          aria-selected={activeTab === 'ward'}
          aria-controls="panel-ward"
          onClick={() => setActiveTab('ward')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap min-h-[44px] transition-all focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:outline-hidden ${
            activeTab === 'ward'
              ? 'bg-teal-800 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>3. Local Neighborhoods</span>
        </button>
      </div>

      {/* Main Checklist Card */}
      <section
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6"
      >
        {activeTab === 'rwa' && (
          <div className="space-y-4">
            <div className="border-l-4 border-teal-800 pl-4 py-1">
              <h2 className="text-base font-serif font-bold text-slate-900">
                Residential Societies & RWA Action Protocol
              </h2>
              <p className="text-xs text-slate-600">
                Operational guidelines for building management committees and apartment complexes in {cityName}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: 'Supply Electric Room Heaters to Night Security Guards',
                  desc: 'Issue radiant or oil-filled electric heaters to all guard booths and night patrol staff. Strictly eliminate open drum fires, wood scrap burning, and dried leaf disposal fires.',
                  impact: 'Eliminates localized ground-level toxic smoke spikes of +300 µg/m³ at society entry gates.',
                },
                {
                  title: 'Enforce Wet-Mopping of Society Driveways & Common Areas',
                  desc: 'Ban dry brooms and leaf blowers which aerosolize settled respirable toxic dust back into the air. Instruct housekeeping staff to use damp mops or water mist sweeping.',
                  impact: 'Reduces re-suspended road and walkway PM10 dust by up to 60%.',
                },
                {
                  title: 'Protect Outdoor Workers with Certified N95 Respirators',
                  desc: 'Issue certified N95/FFP2 masks to society gardeners, sanitation workers, and security personnel during peak smog alerts.',
                  impact: 'Lowers occupational particulate inhalation burden by ~75–85%.',
                },
                {
                  title: 'Restrict Unnecessary Vehicle Idling Inside Society Gates',
                  desc: 'Enforce strict 60-second engine cut-off rules for delivery vans, taxis, and resident vehicles waiting at drop-off zones.',
                  impact: 'Reduces ground-level vehicle exhaust plumes in enclosed residential basements and lobbies.',
                },
                {
                  title: 'Establish a Centralized "Clean-Air Room" in Club House',
                  desc: 'Designate the society library, boardroom, or community room as an air-conditioned, HEPA-purified sanctuary for senior residents, asthmatics, and children during peak morning smog.',
                  impact: 'Provides clean air refuge for vulnerable residents without private home air purifiers.',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 flex items-start gap-3"
                >
                  <div className="mt-0.5 w-4 h-4 rounded border-2 border-slate-400 flex items-center justify-center shrink-0" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
                    <span className="inline-block mt-2 text-[11px] font-semibold text-teal-800">
                      Impact: {item.impact}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'schools' && (
          <div className="space-y-4">
            <div className="border-l-4 border-teal-800 pl-4 py-1">
              <h2 className="text-base font-serif font-bold text-slate-900">
                School & Daycare Administrative Protocol
              </h2>
              <p className="text-xs text-slate-600">
                Mitigation measures to protect respiratory health in growing children during severe smog.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: 'Cancel Morning Outdoor Assemblies & Sports',
                  desc: 'Move morning assemblies, physical training (PT), and sports into indoor auditoriums or postpone to afternoon (1:00 PM – 3:00 PM) when atmospheric dispersion is highest.',
                  impact: 'Protects children from strenuous aerobic breathing during peak early morning thermal inversions.',
                },
                {
                  title: 'Indoor Activity Alternatives',
                  desc: 'Replace outdoor running games with yoga, table tennis, or indoor board games in rooms with closed windows.',
                  impact: 'Keeps minute ventilation rate lower (~10 L/min vs >35 L/min during heavy running).',
                },
                {
                  title: 'Parent Smog Notifications & Mask Guidance',
                  desc: 'Send daily morning air quality alerts via parent portal, recommending snug-fitting N95 masks for school bus commuters.',
                  impact: 'Empowers parents to equip children with verified high-filtration respirators.',
                },
                {
                  title: 'Special Protections for Children with Asthma',
                  desc: 'Ensure school infirmaries stock backup inhalers, nebulizers, and a running HEPA air purifier unit.',
                  impact: 'Provides immediate clinical stabilization for students experiencing smog-induced wheezing.',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 flex items-start gap-3"
                >
                  <div className="mt-0.5 w-4 h-4 rounded border-2 border-slate-400 flex items-center justify-center shrink-0" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
                    <span className="inline-block mt-2 text-[11px] font-semibold text-teal-800">
                      Impact: {item.impact}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ward' && (
          <div className="space-y-4">
            <div className="border-l-4 border-teal-800 pl-4 py-1">
              <h2 className="text-base font-serif font-bold text-slate-900">
                Neighborhood & Citizen Watchdog Protocol
              </h2>
              <p className="text-xs text-slate-600">
                Community-led reporting and local coordination to eliminate toxic municipal hot spots.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: 'Report Illegal Waste & Leaf Burning Immediately',
                  desc: 'Use the official municipal helpline or Sameer CPCB app to geo-tag and report open plastic or leaf burning within 200m of residential clusters.',
                  impact: 'Prompts immediate municipal inspection and fines for repeat commercial polluters.',
                },
                {
                  title: 'Organize Metro-Shuttle Shared Carpools',
                  desc: 'Coordinate local WhatsApp groups to shuttle office commuters directly to nearest metro or rail stations, eliminating private single-occupancy idling.',
                  impact: 'Directly lowers vehicular tailpipe emissions during the critical 8:00–10:00 AM rush hour.',
                },
                {
                  title: 'Water Sprinkling on Local Construction Sites',
                  desc: 'Demand that nearby private and civic construction sites keep unpaved earth covered with green tarpaulins and wet-sprinkled twice daily.',
                  impact: 'Halts fugitive silica and heavy dust migration into neighborhood balconies.',
                },
                {
                  title: 'Distribute Excess Air Purifier Pre-Filters',
                  desc: 'Pool community bulk purchases of washable coarse pre-filters and DIY MERV-13 fans for ground-floor shops and neighborhood clinics.',
                  impact: 'Creates decentralized low-cost particulate removal across neighborhood high-traffic zones.',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 flex items-start gap-3"
                >
                  <div className="mt-0.5 w-4 h-4 rounded border-2 border-slate-400 flex items-center justify-center shrink-0" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
                    <span className="inline-block mt-2 text-[11px] font-semibold text-teal-800">
                      Impact: {item.impact}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
