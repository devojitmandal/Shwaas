export type SecondaryShade = 'teal' | 'amber' | 'indigo' | 'rose' | 'slate';

export interface ShadeTokens {
  id: SecondaryShade;
  label: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  buttonBg: string;
  buttonHover: string;
  buttonText: string;
  pillActive: string;
  accentText: string;
  softBorder: string;
  glow: string;
}

export const SECONDARY_SHADES: Record<SecondaryShade, ShadeTokens> = {
  teal: {
    id: 'teal',
    label: 'Sage Mint',
    dotColor: '#0d9488',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-900',
    badgeBorder: 'border-teal-200',
    buttonBg: 'bg-teal-800',
    buttonHover: 'hover:bg-teal-900',
    buttonText: 'text-white',
    pillActive: 'bg-teal-800 text-white shadow-2xs',
    accentText: 'text-teal-800',
    softBorder: 'border-teal-200/80',
    glow: 'shadow-teal-900/10',
  },
  amber: {
    id: 'amber',
    label: 'Warm Ochre',
    dotColor: '#d97706',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-200',
    buttonBg: 'bg-amber-700',
    buttonHover: 'hover:bg-amber-800',
    buttonText: 'text-white',
    pillActive: 'bg-amber-700 text-white shadow-2xs',
    accentText: 'text-amber-800',
    softBorder: 'border-amber-200/80',
    glow: 'shadow-amber-900/10',
  },
  indigo: {
    id: 'indigo',
    label: 'Sky Azure',
    dotColor: '#4f46e5',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-900',
    badgeBorder: 'border-indigo-200',
    buttonBg: 'bg-indigo-700',
    buttonHover: 'hover:bg-indigo-800',
    buttonText: 'text-white',
    pillActive: 'bg-indigo-700 text-white shadow-2xs',
    accentText: 'text-indigo-800',
    softBorder: 'border-indigo-200/80',
    glow: 'shadow-indigo-900/10',
  },
  rose: {
    id: 'rose',
    label: 'Terracotta',
    dotColor: '#e11d48',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-900',
    badgeBorder: 'border-rose-200',
    buttonBg: 'bg-rose-700',
    buttonHover: 'hover:bg-rose-800',
    buttonText: 'text-white',
    pillActive: 'bg-rose-700 text-white shadow-2xs',
    accentText: 'text-rose-800',
    softBorder: 'border-rose-200/80',
    glow: 'shadow-rose-900/10',
  },
  slate: {
    id: 'slate',
    label: 'Minimal Stone',
    dotColor: '#475569',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-900',
    badgeBorder: 'border-slate-300',
    buttonBg: 'bg-slate-800',
    buttonHover: 'hover:bg-slate-900',
    buttonText: 'text-white',
    pillActive: 'bg-slate-800 text-white shadow-2xs',
    accentText: 'text-slate-800',
    softBorder: 'border-slate-300/80',
    glow: 'shadow-slate-900/10',
  },
};
