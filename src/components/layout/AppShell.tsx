'use client';

import { useState, useEffect } from 'react';
import Sidebar, { AppView, NAV_ITEMS, TextScale } from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { SupportedLanguage } from '@/lib/i18n/translations';
import {
  LayoutDashboard,
  Activity,
  ClipboardList,
  Home as HomeIcon,
  MoreHorizontal,
  X,
  Compass,
} from 'lucide-react';

interface AppShellProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onProfileClick: () => void;
  currentCity: string;
  onSelectCity: (city: { name: string; latitude: number; longitude: number }) => void;
  isLoadingAqi?: boolean;
  aqi?: number;
  category?: string;
  chipBg?: string;
  textColor?: string;
  children: React.ReactNode;
}

const PRIMARY_MOBILE_TABS: { id: AppView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'today', label: 'Today', icon: LayoutDashboard },
  { id: 'budget', label: 'Budget', icon: Activity },
  { id: 'plan', label: 'Plan', icon: ClipboardList },
  { id: 'room', label: 'Room', icon: HomeIcon },
];

export default function AppShell({
  activeView,
  onNavigate,
  language,
  onLanguageChange,
  onProfileClick,
  currentCity,
  onSelectCity,
  isLoadingAqi = false,
  aqi,
  category,
  chipBg,
  textColor,
  children,
}: AppShellProps) {
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [textScale, setTextScale] = useState<TextScale>('100');

  // Load saved text scale from localStorage on client mount (avoids SSR hydration mismatch)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem('shwaas_text_scale') as TextScale | null;
        if (saved && ['100', '112', '125'].includes(saved)) {
          setTextScale(saved);
        }
      } catch {
        // localStorage may be unavailable
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Sync data-text-scale attribute on html element
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-text-scale', textScale);
    } catch {
      // Ignore DOM errors in SSR
    }
  }, [textScale]);

  // Sync data-lang attribute on html tag for font switching
  useEffect(() => {
    document.documentElement.setAttribute('data-lang', language);
  }, [language]);

  const handleTextScaleChange = (scale: TextScale) => {
    setTextScale(scale);
    try {
      localStorage.setItem('shwaas_text_scale', scale);
      document.documentElement.setAttribute('data-text-scale', scale);
    } catch {
      // localStorage may fail in private mode
    }
  };

  // Items for the "More" mobile sheet
  const moreItems = NAV_ITEMS.filter(
    (item) => !PRIMARY_MOBILE_TABS.some((tab) => tab.id === item.id)
  );

  return (
    <div
      data-lang={language}
      className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row antialiased selection:bg-teal-100 selection:text-teal-900"
    >
      {/* Skip to Content link for keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-teal-800 focus:text-white focus:rounded-xl focus:shadow-lg focus:outline-hidden text-sm font-semibold"
      >
        Skip to main content
      </a>

      {/* Desktop Fixed Left Sidebar */}
      <div className="hidden md:block shrink-0">
        <Sidebar
          activeView={activeView}
          onNavigate={onNavigate}
          language={language}
          onLanguageChange={onLanguageChange}
          onProfileClick={onProfileClick}
          textScale={textScale}
          onTextScaleChange={handleTextScaleChange}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          currentCity={currentCity}
          onSelectCity={onSelectCity}
          isLoading={isLoadingAqi}
          aqi={aqi}
          category={category}
          chipBg={chipBg}
          textColor={textColor}
        />

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 pb-32 md:pb-16 focus:outline-hidden"
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (<768px) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg"
      >
        {PRIMARY_MOBILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 min-h-[48px] min-w-[44px] rounded-xl text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:outline-hidden ${
                isActive
                  ? 'text-teal-800 font-bold'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-teal-800' : 'text-slate-500'}`} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}

        {/* "More" trigger button */}
        <button
          type="button"
          onClick={() => setIsMoreSheetOpen(true)}
          aria-expanded={isMoreSheetOpen}
          aria-controls="mobile-more-sheet"
          className={`flex-1 flex flex-col items-center justify-center py-2 px-1 min-h-[48px] min-w-[44px] rounded-xl text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:outline-hidden ${
            moreItems.some((item) => item.id === activeView)
              ? 'text-teal-800 font-bold'
              : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5 text-slate-500" />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile "More" Sheet Modal */}
      {isMoreSheetOpen && (
        <div
          id="mobile-more-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="more-sheet-title"
          className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end"
          onClick={() => setIsMoreSheetOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl p-6 border-t border-slate-200 shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 id="more-sheet-title" className="font-serif font-bold text-lg text-slate-900">
                Additional Views &amp; Controls
              </h3>
              <button
                type="button"
                onClick={() => setIsMoreSheetOpen(false)}
                aria-label="Close more menu"
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Additional Navigation Links */}
            <div className="grid grid-cols-2 gap-3">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onNavigate(item.id);
                      setIsMoreSheetOpen(false);
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-sm font-semibold text-left min-h-[48px] transition-all ${
                      isActive
                        ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="leading-snug break-words">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Text Scaler & Language Controls */}
            <div className="pt-3 border-t border-slate-200 space-y-3.5">
              <div
                role="group"
                aria-label="Text size scale"
                className="flex items-center justify-between bg-slate-100 p-2 rounded-xl border border-slate-200 text-xs font-semibold"
              >
                <span className="text-xs font-bold text-slate-700 px-2 uppercase tracking-wide">
                  Text Scale
                </span>
                <div className="flex items-center gap-1.5">
                  {(['100', '112', '125'] as TextScale[]).map((scale) => (
                    <button
                      key={scale}
                      type="button"
                      onClick={() => handleTextScaleChange(scale)}
                      aria-pressed={textScale === scale}
                      className={`px-3 py-1.5 rounded-lg font-bold min-h-[38px] transition-all ${
                        textScale === scale
                          ? 'bg-teal-800 text-white shadow-2xs'
                          : 'text-slate-700 hover:text-slate-950'
                      } ${scale === '100' ? 'text-xs' : scale === '112' ? 'text-sm' : 'text-base'}`}
                    >
                      {scale === '100' ? 'A− (100%)' : scale === '112' ? 'A (112%)' : 'A+ (125%)'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsMoreSheetOpen(false);
                  onProfileClick();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 transition-colors min-h-[48px]"
              >
                <Compass className="w-4 h-4 text-teal-800" />
                <span>Adjust Household Profile</span>
              </button>

              <div className="flex items-center justify-between gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
                {(['en', 'hi', 'kn'] as SupportedLanguage[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      onLanguageChange(lang);
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-center transition-all min-h-[40px] ${
                      language === lang
                        ? 'bg-teal-800 text-white shadow-2xs font-bold'
                        : 'text-slate-700 hover:text-slate-950'
                    }`}
                  >
                    {lang === 'en' ? 'EN' : lang === 'hi' ? 'हिन्दी' : 'ಕನ್ನಡ'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
