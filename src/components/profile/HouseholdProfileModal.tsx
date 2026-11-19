'use client';

import { useState, useEffect } from 'react';
import {
  HouseholdProfile,
  householdProfileSchema,
  saveProfileToStorage,
  loadProfileFromStorage,
} from '@/lib/validation/profileSchema';
import { X, ShieldCheck, Home } from 'lucide-react';

interface HouseholdProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (profile: HouseholdProfile) => void;
}

export default function HouseholdProfileModal({
  isOpen,
  onClose,
  onProfileUpdated,
}: HouseholdProfileModalProps) {
  const [formData, setFormData] = useState<HouseholdProfile>(loadProfileFromStorage);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = householdProfileSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    saveProfileToStorage(result.data);
    onProfileUpdated(result.data);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 cursor-default"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-800 flex items-center justify-center text-white">
              <Home className="w-4 h-4 text-teal-200" />
            </div>
            <div>
              <h2 id="modal-title" className="text-lg font-serif font-bold text-slate-900">
                Household & Vulnerability Profile
              </h2>
              <p className="text-xs text-slate-500">
                Calibrates exposure calculations to your family&apos;s daily routine.
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

        {/* Privacy Callout */}
        <div className="px-6 py-2.5 bg-teal-50/80 border-b border-teal-100 flex items-center gap-2 text-xs text-teal-900">
          <ShieldCheck className="w-4 h-4 text-teal-800 shrink-0" />
          <span>
            <strong>Local & Private:</strong> This information is saved strictly in your device&apos;s localStorage. No accounts, no health records sent to any server.
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Family members */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="numKids" className="block text-xs font-semibold text-slate-800 mb-1">
                Children / Infants (&lt; 12 yrs)
              </label>
              <input
                id="numKids"
                type="number"
                min="0"
                max="20"
                value={formData.numKids}
                onChange={(e) =>
                  setFormData({ ...formData, numKids: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-700 focus:border-teal-700"
              />
              {errors.numKids && <p className="text-xs text-rose-600 mt-1">{errors.numKids}</p>}
            </div>

            <div>
              <label htmlFor="numElderly" className="block text-xs font-semibold text-slate-800 mb-1">
                Elderly Members (60+ yrs)
              </label>
              <input
                id="numElderly"
                type="number"
                min="0"
                max="20"
                value={formData.numElderly}
                onChange={(e) =>
                  setFormData({ ...formData, numElderly: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-700 focus:border-teal-700"
              />
              {errors.numElderly && <p className="text-xs text-rose-600 mt-1">{errors.numElderly}</p>}
            </div>
          </div>

          {/* Commute and Outdoor Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="commuteType" className="block text-xs font-semibold text-slate-800 mb-1">
                Primary Commute Mode
              </label>
              <select
                id="commuteType"
                value={formData.commuteType}
                onChange={(e) =>
                  setFormData({ ...formData, commuteType: e.target.value as HouseholdProfile['commuteType'] })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-700 focus:border-teal-700"
              >
                <option value="two_wheeler">Two-Wheeler (Motorcycle / Scooter)</option>
                <option value="walk">Walking</option>
                <option value="bicycle">Bicycle</option>
                <option value="car_open">Car (Windows Open / Non-AC)</option>
                <option value="car_ac">Car (Closed Cabin AC with Filter)</option>
                <option value="metro_bus_transit">Metro / Closed Rapid Transit</option>
              </select>
            </div>

            <div>
              <label htmlFor="outdoorHours" className="block text-xs font-semibold text-slate-800 mb-1">
                Typical Outdoor Hours per Day
              </label>
              <input
                id="outdoorHours"
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={formData.outdoorHours}
                onChange={(e) =>
                  setFormData({ ...formData, outdoorHours: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-700 focus:border-teal-700"
              />
              {errors.outdoorHours && <p className="text-xs text-rose-600 mt-1">{errors.outdoorHours}</p>}
            </div>
          </div>

          {/* Indoor Environment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cookingFuel" className="block text-xs font-semibold text-slate-800 mb-1">
                Kitchen Cooking Fuel
              </label>
              <select
                id="cookingFuel"
                value={formData.cookingFuel}
                onChange={(e) =>
                  setFormData({ ...formData, cookingFuel: e.target.value as HouseholdProfile['cookingFuel'] })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-700 focus:border-teal-700"
              >
                <option value="lpg_electric">LPG / Piped Gas / Induction (Clean)</option>
                <option value="biomass_kerosene">Kerosene / Compressed Biomass</option>
                <option value="wood">Wood / Charcoal / Cow Dung</option>
              </select>
            </div>

            <div>
              <label htmlFor="ventilationStrategy" className="block text-xs font-semibold text-slate-800 mb-1">
                Window Sealing & Ventilation
              </label>
              <select
                id="ventilationStrategy"
                value={formData.ventilationStrategy}
                onChange={(e) =>
                  setFormData({ ...formData, ventilationStrategy: e.target.value as HouseholdProfile['ventilationStrategy'] })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-700 focus:border-teal-700"
              >
                <option value="sealed_windows">Sealed Windows (Closed during smog)</option>
                <option value="timed_afternoon">Timed Ventilation (Afternoon only)</option>
                <option value="windows_open">Windows Regularly Kept Open</option>
              </select>
            </div>
          </div>

          {/* Mask & Purifier Equipment Toggles */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <span className="block text-xs font-semibold text-slate-900">
                  Air Purifier / Box-Fan Filter
                </span>
                <span className="text-[11px] text-slate-500">
                  Do you have a HEPA cleaner or a DIY box-fan with MERV 13?
                </span>
              </div>
              <div className="mt-2.5 flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="hasPurifier"
                    checked={formData.hasPurifier}
                    onChange={() => setFormData({ ...formData, hasPurifier: true })}
                    className="text-teal-800 focus:ring-teal-700"
                  />
                  <span>Yes, equipped</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="hasPurifier"
                    checked={!formData.hasPurifier}
                    onChange={() => setFormData({ ...formData, hasPurifier: false })}
                    className="text-teal-800 focus:ring-teal-700"
                  />
                  <span>No purifier</span>
                </label>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <span className="block text-xs font-semibold text-slate-900">
                  Respirator / Mask Availability
                </span>
                <span className="text-[11px] text-slate-500">
                  Type of face mask currently worn outdoors.
                </span>
              </div>
              <div className="mt-2.5">
                <select
                  value={formData.maskType}
                  onChange={(e) => {
                    const mType = e.target.value as HouseholdProfile['maskType'];
                    setFormData({
                      ...formData,
                      maskType: mType,
                      hasMasks: mType !== 'none',
                    });
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs text-slate-900 focus:ring-teal-700"
                >
                  <option value="n95_kn95">N95 / FFP2 / KN95 (High filtration)</option>
                  <option value="cloth_surgical">Cloth / Surgical Mask (Partial)</option>
                  <option value="none">No Mask Worn</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-950 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors focus-visible:outline-2 focus-visible:outline-teal-800"
            >
              {savedSuccess ? 'Profile Saved!' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
