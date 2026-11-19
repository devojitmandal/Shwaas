'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import HeroTitle from '@/components/ui/HeroTitle';
import LocationSearch from '@/components/aqi/LocationSearch';
import CurrentAqiCard from '@/components/aqi/CurrentAqiCard';
import HourlyChart from '@/components/aqi/HourlyChart';
import TimeWindowsCard from '@/components/aqi/TimeWindowsCard';
import ProfileBadge from '@/components/profile/ProfileBadge';
import HouseholdProfileModal from '@/components/profile/HouseholdProfileModal';
import ImpactExplainer from '@/components/plan/ImpactExplainer';
import WhatIfSimulator from '@/components/plan/WhatIfSimulator';
import TodaysPlanView from '@/components/plan/TodaysPlanView';
import BreathBudgetTracker from '@/components/budget/BreathBudgetTracker';
import WhatsAppShareCard from '@/components/share/WhatsAppShareCard';
import CommunityModeModal from '@/components/community/CommunityModeModal';
import IndoorAirModel from '@/components/indoor/IndoorAirModel';
import PhotoRoomAudit from '@/components/indoor/PhotoRoomAudit';
import MyImpactDashboard from '@/components/impact/MyImpactDashboard';

import {
  fetchAirQuality,
  ProcessedAirQuality,
} from '@/lib/api/openMeteo';
import {
  HouseholdProfile,
  DEFAULT_HOUSEHOLD_PROFILE,
  loadProfileFromStorage,
} from '@/lib/validation/profileSchema';
import { PlanResponse, generateFallbackPlan } from '@/lib/plan/planSchema';
import { calculateDailyExposure, ExposureResult } from '@/lib/exposure/engine';
import { SupportedLanguage, translations } from '@/lib/i18n/translations';
import { Loader2, AlertCircle, Users } from 'lucide-react';

export default function Home() {
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
  const [planSource, setPlanSource] = useState<string>('deterministic_engine_fallback');
  const [isPlanLoading, setIsPlanLoading] = useState(false);

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

      // Deterministic pre-calculation
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
          setPlanSource(json.source);
        } else {
          // Graceful fallback to deterministic engine
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
        }
      } catch (err) {
        console.error('Error fetching plan, using local deterministic fallback:', err);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      {/* Scroll-aware Header */}
      <Header
        onCommunityClick={() => setIsCommunityModalOpen(true)}
        onProfileClick={() => setIsProfileModalOpen(true)}
        language={language}
        onLanguageChange={setLanguage}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 space-y-10">
        {/* Hero Section */}
        <HeroTitle
          title={
            language === 'hi'
              ? 'श्वास: हर सांस का हिसाब'
              : language === 'kn'
              ? 'ಶ್ವಾಸ: ಪ್ರತಿ ಉಸಿರಿನ ಲೆಕ್ಕ'
              : 'Shwaas: Every Breath Accounted For'
          }
          subtitle={translations[language].heroSubtitle}
        />

        {/* Location Selector & Geolocation */}
        <section aria-label="Location and Air Quality Controls" className="space-y-4">
          <LocationSearch
            currentCity={currentLocation.name}
            isLoading={isAqiLoading}
            onSelectCity={(city) => {
              setCurrentLocation(city);
            }}
          />

          {aqiError && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{aqiError}</span>
              </div>
              <button
                onClick={() =>
                  loadAirQuality(
                    currentLocation.latitude,
                    currentLocation.longitude,
                    currentLocation.name
                  )
                }
                className="font-semibold underline ml-2"
              >
                Retry
              </button>
            </div>
          )}
        </section>

        {/* Household Profile Strip */}
        <section aria-label="Household Profile Settings">
          <ProfileBadge
            profile={profile}
            onEditClick={() => setIsProfileModalOpen(true)}
          />
        </section>

        {/* Live AQI & Hourly Forecast Progression */}
        {isAqiLoading && !airData ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-teal-800 animate-spin" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-600">
              Fetching Open-Meteo atmospheric telemetry and computing CPCB NAQI...
            </p>
          </div>
        ) : airData ? (
          <div className="space-y-6">
            {/* Live AQI Card */}
            <CurrentAqiCard
              cityName={airData.cityName}
              aqi={airData.current.aqi}
              pm25={airData.current.pm25}
              pm10={airData.current.pm10}
              dominantPollutant={airData.current.dominantPollutant}
              category={airData.current.category}
              chipBg={airData.current.chipBg}
              textColor={airData.current.textColor}
              description={airData.current.description}
              timestamp={airData.current.time}
            />

            {/* Scientific Atmospheric Data Provenance Notice */}
            <div className="p-3.5 rounded-xl bg-white/80 border border-slate-200/80 text-[11px] text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-800">
                  Open-Meteo Atmospheric Chemistry
                </span>
                <span>
                  Satellite & atmospheric model forecast (Copernicus / SILAM / CAMS ensemble). Not a substitute for continuous physical ground-station monitoring (CPCB / DPCC).
                </span>
              </div>
              <span className="text-[10px] text-slate-600 font-mono shrink-0">
                Data Synced: {new Date(airData.current.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Best and Worst Outdoor Time Windows */}
            <TimeWindowsCard
              bestWindow={airData.bestWindow}
              worstWindow={airData.worstWindow}
              noSafeWindowAvailable={airData.windowRecommendations?.noSafeWindowAvailable}
              alertHeadline={airData.windowRecommendations?.alertHeadline}
            />

            {/* 24-Hour Forecast Chart */}
            <HourlyChart
              hourly={airData.hourly}
              bestStartTime={airData.bestWindow.startTime}
              worstStartTime={airData.worstWindow.startTime}
            />

            {/* Breath Budget Exposure Tracker */}
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
        ) : null}

        {/* Deterministic Exposure Engine Breakdown */}
        {exposure && airData && (
          <div className="space-y-6">
            <ImpactExplainer
              exposure={exposure}
            />

            {/* Live What-If Interactive Sandbox */}
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

            {/* Physical Single-Zone Indoor Mass-Balance Room Modeling */}
            <IndoorAirModel outdoorPm25={airData.current.pm25} />

            {/* AI Photo Room Audit for Infiltration & Sources */}
            <PhotoRoomAudit outdoorPm25={airData.current.pm25} />

            {/* Measurable Impact Dashboard: Baseline vs Optimized Routine */}
            <MyImpactDashboard exposure={exposure} cityName={airData.cityName} />
          </div>
        )}

        {/* Today's Personalized Smog Plan */}
        {plan && airData ? (
          <div className="space-y-6">
            <TodaysPlanView
              plan={plan}
              isLoading={isPlanLoading}
              source={planSource}
              onRefresh={() => airData && loadPlan(airData, profile)}
            />

            {/* WhatsApp Visual Share Card Generator */}
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
        ) : isPlanLoading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-7 h-7 text-teal-800 animate-spin" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-600">
              Generating tailored smog defense protocol...
            </p>
          </div>
        ) : null}

        {/* Community Mode Banner */}
        <section
          aria-labelledby="community-banner-title"
          className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800">
              <Users className="w-4 h-4 text-teal-800" aria-hidden="true" />
              <span id="community-banner-title">Community Self-Defense</span>
            </div>
            <h3 className="text-xl font-serif font-bold text-slate-900 tracking-tight">
              Apartment Society & School Clean-Air Checklists
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
              Collective action against winter smog. Generate, print, or share printable protocols to ban open burning, provide guard heaters, and adjust school timings.
            </p>
          </div>

          <button
            onClick={() => setIsCommunityModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-teal-800"
          >
            <Users className="w-4 h-4 text-teal-200" aria-hidden="true" />
            <span>Open Community Mode</span>
          </button>
        </section>
      </main>

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

      {/* Community Checklist Modal */}
      <CommunityModeModal
        isOpen={isCommunityModalOpen}
        onClose={() => setIsCommunityModalOpen(false)}
        cityName={currentLocation.name}
        currentAqi={airData?.current.aqi ?? 200}
      />
    </div>
  );
}
