'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import AppShell from '@/components/layout/AppShell';
import { AppView } from '@/components/layout/Sidebar';
import TimeWindowsCard from '@/components/aqi/TimeWindowsCard';
import ProfileBadge from '@/components/profile/ProfileBadge';
import HouseholdProfileModal from '@/components/profile/HouseholdProfileModal';
import WhatIfSimulator from '@/components/plan/WhatIfSimulator';
import TodaysPlanView from '@/components/plan/TodaysPlanView';
import BreathBudgetTracker from '@/components/budget/BreathBudgetTracker';
import CommunityModeModal from '@/components/community/CommunityModeModal';
import CommunityView from '@/components/community/CommunityView';
import IndoorAirModel from '@/components/indoor/IndoorAirModel';
import MyImpactDashboard from '@/components/impact/MyImpactDashboard';
import TodayView from '@/components/views/TodayView';
import DoseExplainerSection from '@/components/impact/DoseExplainerSection';

import {
  fetchAirQuality,
  ProcessedAirQuality,
} from '@/lib/api/openMeteo';
import {
  HouseholdProfile,
  DEFAULT_HOUSEHOLD_PROFILE,
  loadProfileFromStorage,
} from '@/lib/validation/profileSchema';
import { PlanResponse, PlanSource, generateFallbackPlan } from '@/lib/plan/planSchema';
import { calculateDailyExposure, ExposureResult } from '@/lib/exposure/engine';
import { calculateHouseholdPerPersonBudgets } from '@/lib/exposure/breathBudget';
import { SupportedLanguage } from '@/lib/i18n/translations';
import {
  Loader2,
  AlertCircle,
} from 'lucide-react';

// Lazy-load heavy views with next/dynamic
const HourlyChart = dynamic(() => import('@/components/aqi/HourlyChart'), {
  loading: () => (
    <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center space-y-2">
      <Loader2 className="w-6 h-6 text-teal-800 animate-spin" />
      <span className="text-xs font-medium text-slate-500">Loading 24h atmospheric chart...</span>
    </div>
  ),
});

const PhotoRoomAudit = dynamic(() => import('@/components/indoor/PhotoRoomAudit'), {
  loading: () => (
    <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center space-y-2">
      <Loader2 className="w-6 h-6 text-teal-800 animate-spin" />
      <span className="text-xs font-medium text-slate-500">Loading room photo audit...</span>
    </div>
  ),
});

const WhatsAppShareCard = dynamic(() => import('@/components/share/WhatsAppShareCard'), {
  loading: () => (
    <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center space-y-2">
      <Loader2 className="w-6 h-6 text-teal-800 animate-spin" />
      <span className="text-xs font-medium text-slate-500">Loading share card generator...</span>
    </div>
  ),
});

const VALID_VIEWS: AppView[] = [
  'today',
  'budget',
  'plan',
  'room',
  'forecast',
  'impact',
  'share',
  'community',
];

const parseHashView = (): AppView => {
  if (typeof window === 'undefined') return 'today';
  const clean = window.location.hash.replace(/^#/, '') as AppView;
  return VALID_VIEWS.includes(clean) ? clean : 'today';
};

export default function Home() {
  // Navigation state synced to URL hash
  const [activeView, setActiveView] = useState<AppView>(() => parseHashView());

  // Localization state (en | hi | kn)
  const [language, setLanguage] = useState<SupportedLanguage>('en');

  // Location & AQI state
  const [currentLocation, setCurrentLocation] = useState({
    name: 'Delhi, India',
    latitude: 28.6519,
    longitude: 77.2315,
  });
  const [airData, setAirData] = useState<ProcessedAirQuality | null>(null);
  const [isAqiLoading, setIsAqiLoading] = useState(true);
  const [aqiError, setAqiError] = useState<string | null>(null);

  // Household Profile state
  const [profile, setProfile] = useState<HouseholdProfile>(DEFAULT_HOUSEHOLD_PROFILE);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);

  // Plan & Exposure state
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [exposure, setExposure] = useState<ExposureResult | null>(null);
  const [planSource, setPlanSource] = useState<PlanSource>('deterministic_engine_fallback');
  const [isPlanLoading, setIsPlanLoading] = useState(false);

  // Listen to hashchange
  useEffect(() => {
    const handleHashChange = () => {
      setActiveView(parseHashView());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (view: AppView) => {
    setActiveView(view);
    if (typeof window !== 'undefined') {
      window.location.hash = view;
    }
  };

  // Load profile from localStorage on client mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = loadProfileFromStorage();
      setProfile(saved);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Fetch air quality data when location changes
  const loadAirQuality = useCallback(async (lat: number, lon: number, name: string) => {
    setIsAqiLoading(true);
    setAqiError(null);
    try {
      const data = await fetchAirQuality(lat, lon, name);
      setAirData(data);
    } catch (err: unknown) {
      console.error(err);
      setAqiError('Unable to load live atmospheric data from Open-Meteo. Please try another city.');
    } finally {
      setIsAqiLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAirQuality(currentLocation.latitude, currentLocation.longitude, currentLocation.name);
    }, 0);
    return () => clearTimeout(timer);
  }, [currentLocation, loadAirQuality]);

  // Request or compute plan when air data or profile updates
  const loadPlan = useCallback(
    async (currentAir: ProcessedAirQuality, currentProf: HouseholdProfile, currentLang: SupportedLanguage = 'en') => {
      setIsPlanLoading(true);

      const localExposure = calculateDailyExposure({
        ...currentProf,
        currentAqi: currentAir.current.aqi,
        pm25Concentration: currentAir.current.pm25,
        timeOutdoorsHours: currentProf.outdoorHours,
        indoorHours: Math.max(0, 24 - currentProf.outdoorHours),
        vulnerableMembers: {
          hasKids: currentProf.numKids > 0,
          hasElderly: currentProf.numElderly > 0,
        },
      });
      setExposure(localExposure);

      const applyFallback = () => {
        const fallback = generateFallbackPlan({
          cityName: currentAir.cityName,
          profile: currentProf,
          exposure: localExposure,
          bestWindow: currentAir.bestWindow,
          worstWindow: currentAir.worstWindow,
          noSafeWindowAvailable: currentAir.windowRecommendations?.noSafeWindowAvailable,
          alertHeadline: currentAir.windowRecommendations?.alertHeadline,
          language: currentLang,
        });
        setPlan(fallback);
        setPlanSource('deterministic_engine_fallback');
      };

      try {
        const res = await fetch('/api/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile: currentProf,
            aqi: currentAir.current.aqi,
            pm25: currentAir.current.pm25,
            cityName: currentAir.cityName,
            bestWindow: currentAir.bestWindow,
            worstWindow: currentAir.worstWindow,
            noSafeWindowAvailable: currentAir.windowRecommendations?.noSafeWindowAvailable ?? false,
            alertHeadline: currentAir.windowRecommendations?.alertHeadline,
            language: currentLang,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          setPlan(json.plan);
          setExposure(json.exposure);
          setPlanSource(
            json.source === 'gemini_personalized' ? 'gemini_personalized' : 'deterministic_engine_fallback'
          );
        } else {
          applyFallback();
        }
      } catch (err) {
        console.error('Error fetching plan, using local deterministic fallback:', err);
        applyFallback();
      } finally {
        setIsPlanLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!airData) return;
    const timer = setTimeout(() => {
      loadPlan(airData, profile, language);
    }, 0);
    return () => clearTimeout(timer);
  }, [airData, profile, language, loadPlan]);

  // Compute per-person budget summary for the Today view
  const perPersonSummary = airData
    ? calculateHouseholdPerPersonBudgets(
        {
          numKids: profile.numKids,
          numElderly: profile.numElderly,
          commuteType: profile.commuteType,
          hasPurifier: profile.hasPurifier,
          maskType: profile.maskType,
          outdoorHours: profile.outdoorHours,
        },
        airData.current.pm25,
        airData.hourly.map((h) => h.pm25)
      )
    : [];

  return (
    <AppShell
      activeView={activeView}
      onNavigate={handleNavigate}
      language={language}
      onLanguageChange={setLanguage}
      onProfileClick={() => setIsProfileModalOpen(true)}
      currentCity={currentLocation.name}
      onSelectCity={setCurrentLocation}
      isLoadingAqi={isAqiLoading}
      aqi={airData?.current.aqi}
      category={airData?.current.category}
      chipBg={airData?.current.chipBg}
      textColor={airData?.current.textColor}
    >
      {/* Error Banner */}
      {aqiError && (
        <div
          role="alert"
          className="mb-8 p-5 sm:p-6 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 text-base flex items-center justify-between shadow-xs max-w-full"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-700" />
            <span className="leading-relaxed">{aqiError}</span>
          </div>
          <button
            type="button"
            onClick={() =>
              loadAirQuality(
                currentLocation.latitude,
                currentLocation.longitude,
                currentLocation.name
              )
            }
            className="font-bold underline ml-4 text-rose-950 hover:text-rose-800 shrink-0 min-h-[44px] flex items-center"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isAqiLoading && !airData ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-teal-800 animate-spin" aria-hidden="true" />
          <p className="text-base font-medium text-slate-700">
            Fetching atmospheric telemetry and computing CPCB NAQI for {currentLocation.name}...
          </p>
        </div>
      ) : airData ? (
        <div className="w-full space-y-8">
          {/* VIEW 1: TODAY */}
          {activeView === 'today' && (
            <TodayView
              airData={airData}
              perPersonSummary={perPersonSummary}
              onNavigateToBudget={() => handleNavigate('budget')}
            />
          )}

          {/* VIEW 2: BREATH BUDGET */}
          {activeView === 'budget' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
              <div className="md:col-span-12">
                <ProfileBadge
                  profile={profile}
                  onEditClick={() => setIsProfileModalOpen(true)}
                />
              </div>

              <div className="md:col-span-12">
                <BreathBudgetTracker
                  currentAqi={airData.current.aqi}
                  pm25={airData.current.pm25}
                  hasPurifier={profile.hasPurifier}
                  maskType={profile.maskType}
                  commuteType={profile.commuteType}
                  hourlyPm25Forecast={airData.hourly.map((h) => h.pm25)}
                  numKids={profile.numKids}
                  numElderly={profile.numElderly}
                  outdoorHours={profile.outdoorHours}
                />
              </div>

              <div className="md:col-span-12">
                <WhatIfSimulator
                  currentProfile={{
                    ...profile,
                    currentAqi: airData.current.aqi,
                    pm25Concentration: airData.current.pm25,
                    timeOutdoorsHours: profile.outdoorHours,
                    indoorHours: Math.max(0, 24 - profile.outdoorHours),
                    vulnerableMembers: {
                      hasKids: profile.numKids > 0,
                      hasElderly: profile.numElderly > 0,
                    },
                  }}
                />
              </div>
            </div>
          )}

          {/* VIEW 3: MY PLAN */}
          {activeView === 'plan' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
              <div className="md:col-span-12">
                {plan ? (
                  <TodaysPlanView
                    plan={plan}
                    isLoading={isPlanLoading}
                    source={planSource}
                    onRefresh={() => airData && loadPlan(airData, profile)}
                  />
                ) : isPlanLoading ? (
                  <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center space-y-3">
                    <Loader2 className="w-8 h-8 text-teal-800 animate-spin" aria-hidden="true" />
                    <p className="text-base font-medium text-slate-700">
                      Generating tailored smog defense protocol...
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* VIEW 4: ROOM & PHOTO */}
          {activeView === 'room' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
              <div className="md:col-span-12">
                <IndoorAirModel outdoorPm25={airData.current.pm25} />
              </div>
              <div className="md:col-span-12">
                <PhotoRoomAudit outdoorPm25={airData.current.pm25} />
              </div>
            </div>
          )}

          {/* VIEW 5: 24H FORECAST */}
          {activeView === 'forecast' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
              <div className="md:col-span-12">
                <HourlyChart
                  hourly={airData.hourly}
                  bestStartTime={airData.bestWindow.startTime}
                  worstStartTime={airData.worstWindow.startTime}
                />
              </div>
              <div className="md:col-span-12">
                <TimeWindowsCard
                  bestWindow={airData.bestWindow}
                  worstWindow={airData.worstWindow}
                  noSafeWindowAvailable={airData.windowRecommendations?.noSafeWindowAvailable}
                  alertHeadline={airData.windowRecommendations?.alertHeadline}
                />
              </div>
            </div>
          )}

          {/* VIEW 6: IMPACT PROOF */}
          {activeView === 'impact' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
              {exposure && (
                <div className="md:col-span-12">
                  <MyImpactDashboard exposure={exposure} cityName={airData.cityName} />
                </div>
              )}

              {exposure && (
                <div className="md:col-span-12">
                  <DoseExplainerSection exposure={exposure} />
                </div>
              )}
            </div>
          )}

          {/* VIEW 7: SHARE CARD */}
          {activeView === 'share' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
              <div className="md:col-span-12">
                <WhatsAppShareCard
                  cityName={airData.cityName}
                  aqi={airData.current.aqi}
                  pm25={airData.current.pm25}
                  category={airData.current.category}
                  bestWindow={airData.bestWindow}
                  worstWindow={airData.worstWindow}
                  dominantPollutant={airData.current.dominantPollutant}
                  noSafeWindowAvailable={airData.windowRecommendations?.noSafeWindowAvailable}
                  alertHeadline={airData.windowRecommendations?.alertHeadline}
                />
              </div>
            </div>
          )}

          {/* VIEW 8: COMMUNITY */}
          {activeView === 'community' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
              <div className="md:col-span-12">
                <CommunityView
                  cityName={airData.cityName}
                  currentAqi={airData.current.aqi}
                />
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Household Profile Modal */}
      {isProfileModalOpen && (
        <HouseholdProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onProfileUpdated={(updated) => {
            setProfile(updated);
          }}
        />
      )}

      {/* Optional Community Checklist Modal (kept for print / quick view) */}
      <CommunityModeModal
        isOpen={isCommunityModalOpen}
        onClose={() => setIsCommunityModalOpen(false)}
        cityName={currentLocation.name}
        currentAqi={airData?.current.aqi ?? 200}
      />
    </AppShell>
  );
}
