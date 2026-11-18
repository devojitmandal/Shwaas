'use client';

import { useState, useEffect } from 'react';
import { X, Printer, Share2, Users, Building, GraduationCap, MapPin, Check } from 'lucide-react';

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

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const text = `AirWise Community Clean Air Action Plan for ${cityName} (Current NAQI: ${currentAqi})\n\n` +
      `🏢 1. Residential Societies: Ban open waste burning, distribute electric room heaters to night security staff, and mandate wet-mopping.\n` +
      `🏫 2. Schools: Postpone outdoor morning sports to afternoon solar dispersion window; seal classroom windows.\n` +
      `🏘️ 3. Communities: Report illegal waste burning to municipal helpline and establish local metro-shuttle carpools.\n\n` +
      `Generated with AirWise Urban Air Quality Assistant • airwise.in`;

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
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 print:shadow-none print:border-none print:m-0 print:w-full cursor-default"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-800 flex items-center justify-center text-white">
              <Users className="w-4 h-4 text-teal-200" />
            </div>
            <div>
              <h2 id="community-modal-title" className="text-lg font-serif font-bold text-slate-900">
                Community Smog Action Plan & Checklists
              </h2>
              <p className="text-xs text-slate-500">
                Shareable and printable protocols for Apartment RWAs, Schools, and Neighborhoods in {cityName}.
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
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveTab('rwa')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'rwa'
                  ? 'bg-teal-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>1. Residential Societies (RWAs)</span>
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
              <span>2. Schools & Daycares</span>
            </button>
            <button
              onClick={() => setActiveTab('ward')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'ward'
                  ? 'bg-teal-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>3. Local Communities</span>
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
              <span>{copied ? 'Copied' : 'Share Summary'}</span>
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
              AirWise Community Smog Mitigation Action Plan — {cityName}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              National AQI Alert Level: {currentAqi} • Issued for Community Self-Defense & Emission Abatement
            </p>
          </div>

          {activeTab === 'rwa' && (
            <div className="space-y-4">
              <div className="border-l-4 border-teal-800 pl-4 py-1">
                <h3 className="text-base font-serif font-bold text-slate-900">
                  Residential Societies & RWA Action Protocol
                </h3>
                <p className="text-xs text-slate-600">
                  Immediate operational guidelines for building management committees and apartment complexes.
                </p>
              </div>

              <div className="space-y-3">
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

          {activeTab === 'schools' && (
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

          {activeTab === 'ward' && (
            <div className="space-y-4">
              <div className="border-l-4 border-teal-800 pl-4 py-1">
                <h3 className="text-base font-serif font-bold text-slate-900">
                  Local Community & Neighborhood Ward Protocol
                </h3>
                <p className="text-xs text-slate-600">
                  Civic actions neighbors can coordinate across wards and municipal zones.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: 'Community Reporting of Illegal Waste Burning Incidents',
                    desc: 'Encourage residents to photograph and report open municipal garbage or leaf burning directly to the municipal emergency helpline (e.g., CPCB Sameer App / MCD 311).',
                    impact: 'Accelerates civic enforcement against high-emission open combustion.',
                  },
                  {
                    title: 'Organize Neighborhood Carpooling & Metro Feeder Shuttles',
                    desc: 'Pool daily commutes to local metro stations using shared e-rickshaws or pooled rides rather than individual cold-start car trips.',
                    impact: 'Reduces private vehicle trips during heavy congestion hours.',
                  },
                  {
                    title: 'Support Clean Heating for Street Vendors & Daily Wage Workers',
                    desc: 'Partner with local merchant associations to provide sheltered warming kiosks with electric heating for evening market vendors.',
                    impact: 'Eliminates open street bonfire smog plumes in crowded shopping markets.',
                  },
                  {
                    title: 'Public Smog Awareness & Dispelling Misconceptions',
                    desc: 'Share verified science debunking myths (e.g. wet cloth masks or simple houseplants do not eliminate respirable fine PM2.5).',
                    impact: 'Encourages evidence-based community self-defense.',
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
          <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between flex-wrap gap-2">
            <span>AirWise Urban Clean Air Guard • Hack2Skill Urban Air Quality Challenge</span>
            <span>Document: Community Checklist (Printable) • Not a replacement for municipal regulation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
