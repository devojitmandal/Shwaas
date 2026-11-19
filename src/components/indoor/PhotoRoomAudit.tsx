'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, AlertCircle, CheckCircle2, Sparkles, Loader2, Wrench, ShieldAlert, ShieldCheck } from 'lucide-react';
import { RoomAuditResult } from '@/lib/audit/roomAuditSchema';

interface PhotoRoomAuditProps {
  outdoorPm25: number;
}

function compressImage(file: File): Promise<{ dataUrl: string; mimeType: 'image/jpeg' }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxSide = 1280;

        if (width > maxSide || height > maxSide) {
          if (width > height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Drawing to canvas and re-encoding strips EXIF, GPS, and metadata
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve({ dataUrl, mimeType: 'image/jpeg' });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function PhotoRoomAudit({ outdoorPm25 }: PhotoRoomAuditProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<RoomAuditResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate type
    const validTypes: Array<'image/jpeg' | 'image/png' | 'image/webp'> = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];
    if (!validTypes.includes(file.type as 'image/jpeg' | 'image/png' | 'image/webp')) {
      setError('Please upload a JPEG, PNG, or WebP photo.');
      return;
    }

    // Validate size (max 10MB raw before canvas compression)
    if (file.size > 10 * 1024 * 1024) {
      setError('Photo exceeds the 10MB limit. Please choose a smaller photo.');
      return;
    }

    try {
      // Resize to max 1280px longest side, JPEG 0.8 quality, stripping EXIF/GPS metadata
      const { dataUrl, mimeType: compressedMime } = await compressImage(file);
      setImagePreview(dataUrl);
      setMimeType(compressedMime);
      setAuditResult(null);
    } catch {
      setError('Failed to process and compress the image file.');
    }
  };

  const handleRunAudit = async () => {
    if (!imagePreview) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/room-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imagePreview,
          mimeType,
          outdoorPm25,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setAuditResult(data.audit);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to analyze room photo';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setAuditResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <section
      aria-labelledby="photo-audit-heading"
      className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800">
            <Camera className="w-4 h-4 text-teal-800" aria-hidden="true" />
            <span id="photo-audit-heading">AI Photo Room Audit</span>
          </div>
          <h3 className="mt-1 text-2xl font-serif font-bold text-slate-900 tracking-tight">
            Visual Infiltration & Source Inspection
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-2xl leading-relaxed">
            Upload or capture a photo of your window frame, stove area, or living room. Gemini Vision identifies envelope gaps and emission sources, which our physical mass-balance model translates into ranked fixes scored in Breath Budget points.
          </p>
        </div>

        {auditResult && (
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 shrink-0 self-start"
          >
            Audit Another Room
          </button>
        )}
      </div>

      {/* Upload Box / Image Preview */}
      {!imagePreview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-teal-700 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-teal-50/20 flex flex-col items-center justify-center space-y-3"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload room or window photo"
          />
          <div className="w-12 h-12 rounded-full bg-teal-100/80 text-teal-800 flex items-center justify-center">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Click to upload or take a room photo
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Auto-compressed to 1280px (EXIF stripped) • Supports JPEG, PNG, WebP
            </p>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-800 shrink-0" aria-hidden="true" />
              <span>Photo is analyzed and not stored.</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Room audit preview"
              className="w-32 h-32 object-cover rounded-lg border border-slate-300 shrink-0"
            />
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <span className="text-xs font-semibold text-slate-700 block">Photo Ready for Inspection</span>
              <p className="text-xs text-slate-500">
                Current Ambient PM2.5 Baseline: <strong className="font-mono text-slate-800">{outdoorPm25} µg/m³</strong>
              </p>
              <p className="text-[11px] text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-800 shrink-0" aria-hidden="true" />
                <span>Photo is analyzed and not stored.</span>
              </p>
              {!auditResult && !isLoading && (
                <button
                  type="button"
                  onClick={handleRunAudit}
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 shadow-2xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze Physical Envelope & Sources</span>
                </button>
              )}
            </div>
          </div>

          {isLoading && (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 text-teal-800 animate-spin" />
              <p className="text-xs font-medium text-slate-700">
                Inspecting window weatherstripping, ventilation pathways, and particulate sources...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Notice */}
      {error && (
        <div role="alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Audit Output */}
      {auditResult && (
        <div className="space-y-6 pt-2">
          {/* Summary Banner */}
          {auditResult.analyzed === false ? (
            <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 space-y-1">
              <div className="flex items-center gap-2 font-semibold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{auditResult.message ?? "Photo couldn't be analyzed, showing a generic estimate."}</span>
              </div>
              <p className="leading-relaxed pl-6 text-amber-800">
                Generic Urban Estimate • Physical Mass-Balance Model (AER {auditResult.aerEstimated} h⁻¹)
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200/90 text-xs text-teal-950 space-y-1">
              <div className="flex items-center gap-2 font-semibold text-teal-900">
                <CheckCircle2 className="w-4 h-4 text-teal-800 shrink-0" />
                <span>Inspection Complete • Source: Gemini 3.8 Flash Vision</span>
              </div>
              <p className="leading-relaxed pl-6">{auditResult.summary}</p>
            </div>
          )}

          {/* Physical Parameter Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-[11px] text-slate-500 block">Identified Space</span>
              <strong className="text-slate-900 font-semibold mt-0.5 block">{auditResult.roomType}</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-[11px] text-slate-500 block">Air Exchange Rate</span>
              <strong className="text-slate-900 font-semibold mt-0.5 block font-mono">{auditResult.aerEstimated} h⁻¹</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-[11px] text-slate-500 block">Indoor Emission (S)</span>
              <strong className="text-slate-900 font-semibold mt-0.5 block font-mono">~{auditResult.indoorSourceSEstimated} µg/h</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-[11px] text-slate-500 block">Modeled Indoor PM2.5</span>
              <strong className="text-slate-900 font-semibold mt-0.5 block font-mono">~{auditResult.estimatedBaselineIndoorPm25} µg/m³</strong>
            </div>
          </div>

          {/* Key Observations */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              {auditResult.analyzed === false ? 'Generic Model Baseline Assumptions' : 'Visual Envelope Observations'}
            </span>
            <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
              {auditResult.observations.map((obs, idx) => (
                <li key={idx}>{obs}</li>
              ))}
            </ul>
          </div>

          {/* Ranked Fixes in Breath Budget Points */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-teal-800" />
                Ranked Physical Fixes in Breath Budget Points
              </h4>
              <span className="text-[11px] text-slate-500">Sorted by highest particulate reduction</span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {auditResult.rankedFixes.map((fix) => (
                <div key={fix.rank} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-5 h-5 rounded-full bg-teal-800 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                        {fix.rank}
                      </span>
                      <span className="font-semibold text-xs text-slate-900">{fix.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-slate-100 text-slate-600">
                        {fix.category}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-sm bg-teal-50 text-teal-800 border border-teal-200">
                        {fix.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 pl-7">{fix.description}</p>
                    <div className="pl-7 text-[11px] text-slate-600 flex items-center gap-3 pt-0.5">
                      <span>Room PM2.5 drops to: <strong className="font-mono text-slate-800">{fix.mitigatedConcentrationUgM3} µg/m³</strong></span>
                      <span>Daily avoided mass: <strong className="font-mono text-emerald-700">~{fix.massAvoidedDailyUg} µg</strong></span>
                    </div>
                  </div>

                  <div className="shrink-0 sm:self-center self-end pl-7 sm:pl-0 text-right">
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold font-mono text-xs border border-emerald-200 block shadow-2xs">
                      +{fix.budgetPointsSaved} Budget Pts Saved
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
