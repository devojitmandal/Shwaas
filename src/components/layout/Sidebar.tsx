'use client';

import {
  LayoutDashboard,
  Activity,
  ClipboardList,
  Home as HomeIcon,
  TrendingUp,
  Award,
  Share2,
  Users,
  Wind,
  Compass,
} from 'lucide-react';
import { SupportedLanguage } from '@/lib/i18n/translations';

export type AppView =
  | 'today'
  | 'budget'
  | 'plan'
  | 'room'
  | 'forecast'
  | 'impact'
  | 'share'
  | 'community';

export interface NavItem {
  id: AppView;
  label: string;
  icon: typeof LayoutDashboard;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'today', label: 'Today', icon: LayoutDashboard },
  { id: 'budget', label: 'Breath Budget', icon: Activity },
  { id: 'plan', label: 'My Plan', icon: ClipboardList },
  { id: 'room', label: 'Room & Photo', icon: HomeIcon },
  { id: 'forecast', label: '24h Forecast', icon: TrendingUp },
  { id: 'impact', label: 'Impact Proof', icon: Award },
  { id: 'share', label: 'Share Card', icon: Share2 },
  { id: 'community', label: 'Community', icon: Users },
];

interface SidebarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onProfileClick: () => void;
}

export default function Sidebar({
  activeView,
  onNavigate,
  language,
  onLanguageChange,
  onProfileClick,
}: SidebarProps) {
  return (
    <aside
      className="w-60 h-screen sticky top-0 flex flex-col justify-between bg-white border-r border-slate-200/90 select-none z-30"
      aria-label="App Sidebar"
    >
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-teal-800 flex items-center justify-center text-white shadow-xs shrink-0">
            <Wind className="w-5 h-5 text-teal-200" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif font-bold text-lg text-slate-900 tracking-tight leading-tight">
                Shwaas
              </span>
              <span className="text-xs font-semibold text-teal-800">श्वास</span>
            </div>
            <p className="text-[10px] font-medium text-teal-800 truncate">
              हर सांस का हिसाब
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <nav aria-label="Main" className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(item.id);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] transition-all focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:outline-hidden ${
                  isActive
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/80'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-teal-200' : 'text-slate-500'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{item.label}</span>
              </a>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls: Language pills + Household Profile */}
      <div className="p-3 border-t border-slate-100 space-y-2.5 bg-slate-50/50">
        {/* Language selector pills */}
        <div
          role="group"
          aria-label="Language selection"
          className="flex items-center justify-between bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-[11px] font-semibold"
        >
          {(['en', 'hi', 'kn'] as SupportedLanguage[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => onLanguageChange(lang)}
              aria-pressed={language === lang}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all min-h-[32px] focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:outline-hidden ${
                language === lang
                  ? 'bg-teal-800 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lang === 'en' ? 'EN' : lang === 'hi' ? 'हिन्दी' : 'ಕನ್ನಡ'}
            </button>
          ))}
        </div>

        {/* My Household trigger button */}
        <button
          type="button"
          onClick={onProfileClick}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/80 transition-colors min-h-[44px] shadow-2xs focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:outline-hidden"
        >
          <Compass className="w-4 h-4 text-teal-800" aria-hidden="true" />
          <span>My Household</span>
        </button>
      </div>
    </aside>
  );
}
