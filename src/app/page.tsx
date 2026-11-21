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
import { SecondaryShade, SECONDARY_SHADES } from '@/lib/theme/shadeTheme';
import {
  Loader2,
  AlertCircle,
  Users,
  TrendingUp,
  ChevronDown,
  Sliders,
  Info,
  Share2,
  Home as HomeIcon,
  Activity,
} from 'lucide-react';

export default function Home() {
  // Localization state (en | hi | kn)
  const [language, setLanguage] = useState<SupportedLanguage>('en');

  // Secondary color shade state (teal | amber | indigo | rose | slate)
  const [secondaryShade, setSecondaryShade] = useState<SecondaryShade>('teal');
  const shade = SECONDARY_SHADES[secondaryShade];

  // Progressive disclosure states (keeps initial view clean & breathable)
  const [showHourlyChart, setShowHourlyChart] = useState(false);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);
  const [showIndoorTools, setShowIndoorTools] = useState(false);
  const [showImpactDashboard, setShowImpactDashboard] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);

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
      {/* Scroll-aware Header with Secondary Shade Selector */}
      <Header
        onCommunityClick={() => setIsCommunityModalOpen(true)}
        onProfileClick={() => setIsProfileModalOpen(true)}
        language={language}
        onLanguageChange={setLanguage}
        secondaryShade={secondaryShade}
        onShadeChange={setSecondaryShade}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-28 space-y-8">
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

        {/* Clean Top Bar: Location Search + Quick Profile Pill */}
        <section aria-label="Location and Profile Controls" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <LocationSearch
                currentCity={currentLocation.name}
                isLoading={isAqiLoading}
                onSelectCity={(city) => {
                  setCurrentLocation(city);
                }}
              />
            </div>
            <div>
              <ProfileBadge
                profile={profile}
                onEditClick={() => setIsProfileModalOpen(true)}
              />
            </div>
          </div>

          {aqiError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between"
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

        {/* Loading Skeleton */}
        {isAqiLoading && !airData ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center space-y-3">
            <Loader2 className={`w-8 h-8 ${shade.accentText} animate-spin`} aria-hidden="true" />
            <p className="text-sm font-medium text-slate-600">
              Fetching atmospheric telemetry and computing CPCB NAQI...
            </p>
          </div>
        ) : airData ? (
          <div className="space-y-7">
            {/* 1. Primary Air Quality Telemetry & Diurnal Window */}
            <div className="space-y-4">
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

              <TimeWindowsCard
                bestWindow={airData.bestWindow}
                worstWindow={airData.worstWindow}
                noSafeWindowAvailable={airData.windowRecommendations?.noSafeWindowAvailable}
                alertHeadline={airData.windowRecommendations?.alertHeadline}
              />

              {/* On-Demand Button for 24-Hour Hourly Forecast Chart */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] text-slate-500">
                  Open-Meteo European CAMS / SILAM Ensemble Forecast
                </span>
                <button
                  type="button"
                  onClick={() => setShowHourlyChart(!showHourlyChart)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    showHourlyChart
                      ? `${shade.buttonBg} ${shade.buttonText} shadow-xs`
                      : `${shade.badgeBg} ${shade.badgeText} ${shade.badgeBorder} hover:brightness-95`
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{showHourlyChart ? 'Hide Forecast Curve' : 'View 24-Hour Forecast Curve'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showHourlyChart ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {showHourlyChart && (
                <div className="pt-2">
                  <HourlyChart
                    hourly={airData.hourly}
                    bestStartTime={airData.bestWindow.startTime}
                    worstStartTime={airData.worstWindow.startTime}
                  />
                </div>
              )}
            </div>

            {/* 2. Family Breath Budget Ledger */}
            <div className="space-y-3">
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

              {/* Progressive Disclosure Buttons for What-If & Scientific Formulas */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 px-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWhatIf(!showWhatIf)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      showWhatIf
                        ? `${shade.buttonBg} ${shade.buttonText} shadow-xs`
                        : `${shade.badgeBg} ${shade.badgeText} ${shade.badgeBorder} hover:brightness-95`
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{showWhatIf ? 'Close Simulator' : 'Test What-If Interventions'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showWhatIf ? 'rotate-180' : ''}`} />
                  </button>

                  {exposure && (
                    <button
                      type="button"
                      onClick={() => setShowExplainer(!showExplainer)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
                    >
                      <Info className="w-3.5 h-3.5 text-slate-600" />
                      <span>{showExplainer ? 'Hide Science & Formula' : 'Dose Formula & Scientific Breakdown'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showExplainer ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>

                <span className="text-[11px] text-slate-600">
                  Relative lifestyle score benchmarked against WHO 24h intake (1 pt ≈ 2.16 µg)
                </span>
              </div>

              {showWhatIf && (
                <div className="pt-2">
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
              )}

              {showExplainer && exposure && (
                <div className="pt-2">
                  <ImpactExplainer exposure={exposure} />
                </div>
              )}
            </div>

            {/* 3. Actionable Smog Defense Plan */}
            {plan ? (
              <div className="space-y-3">
                <TodaysPlanView
                  plan={plan}
                  isLoading={isPlanLoading}
                  source={planSource}
                  onRefresh={() => airData && loadPlan(airData, profile)}
                />

                <div className="flex justify-end pt-1 px-1">
                  <button
                    type="button"
                    onClick={() => setShowShareCard(!showShareCard)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      showShareCard
                        ? `${shade.buttonBg} ${shade.buttonText} shadow-xs`
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{showShareCard ? 'Hide Share Card' : 'Generate WhatsApp Share Card'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showShareCard ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {showShareCard && (
                  <div className="pt-2">
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
                )}
              </div>
            ) : isPlanLoading ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center space-y-3">
                <Loader2 className={`w-7 h-7 ${shade.accentText} animate-spin`} aria-hidden="true" />
                <p className="text-sm font-medium text-slate-600">
                  Generating tailored smog defense protocol...
                </p>
              </div>
            ) : null}

            {/* 4. Advanced Physical Labs & Deep Verification (Progressive On-Demand Cards) */}
            <section aria-label="Advanced Air Quality Tools" className="pt-6 border-t border-slate-200/60 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-serif font-bold text-slate-900 tracking-tight">
                    Advanced Physical Modeling & Impact Verification
                  </h3>
                  <p className="text-xs text-slate-500">
                    On-demand tools: steady-state mass-balance room modeling, Gemini photo audit, and verified impact metrics.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowIndoorTools(!showIndoorTools)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      showIndoorTools
                        ? `${shade.buttonBg} ${shade.buttonText} shadow-xs`
                        : `${shade.badgeBg} ${shade.badgeText} ${shade.badgeBorder} hover:brightness-95`
                    }`}
                  >
                    <HomeIcon className="w-3.5 h-3.5" />
                    <span>{showIndoorTools ? 'Hide Indoor Tools' : 'Indoor Model & Photo Audit'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showIndoorTools ? 'rotate-180' : ''}`} />
                  </button>

                  {exposure && (
                    <button
                      type="button"
                      onClick={() => setShowImpactDashboard(!showImpactDashboard)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        showImpactDashboard
                          ? `${shade.buttonBg} ${shade.buttonText} shadow-xs`
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>{showImpactDashboard ? 'Hide Impact' : 'Measured Impact'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showImpactDashboard ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
              </div>

              {showIndoorTools && (
                <div className="space-y-6 pt-2">
                  <IndoorAirModel outdoorPm25={airData.current.pm25} />
                  <PhotoRoomAudit outdoorPm25={airData.current.pm25} />
                </div>
              )}

              {showImpactDashboard && exposure && (
                <div className="pt-2">
                  <MyImpactDashboard exposure={exposure} cityName={airData.cityName} />
                </div>
              )}
            </section>
          </div>
        ) : null}

        {/* 5. Minimal Breathable Community Mode Strip */}
        <section
          aria-labelledby="community-banner-title"
          className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800">
              <Users className="w-4 h-4 text-teal-800" aria-hidden="true" />
              <span id="community-banner-title">Community Clean-Air Mode</span>
            </div>
            <h4 className="text-base font-serif font-bold text-slate-900 tracking-tight">
              Apartment Society & School Clean-Air Protocols
            </h4>
            <p className="text-xs text-slate-500 max-w-lg">
              Printable action checklists for RWAs, night security guard heaters, and morning assembly adjustments.
            </p>
          </div>

          <button
            onClick={() => setIsCommunityModalOpen(true)}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 ${shade.buttonBg} ${shade.buttonHover} text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0 focus-visible:outline-2`}
          >
            <Users className="w-4 h-4 text-white/80" aria-hidden="true" />
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
