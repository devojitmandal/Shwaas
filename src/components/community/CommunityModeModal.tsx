'use client';

import { useState, useEffect } from 'react';
import { X, Printer, Share2, Users, Building, GraduationCap, MapPin, Check } from 'lucide-react';
import {
  CommunityProtocolId,
  COMMUNITY_PROTOCOLS,
  formatCommunityShareText,
} from '@/lib/community/protocolsData';

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
  const [activeTab, setActiveTab] = useState<CommunityProtocolId>('rwa');
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
    const text = formatCommunityShareText(cityName, currentAqi);

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activeProtocol = COMMUNITY_PROTOCOLS[activeTab];

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
              <h2 id="community-modal-title" className="text-lg sm:text-xl font-bold text-slate-900">
                Community Smog Action Plan & Checklists
              </h2>
              <p className="text-sm text-slate-600">
                Shareable and printable protocols for Apartment RWAs, Schools, and Neighborhoods in {cityName}.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-teal-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200/60 flex items-center justify-between flex-wrap gap-2 print:hidden">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('rwa')}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-teal-700 ${
                activeTab === 'rwa'
                  ? 'bg-teal-800 text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>1. Residential Societies (RWAs)</span>
            </button>
            <button
              onClick={() => setActiveTab('schools')}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-teal-700 ${
                activeTab === 'schools'
                  ? 'bg-teal-800 text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>2. Schools & Daycares</span>
            </button>
            <button
              onClick={() => setActiveTab('ward')}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-teal-700 ${
                activeTab === 'ward'
                  ? 'bg-teal-800 text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>3. Local Communities</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-teal-700"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Share2 className="w-4 h-4 text-teal-800" />
              )}
              <span>{copied ? 'Copied' : 'Share Summary'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-sm font-semibold shadow-2xs transition-colors focus-visible:ring-2 focus-visible:ring-teal-700"
            >
              <Printer className="w-4 h-4" />
              <span>Print Checklist</span>
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto print:max-h-none print:overflow-visible">
          {/* Print Header */}
          <div className="hidden print:block pb-4 border-b border-slate-300">
            <h1 className="text-2xl font-serif font-bold text-slate-900">
              Shwaas (श्वास) Community Smog Mitigation Action Plan — {cityName}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              National AQI Alert Level: {currentAqi} • Issued for Community Self-Defense & Emission Abatement
            </p>
          </div>

          {/* Active Protocol Content */}
          <div className="space-y-4">
            <div className="border-l-4 border-teal-800 pl-4 py-1">
              <h3 className="text-base font-serif font-bold text-slate-900">
                {activeProtocol.title}
              </h3>
              <p className="text-xs text-slate-600">
                {activeProtocol.subtitle}
              </p>
            </div>

            <div className="space-y-3">
              {activeProtocol.items.map((item, idx) => (
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

          {/* Footer Note */}
          <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between flex-wrap gap-2">
            <span>Shwaas (श्वास) — हर सांस का हिसाब • Hack2Skill Urban Air Quality Challenge</span>
            <span>Document: Community Checklist (Printable) • Not a replacement for municipal regulation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
