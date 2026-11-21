'use client';

import { ExposureResult } from '@/lib/exposure/engine';
import ImpactExplainer from '@/components/plan/ImpactExplainer';
import { ShieldCheck } from 'lucide-react';

interface DoseExplainerSectionProps {
  exposure: ExposureResult;
}

export default function DoseExplainerSection({ exposure }: DoseExplainerSectionProps) {
  return (
    <details className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs group">
      <summary className="cursor-pointer text-base font-bold text-teal-800 hover:text-teal-950 flex items-center justify-between select-none focus-visible:outline-hidden">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-teal-800" />
          <span>How it&apos;s calculated (Scientific Dose Formula &amp; Evidence)</span>
        </div>
        <span className="text-xs font-normal text-slate-600 group-open:hidden">
          (tap to expand breakdown)
        </span>
      </summary>
      <div className="mt-4 pt-4 border-t border-slate-200">
        <ImpactExplainer exposure={exposure} />
      </div>
    </details>
  );
}
