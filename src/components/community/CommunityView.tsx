'use client';

import { useState, useRef, useEffect } from 'react';
import { Printer, Share2, Users, Building, GraduationCap, MapPin, Check } from 'lucide-react';
import {
  CommunityProtocolId,
  COMMUNITY_PROTOCOLS,
  formatCommunityShareText,
} from '@/lib/community/protocolsData';

interface CommunityViewProps {
  cityName: string;
  currentAqi: number;
}

export default function CommunityView({ cityName, currentAqi }: CommunityViewProps) {
  const [activeTab, setActiveTab] = useState<CommunityProtocolId>('rwa');
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const text = formatCommunityShareText(cityName, currentAqi);
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const activeProtocol = COMMUNITY_PROTOCOLS[activeTab];

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
        <div className="space-y-4">
          <div className="border-l-4 border-teal-800 pl-4 py-1">
            <h2 className="text-base font-serif font-bold text-slate-900">
              {activeProtocol.title}
            </h2>
            <p className="text-xs text-slate-600">
              {activeProtocol.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeProtocol.items.map((item, idx) => (
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
      </section>
    </div>
  );
}
