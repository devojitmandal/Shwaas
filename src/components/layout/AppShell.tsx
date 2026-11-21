'use client';

import { useState } from 'react';
import Sidebar, { AppView, NAV_ITEMS } from '@/components/layout/Sidebar';
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

  // Items for the "More" mobile sheet
  const moreItems = NAV_ITEMS.filter(
    (item) => !PRIMARY_MOBILE_TABS.some((tab) => tab.id === item.id)
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row antialiased">
      {/* Skip to Content link for keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-teal-800 focus:text-white focus:rounded-xl focus:shadow-lg focus:outline-hidden text-xs font-semibold"
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
          className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12 focus:outline-hidden"
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (<768px) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1 flex items-center justify-around shadow-lg"
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
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 min-h-[44px] min-w-[44px] rounded-xl text-[10px] font-semibold transition-all focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:outline-hidden ${
                isActive
                  ? 'text-teal-800 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-teal-800' : 'text-slate-400'}`} />
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
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 min-h-[44px] min-w-[44px] rounded-xl text-[10px] font-semibold transition-all focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:outline-hidden ${
            moreItems.some((item) => item.id === activeView)
              ? 'text-teal-800 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5 text-slate-400" />
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
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 id="more-sheet-title" className="font-serif font-bold text-base text-slate-900">
                Additional Tools & Settings
              </h3>
              <button
                type="button"
                onClick={() => setIsMoreSheetOpen(false)}
                aria-label="Close more menu"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Additional Navigation Links */}
            <div className="grid grid-cols-2 gap-2.5">
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
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold text-left min-h-[44px] transition-all ${
                      isActive
                        ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Profile & Language Controls */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setIsMoreSheetOpen(false);
                  onProfileClick();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200/80 transition-colors min-h-[44px]"
              >
                <Compass className="w-4 h-4 text-teal-800" />
                <span>Adjust Household Profile</span>
              </button>

              <div className="flex items-center justify-between gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-semibold">
                {(['en', 'hi', 'kn'] as SupportedLanguage[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      onLanguageChange(lang);
                    }}
                    className={`flex-1 py-2 rounded-lg text-center transition-all min-h-[36px] ${
                      language === lang
                        ? 'bg-teal-800 text-white shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
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
