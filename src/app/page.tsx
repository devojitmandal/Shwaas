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
import { SECONDARY_SHADES } from '@/lib/theme/shadeTheme';
import {
  Loader2,
  AlertCircle,
  Users,
  TrendingUp,
  Sliders,
  Info,
  Share2,
  Home as HomeIcon,
  Activity,
  X,
} from 'lucide-react';

type ActiveTool = 'forecast' | 'whatif' | 'indoor' | 'science' | 'impact' | 'share' | null;

export default function Home() {
  // Localization state (en | hi | kn)
  const [language, setLanguage] = useState<SupportedLanguage>('en');

  // Cohesive brand secondary color (Sage Teal)
  const shade = SECONDARY_SHADES.teal;

  // Progressive disclosure: Interactive Analysis Workbench (at most one tool active)
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);

  const toggleTool = (tool: ActiveTool) => {
    setActiveTool((prev) => (prev === tool ? null : tool));
  };

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

        {/* Clean Top Bar: Location Search */}
        <section aria-label="Location Search" className="space-y-3">
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

              {/* European CAMS/SILAM Telemetry Notice */}
              <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
                <span>Open-Meteo European CAMS / SILAM Ensemble Forecast</span>
                <span>Calibrated against CPCB NAQI break-points</span>
              </div>
            </div>

            {/* 2. Actionable Smog Defense Plan */}
            {plan ? (
              <TodaysPlanView
                plan={plan}
                isLoading={isPlanLoading}
                source={planSource}
                onRefresh={() => airData && loadPlan(airData, profile)}
              />
            ) : isPlanLoading ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center space-y-3">
                <Loader2 className={`w-7 h-7 ${shade.accentText} animate-spin`} aria-hidden="true" />
                <p className="text-sm font-medium text-slate-600">
                  Generating tailored smog defense protocol...
                </p>
              </div>
            ) : null}

            {/* 3. Family Household Profile & Breath Budget Ledger */}
            <div className="space-y-4">
              <ProfileBadge
                profile={profile}
                onEditClick={() => setIsProfileModalOpen(true)}
              />

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
              <div className="flex justify-end px-1">
                <span className="text-[11px] text-slate-500">
                  Relative lifestyle score benchmarked against WHO 24h intake (1 pt ≈ 2.16 µg)
                </span>
              </div>
            </div>

            {/* 4. Interactive Analysis Workbench (Progressive On-Demand Tools) */}
            <section
              aria-labelledby="workbench-heading"
              className="space-y-4 pt-6 border-t border-slate-200/80"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                <div>
                  <h2 id="workbench-heading" className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    Interactive Analysis Workbench
                  </h2>
                  <p className="text-xs text-slate-500">
                    Open specialized modules on demand for forecast curves, simulations, indoor physics, and verified impact.
                  </p>
                </div>
                {activeTool && (
                  <button
                    type="button"
                    onClick={() => setActiveTool(null)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg transition-colors shadow-2xs self-start sm:self-auto focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-1 focus-visible:outline-hidden"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Close Module</span>
                  </button>
                )}
              </div>

              {/* Segmented Tab Controls */}
              <div
                role="tablist"
                aria-label="Specialized analysis tools"
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80"
              >
                {[
                  { id: 'forecast', label: '24h Forecast', icon: TrendingUp },
                  { id: 'whatif', label: 'What-If Sim', icon: Sliders },
                  { id: 'indoor', label: 'Indoor & Photo', icon: HomeIcon },
                  { id: 'science', label: 'Dose Science', icon: Info },
                  { id: 'impact', label: 'Impact Proof', icon: Activity },
                  { id: 'share', label: 'Share Card', icon: Share2 },
                ].map((tool) => {
                  const Icon = tool.icon;
                  const isSelected = activeTool === tool.id;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      role="tab"
                      id={`tab-${tool.id}`}
                      aria-selected={isSelected}
                      aria-controls={`panel-${tool.id}`}
                      onClick={() => toggleTool(tool.id as ActiveTool)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:outline-hidden ${
                        isSelected
                          ? 'bg-teal-800 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/60 shadow-2xs'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{tool.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Module Panel Container */}
              {activeTool && (
                <div
                  role="tabpanel"
                  id={`panel-${activeTool}`}
                  aria-labelledby={`tab-${activeTool}`}
                  className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-6"
                >
                  {activeTool === 'forecast' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800">
                          European CAMS / SILAM Diurnal Forecast Curve
                        </h3>
                        <span className="text-[11px] text-slate-500">Hourly PM2.5 & CPCB NAQI Projection</span>
                      </div>
                      <HourlyChart
                        hourly={airData.hourly}
                        bestStartTime={airData.bestWindow.startTime}
                        worstStartTime={airData.worstWindow.startTime}
                      />
                    </div>
                  )}

                  {activeTool === 'whatif' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800">
                          What-If Lifestyle & Intervention Simulator
                        </h3>
                        <span className="text-[11px] text-slate-500">Simulate Purifiers, Commute Shifts, and Masks</span>
                      </div>
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

                  {activeTool === 'indoor' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800">
                          Indoor Physical Modeling & Gemini Room Audit
                        </h3>
                        <span className="text-[11px] text-slate-500">Steady-state mass-balance physics & vision audit</span>
                      </div>
                      <IndoorAirModel outdoorPm25={airData.current.pm25} />
                      <PhotoRoomAudit outdoorPm25={airData.current.pm25} />
                    </div>
                  )}

                  {activeTool === 'science' && exposure && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800">
                          Scientific Dose Formula & Evidence Breakdown
                        </h3>
                        <span className="text-[11px] text-slate-500">WHO 24h Intake Benchmark (1 pt ≈ 2.16 µg)</span>
                      </div>
                      <ImpactExplainer exposure={exposure} />
                    </div>
                  )}

                  {activeTool === 'impact' && exposure && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800">
                          Verified Physical Impact Dashboard
                        </h3>
                        <span className="text-[11px] text-slate-500">Total PM2.5 Inhalation Averted</span>
                      </div>
                      <MyImpactDashboard exposure={exposure} cityName={airData.cityName} />
                    </div>
                  )}

                  {activeTool === 'share' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800">
                          WhatsApp Clean-Air Advisory Card
                        </h3>
                        <span className="text-[11px] text-slate-500">Share Safe Outdoor Windows with Family</span>
                      </div>
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
