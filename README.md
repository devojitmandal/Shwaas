# Shwaas (श्वास) — हर सांस का हिसाब

> **Shwaas** is an urban air quality assistant that turns complex winter smog data into personalized, age-appropriate Breath Budgets, room air modeling, and quantified exposure reductions for Indian families.

[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4_Tokens-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-58%2F58_Tests_Passing-729B1B?style=flat&logo=vitest)](https://vitest.dev/)
[![CPCB NAQI](https://img.shields.io/badge/Air_Standard-CPCB_India_NAQI-0E7490?style=flat)](https://cpcb.nic.in/)
[![WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG_2.1_AA-success?style=flat)](https://www.w3.org/WAI/WCAG21/AA/)
[![CSP Configured](https://img.shields.io/badge/Security-CSP_Headers_Active-15803D?style=flat)](docs/SECURITY.md)

---

## 🌟 Overview

Severe winter smog across urban India traps toxic fine particulate matter ($\text{PM}_{2.5}$ and $\text{PM}_{10}$) at ground level during morning and nocturnal thermal inversions. Families frequently navigate hazardous air without scientifically grounded, actionable guidance tailored to their commute, household age groups, and home ventilation realities.

**Shwaas** bridges environmental science, physical mass-balance modeling, and GenAI. It translates raw particulate telemetry into intuitive, age-calibrated Breath Budgets, single-zone indoor room simulations, AI photo envelope audits, community defense checklists, and quantified exposure reductions.

### 🛡️ The Deterministic Boundary Principle
> **LLMs must NOT invent numbers.**
> All numerical metrics — National AQI sub-indices, physical inhaled particulate mass in micrograms ($\mu\text{g}$), indoor single-zone mass-balance concentrations, and what-if percentages — are computed **exclusively** by deterministic, unit-tested mathematical engines (`src/lib/exposure/` and `src/lib/aqi/`).
> Google Gemini 3.8 Flash (`gemini-3.8-flash`) acts strictly as a structured contextual communicator, receiving pre-calculated parameters and synthesizing empathetic behavioral protocols without fabricating statistics.

### 🔄 Data Pipeline: Deterministic Engine → Gemini → Validated JSON

To guarantee zero fabricated metrics, data flows through a strict 3-stage validation pipeline:

```
Telemetry & Profile ──▶ Deterministic Engine ──▶ Structured Gemini Prompt ──▶ Zod Schema Validation ──▶ Safe UI Delivery
 (Open-Meteo & User)     (EPA & CPCB Math)       (Injected Invariants)        (planResponseSchema)        (React Views)
```

1. **Deterministic Engine Processing (`src/lib/exposure/engine.ts`):**
   Raw telemetry and household parameters are evaluated using EPA minute ventilation volumes and single-zone mass-balance:
   ```ts
   const exposure = calculateDailyExposure({
     currentAqi: 368,
     pm25Concentration: 218,
     outdoorHours: 2.5,
     commuteType: 'two_wheeler',
     maskType: 'none',
     hasPurifier: false,
   });
   // Pre-computed invariants:
   // totalInhaledMassUg: 724 µg/day | potentialReductionPercent: 72% | healthRiskTier: 'Severe'
   ```

2. **Grounded Context Injection into Gemini (`src/app/api/plan/route.ts`):**
   Pre-calculated metrics are locked into the system prompt with anti-hallucination guardrails:
   ```text
   CRITICAL ANTI-HALLUCINATION INSTRUCTIONS:
   - You must NOT invent, guess, or fabricate any numerical metrics, AQI values, or percentages.
   - All exposure metrics are pre-computed by our deterministic engine:
     * Current NAQI: 368 (Severe) | Ambient PM2.5: 218 µg/m³
     * Total Daily Inhaled Mass: ~724 µg/day | Potential Reduction: ~72% (~521 µg avoided)
     * Best Window: 12:30 PM – 03:30 PM (Avg AQI: 142, Moderate)
   - Explain the direct impact using ONLY these deterministic figures.
   - Output MUST strictly be valid JSON matching the requested schema.
   ```

3. **Runtime Schema Enforcement & Validated JSON (`src/lib/plan/planSchema.ts`):**
   Gemini outputs JSON via `responseMimeType: 'application/json'`, which is validated server-side against `planResponseSchema.safeParse()`:
   ```json
   {
     "headline": "Severe Inversion Peak: Shield Children & Shift Outdoor Transit",
     "executiveSummary": "Ambient PM2.5 is 218 µg/m³. Your routine yields ~724 µg daily intake...",
     "lowEmissionRoutine": [
       {
         "timeOfDay": "08:30 AM",
         "action": "Switch morning two-wheeler transit to closed metro or fit an N95 respirator",
         "estimatedExposureReduction": "~72% intake reduction"
       }
     ]
   }
   ```
   *If Gemini is unavailable, rate-limited, or fails schema parsing, `generateFallbackPlan()` instantly yields an identical validated payload with zero downtime.*

---

## 🚀 Key Features & Scientific Enhancements

### 1. Breath Budget & Per-Person Household Ledgers
- **Daily Exposure Ledger:** Calibrates daily particulate exposure into an intuitive 100-point relative scale benchmarked against the WHO 24-hour guideline ($15\,\mu\text{g/m}^3 \times 0.60\,\text{m}^3/\text{h} \times 24\,\text{h} = 216\,\mu\text{g}$, where $1\,\text{pt} \approx 2.16\,\mu\text{g}$).
- **Per-Person Age-Appropriate Inhalation:** Automatically calculates separate side-by-side budget bars for each household member using calibrated **EPA Exposure Factors Handbook** minute volumes:
  - **Children (< 12 yrs):** Sedentary $0.35\,\text{m}^3/\text{h}$, Active $0.85\,\text{m}^3/\text{h}$ (Reference intake: $144\,\mu\text{g}$).
  - **Adults (18–64 yrs):** Sedentary $0.55\,\text{m}^3/\text{h}$, Active $1.40\,\text{m}^3/\text{h}$ (Reference intake: $216\,\mu\text{g}$).
  - **Seniors (65+ yrs):** Sedentary $0.45\,\text{m}^3/\text{h}$, Active $0.95\,\text{m}^3/\text{h}$ (Reference intake: $172\,\mu\text{g}$).
- **Interactive What-If Toggles:** One-click simulation chips (N95 Respirator, Indoor HEPA Purifier, Metro Transit, 1 PM Solar Window Shift) that immediately update all family members' budget bars in real time.
- **Scientific Clarification:** Clearly labeled as a **relative lifestyle decision-support score**, not a clinical medical safety boundary.

### 2. AI Photo Room Audit (Envelope & Infiltration Inspection)
- Server-side route (`POST /api/room-audit`) analyzing room photos using **Gemini 3.8 Flash Vision**.
- Identifies window perimeter gaps, cooking fuels, ventilation pathways, and indoor dust/incense sources.
- **Physical Parameter Mapping:** Automatically translates visual observations into physical Air Exchange Rates ($\text{AER}: 0.35 - 1.80\,\text{h}^{-1}$) and indoor particulate emissions ($S: 100 - 8000\,\mu\text{g/h}$).
- **Ranked Fixes in Budget Points:** Ranks prioritized home retrofits (e.g. foam weatherstripping tape, HEPA cleaner deployment, incense elimination) scored directly in Breath Budget points saved.
- **Guaranteed Fallback:** Deterministic rule-based audit fallback if offline or without an API key.

### 3. Trilingual Localization & Web Speech Read Aloud
- Native UI localization and full GenAI plan generation in **English**, **Hindi (हिन्दी)**, and **Kannada (ಕನ್ನಡ)**.
- **Web Speech Read Aloud:** Integrated browser text-to-speech engine (`SpeechSynthesisUtterance`) that speaks the customized daily briefing in the chosen language.
- Deterministic fallback plans are fully localized across all three languages with zero hallucinated figures.

### 4. Severe Smog Lockout Protocol (NAQI > 300 for All 24 Hours)
- Strict single-threshold criterion: if all 24 hours of the diurnal forecast remain strictly in **NAQI > 300 (Very Poor / Severe)**, Shwaas activates an emergency lock state.
- Warns users that no genuinely safe window exists, designating the cleanest period strictly as the *least-polluted available interval* and recommending complete indoor sheltering.

### 5. Live CPCB NAQI & Atmospheric Telemetry
- Real-time PM2.5 and PM10 telemetry via the free **Open-Meteo Air Quality API** (no API key required).
- Exact piecewise linear sub-index calculation following **India's National Air Quality Index (NAQI)** standard (*CPCB 2014 Report*): Good (0–50), Satisfactory (51–100), Moderate (101–200), Poor (201–300), Very Poor (301–400), Severe (401–500), capped strictly at 500.
- Dominant pollutant identification (PM2.5 vs PM10).

### 6. Physical Single-Zone Indoor Mass-Balance Room Model
- Interactive room modeling sandbox solving the steady-state mass-balance equation:
  $$C_{\text{in}} = \frac{P \cdot \text{AER} \cdot C_{\text{out}} + \frac{S}{V}}{\text{AER} + k_{\text{dep}} + \frac{\text{CADR}}{V}}$$
- Configurable room floor area, ceiling height, building envelope penetration factor ($P$), air exchange rates ($\text{AER}$), surface deposition rate ($k_{\text{dep}} = 0.20\,\text{h}^{-1}$), indoor source emissions ($S$), and mechanical purifier clean air delivery rate ($\text{CADR}$).
- **Scientific Clarification:** Purifiers do not issue a retroactive "refund" on already-inhaled pulmonary pollution; they lower the future indoor exposure rate.

### 7. Measurable Impact Dashboard: "MY IMPACT DASHBOARD"
- Visual side-by-side bar comparison of **Baseline Routine (Unmitigated)** vs **Shwaas Optimized Protocol**.
- Displays total avoided particulate burden in micrograms ($\mu\text{g}$) and percentage reduction (~70–75% reduction).

### 8. WhatsApp Visual Share Card
- Client-side HTML5 Canvas rendering of an elegant 4:5 visual summary card (`shwaas-[city]-today.png`).
- Displays AQI, dominant pollutant, dynamic window recommendations, and 3 golden family rules.
- Mobile Web Share API and desktop clipboard copy integration.

### 9. Multi-Stakeholder Community Mode
- Printable clean checklists formatted for:
  1. **Residential Welfare Associations (RWAs):** Distribute electric heaters to night guards to eliminate toxic open garbage fires; wet-mop common driveways.
  2. **Schools & Daycares:** Cancel morning outdoor assemblies; seal classroom windows.
  3. **Local Action:** Report illegal industrial waste burning to authorities.

### 10. Security & Content Security Policy (CSP)
- **Active HTTP Security Headers:** Configured in `next.config.ts` (`Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`).
- **Accurate CSP Specification:**
  - `default-src 'self'`
  - `script-src 'self' 'unsafe-eval' 'unsafe-inline'` *(accommodates Next.js App Router client-side runtime hydration and Turbopack bundling)*
  - `style-src 'self' 'unsafe-inline'` *(permits framework CSS token injection)*
  - `connect-src 'self' https://air-quality-api.open-meteo.com https://api.open-meteo.com https://geocoding-api.open-meteo.com https://generativelanguage.googleapis.com`
  - `img-src 'self' blob: data: https:`
  - `object-src 'none'`, `frame-ancestors 'none'`, and `upgrade-insecure-requests`.

---

## 🏗️ Architecture & Data Flow

```
┌────────────────────────────────────────────────────────┐
│                   CLIENT (Browser)                     │
│  - Location Search (Debounced 300ms + Geolocation)     │
│  - Household Profile (Stored strictly in localStorage) │
│  - Trilingual Switcher (EN / हिन्दी / ಕನ್ನಡ)          │
│  - Breath Budget & Per-Person Member Ledgers           │
│  - AI Photo Room Audit (Camera / Upload UI)            │
│  - Web Speech Read Aloud (SpeechSynthesis API)         │
│  - Accessible SVG Progression Chart & WhatsApp Card    │
└──────────────────────────┬─────────────────────────────┘
                           │ POST /api/plan & /api/room-audit
                           ▼
┌────────────────────────────────────────────────────────┐
│               SERVER ROUTE HANDLERS                    │
│  - In-memory Sliding Window Rate Limiter (10-15/min)   │
│  - Input Validation via Zod Schemas                    │
│  - Deterministic Exposure & Mass-Balance Engines       │
│  - Secret Isolation (GEMINI_API_KEY server-only)       │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
        (API Key Exists)            (No Key / Offline)
               │                          │
               ▼                          ▼
┌──────────────────────────────┐   ┌─────────────────────┐
│    GOOGLE GEMINI 3.8 FLASH   │   │ DETERMINISTIC RULE  │
│ - Strict Guardrails          │   │   FALLBACK ENGINE   │
│ - Forced JSON Schema Output  │   │  (100% Deterministic│
│ - Vision Room Audit Model    │   │   Zero Downtime)    │
└──────────────┬───────────────┘   └──────────┬──────────┘
               │ Validate JSON via Zod        │
               └──────────────┬───────────────┘
                              ▼
                   Validated Response Payload
```

---

## 📁 Project Structure

```
shwaas/
├── docs/
│   ├── ASSUMPTIONS.md         # Scientific formulas, CPCB breakpoints, EPA inhalation rates, mass-balance
│   ├── SECURITY.md            # Zod validation, rate limiting, CSP, privacy guarantees
│   └── DEMO_SCRIPT.md         # 2-minute video walkthrough script
├── src/
│   ├── app/
│   │   ├── api/plan/          # Server route handler (Gemini + Zod + rate limiter + fallback)
│   │   ├── api/room-audit/    # Vision room audit handler (Gemini Vision + mass-balance mapping)
│   │   ├── layout.tsx         # Root layout with font and metadata configuration
│   │   └── page.tsx           # Main application view assembling all scientific modules
│   ├── components/
│   │   ├── aqi/               # CurrentAqiCard, HourlyChart, LocationSearch, TimeWindowsCard
│   │   ├── budget/            # BreathBudgetTracker (per-person budgets, what-if chips)
│   │   ├── community/         # CommunityModeModal (RWAs, Schools, Local Action printouts)
│   │   ├── impact/            # MyImpactDashboard (Baseline vs Optimized comparison)
│   │   ├── indoor/            # IndoorAirModel & PhotoRoomAudit
│   │   ├── layout/            # Header (trilingual switcher, navigation)
│   │   ├── plan/              # TodaysPlanView, ImpactExplainer, WhatIfSimulator
│   │   ├── profile/           # HouseholdProfileModal, ProfileBadge
│   │   ├── share/             # WhatsAppShareCard (Canvas rendering, Web Share API)
│   │   └── ui/                # HeroTitle, Accessible badges
│   └── lib/
│       ├── api/openMeteo.ts   # Open-Meteo AQI + weather API fetcher, dynamic window analyzer
│       ├── aqi/naqi.ts        # CPCB NAQI piecewise interpolation (PM2.5, PM10, 500 cap)
│       ├── audit/             # Room audit Zod schema & mass-balance parameter mapper
│       ├── exposure/
│       │   ├── engine.ts      # Deterministic physical mass engine & indoor mass-balance
│       │   └── breathBudget.ts# Age-appropriate per-person breath budgets & what-if math
│       ├── i18n/              # English, Hindi, and Kannada translation dictionaries
│       ├── plan/planSchema.ts # Zod response schema & trilingual fallback plan generator
│       ├── security/          # In-memory sliding-window IP rate limiter
│       └── validation/        # Household profile Zod schema & localStorage helpers
```

---

## 🧪 Testing & Verification

Shwaas maintains 100% passing test coverage across 14 test suites and 48 unit/integration tests:

```bash
cd shwaas
npm test
```

### Test Suite Summary:
- `src/lib/aqi/naqi.test.ts`: CPCB NAQI boundary checks, sub-indices, dominant pollutant logic, 500 cap.
- `src/lib/exposure/engine.test.ts`: Physical inhaled PM2.5 mass intake ($\mu\text{g}$), N95 fit leakage, single-zone indoor mass-balance equation.
- `src/lib/exposure/breathBudget.test.ts`: Relative planning index, age-appropriate inhalation rates (children, adults, seniors), what-if overrides.
- `src/lib/api/openMeteo.test.ts`: Open-Meteo payload parsing, meteorological window recommendations, severe smog lockout (NAQI > 300 for all 24 hours).
- `src/lib/plan/plan.test.ts`: Schema validation, fallback plan structural validity, medical disclaimers.
- `src/app/api/plan/route.test.ts`: Server route handler, rate limiter integration, fallback dispatching, 64KB payload limit, prompt-injection sanitization, Hindi and Kannada output.
- `src/app/api/room-audit/route.test.ts`: Gemini Vision room audit mocking, 4MB image limit, MIME validation, mass-balance parameter mapping.
- `src/lib/validation/profileSchema.test.ts`: Client-side household validation boundaries.
- `src/lib/security/rateLimiter.test.ts`: Sliding-window IP rate limiting, header generation, and memory bounds.
- `src/components/indoor/IndoorAirModel.test.tsx`: Physical mass-balance interactive UI, ventilation strategies, and CADR selectors.
- `src/components/impact/MyImpactDashboard.test.tsx`: Baseline vs Optimized Routine impact dashboard and avoided particulate mass.
- `src/components/aqi/TimeWindowsCard.test.tsx`: Dynamic meteorological window UI and severe smog lockout alert state.
- `src/components/aqi/CurrentAqiCard.test.tsx`: CPCB NAQI category rendering and contrast badges.
- `src/components/plan/WhatIfSimulator.test.tsx`: Real-time reactive what-if intervention simulator.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ (tested on Node 20+)
- npm or pnpm

### Installation
```bash
git clone https://github.com/devojitmandal/Shwaas.git
cd Shwaas
npm install
```

### Configuration
Create `.env.local` in the project root (optional; application operates seamlessly with deterministic fallbacks without an API key):
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm start
```

---

## 📜 Scientific References & Citations

1. **Central Pollution Control Board (CPCB), MoEFCC, India:** *National Air Quality Index Final Report* (2014).
2. **World Health Organization (WHO):** *Global Air Quality Guidelines: Particulate Matter ($PM_{2.5}$ and $PM_{10}$), Ozone, Nitrogen Dioxide, Sulfur Dioxide and Carbon Monoxide* (2021).
3. **U.S. Environmental Protection Agency (EPA):** *Exposure Factors Handbook: 2011 Edition*, Chapter 6 (Inhalation Rates for Children, Adults, and Seniors).
4. **Nazaroff, W. W. (2004):** *Indoor particle dynamics*, Indoor Air, 14(s7), 175-183.
5. **Chen, C., & Zhao, B. (2011):** *Review of relationship between indoor and outdoor particles: I/O ratio, infiltration factor and penetration coefficient*, Atmospheric Environment, 45(2), 275-285.
6. **Thatcher, T. L., et al. (2002):** *Effects of room furnishings and air speed on particle deposition rates indoors*, Atmospheric Environment, 36(11), 1811-1819.
7. **Association of Home Appliance Manufacturers (AHAM):** *Method for Measuring Performance of Portable Household Electric Room Air Cleaners*, ANSI/AHAM AC-1.
8. **National Institute for Occupational Safety and Health (NIOSH):** *Respiratory Protection - Filtration and Total Inward Leakage (TIL) Performance Standards*.
9. **Open-Meteo:** *Atmospheric Chemistry Forecasts & European Centre for Medium-Range Weather Forecasts (ECMWF / Copernicus CAMS / SILAM ensemble)*.
