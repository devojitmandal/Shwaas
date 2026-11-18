# AirWise: Urban Air Quality Assistant

> **Hack2Skill Hackathon Challenge 6:** Scientific GenAI Assistant for Severe Winter Smog Resilience, Inhaled Particulate Modeling & Community Self-Defense.

[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4_Tokens-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-38%2F38_Tests_Passing-729B1B?style=flat&logo=vitest)](https://vitest.dev/)
[![CPCB NAQI](https://img.shields.io/badge/Air_Standard-CPCB_India_NAQI-0E7490?style=flat)](https://cpcb.nic.in/)
[![WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG_2.1_AA-success?style=flat)](https://www.w3.org/WAI/WCAG21/AA/)

---

## 🌟 Overview

Severe winter smog across urban India traps toxic fine particulate matter ($\text{PM}_{2.5}$ and $\text{PM}_{10}$) at ground level during morning and nocturnal thermal inversions. Families frequently navigate hazardous air without scientifically accurate, actionable guidance tailored to their commute, household age groups, and home ventilation realities.

**AirWise** bridges environmental science, physical mass-balance modeling, and GenAI. It provides personalized daily smog defense routines, physical room air modeling, community defense checklists, and quantified exposure reductions — with absolute mathematical integrity.

### 🛡️ The Deterministic Boundary Principle
> **LLMs must NOT invent numbers.**
> All numerical metrics — National AQI sub-indices, physical inhaled particulate mass in micrograms ($\mu\text{g}$), indoor single-zone mass-balance concentrations, and what-if percentages — are computed **exclusively** by deterministic, unit-tested mathematical engines (`src/lib/exposure/` and `src/lib/aqi/`).
> Google Gemini 2.5 Flash acts strictly as a structured contextual communicator, receiving pre-calculated parameters and synthesizing empathetic behavioral protocols without fabricating statistics.

---

## 🚀 Key Features & Scientific Enhancements

### 1. Live CPCB NAQI & Atmospheric Telemetry
- Real-time PM2.5 and PM10 telemetry via the free **Open-Meteo Air Quality API** (no API key required).
- Exact piecewise linear sub-index calculation following **India's National Air Quality Index (NAQI)** standard (*CPCB 2014 Report*): Good (0–50), Satisfactory (51–100), Moderate (101–200), Poor (201–300), Very Poor (301–400), Severe (401–500), capped strictly at 500.
- Dominant pollutant identification (PM2.5 vs PM10).

### 2. Dynamic Meteorological Activity Window Engine
- Does **not** blindly assume afternoons are always clean.
- Analyzes hourly PM2.5, PM10, temperature, wind speed, relative humidity, and precipitation.
- **Severe Smog Lockout Detection:** If all 24 hours exceed 300 NAQI or 150 $\mu\text{g/m}^3$, AirWise triggers an explicit high-visibility warning: *"No Safe Outdoor Windows Today. All hours present hazardous pollutant burdens. Total indoor sheltering advised."*

### 3. Physical Inhaled Particulate Mass Engine ($\mu\text{g}$)
- Computes actual inhaled particulate mass using volumetric minute ventilation:
  $$\text{Inhaled Mass } (\mu\text{g}) = C_p \times Q_{\text{vent}} \times T$$
- Utilizes calibrated **EPA Exposure Factors Handbook** inhalation rates ($0.55\,\text{m}^3/\text{h}$ indoor sedentary, $0.80\,\text{m}^3/\text{h}$ transit, $1.40\,\text{m}^3/\text{h}$ active commute, $2.20\,\text{m}^3/\text{h}$ vigorous exercise).
- **Realistic N95 Protection:** Rejects unrealistic 100% claims and accounts for typical 15–20% non-fit-tested facial perimeter seal leakage (~82% effective field protection).

### 4. Physical Single-Zone Indoor Mass-Balance Room Model
- Interactive room modeling sandbox solving the steady-state mass-balance equation:
  $$C_{\text{in}} = \frac{P \cdot \text{AER} \cdot C_{\text{out}} + \frac{S}{V}}{\text{AER} + k_{\text{dep}} + \frac{\text{CADR}}{V}}$$
- Configurable room floor area, ceiling height, building envelope penetration factor ($P$), air exchange rates ($\text{AER}$), surface deposition rate ($k_{\text{dep}} = 0.20\,\text{h}^{-1}$), indoor source emissions ($S$), and mechanical purifier clean air delivery rate ($\text{CADR}$).
- **Scientific Clarification:** Purifiers do not issue a retroactive "refund" on already-inhaled pulmonary pollution; they lower the future indoor exposure rate.

### 5. Relative Breath Budget Tracker
- Intuitive daily exposure-management score (100 baseline points benchmarked against WHO 24-hr guidelines, where $1\,\text{pt} \approx 2.16\,\mu\text{g}$).
- Clearly labeled as a **relative lifestyle decision-support score**, not a clinical medical safety boundary.
- Supports activity rescheduling using the 24-hour forecast (e.g. shifting an errand from 8 AM to 1 PM saves ~45 points).

### 6. Measurable Impact Dashboard: "MY AIRWISE IMPACT"
- Visual side-by-side bar comparison of **Baseline Routine (Unmitigated)** vs **AirWise Optimized Protocol**.
- Displays total avoided particulate burden in micrograms ($\mu\text{g}$) and percentage reduction (~70–75% reduction).

### 7. Real-Time What-If Sandbox
- Reactive scenario modeling: *"What if I switch from two-wheeler to metro?"*, *"What if I fit an N95 respirator?"*, *"What if I seal bedroom windows?"*.
- Live recomputation of avoided mass with full assumptions transparency.

### 8. Today's Plan (GenAI with Zero-Hallucination Guardrails)
- Actionable low-emission routines, indoor clean-air hacks (clean-room approach, DIY box-fan + MERV 13 purifier), and verified myth-checks.
- **Fail-Safe Fallback:** Guaranteed deterministic rule-based plan if offline or without an API key.

### 9. WhatsApp Visual Share Card
- Client-side HTML5 Canvas rendering of an elegant 4:5 visual summary card (`airwise-[city]-today.png`).
- Displays AQI, dominant pollutant, dynamic window recommendations, and 3 golden family rules.
- Mobile Web Share API and desktop clipboard copy integration.

### 10. Multi-Stakeholder Community Mode
- Printable clean checklists formatted for:
  1. **Residential Welfare Associations (RWAs):** Distribute electric heaters to night guards to eliminate toxic open garbage fires; wet-mop common driveways.
  2. **Schools & Daycares:** Cancel morning outdoor assemblies; seal classroom windows.
  3. **Local Action:** Report illegal industrial waste burning to authorities.

---

## 🏗️ Architecture & Data Flow

```
┌────────────────────────────────────────────────────────┐
│                   CLIENT (Browser)                     │
│  - Location Search (Debounced 300ms + Geolocation)     │
│  - Household Profile (Stored strictly in localStorage) │
│  - Breath Budget & Single-Zone Indoor Room Model       │
│  - Interactive What-If Sandbox (Instant Client Math)   │
│  - Accessible SVG Progression Chart & WhatsApp Card    │
└──────────────────────────┬─────────────────────────────┘
                           │ POST /api/plan
                           ▼
┌────────────────────────────────────────────────────────┐
│               SERVER ROUTE HANDLER                     │
│  - In-memory Sliding Window Rate Limiter (15 req/min)  │
│  - Input Validation via Zod Schemas                    │
│  - Deterministic Exposure Engine (lib/exposure/engine) │
│  - Zero Secret Exposure (GEMINI_API_KEY server-only)   │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
        (API Key Exists)            (No Key / Offline)
               │                          │
               ▼                          ▼
┌──────────────────────────────┐   ┌─────────────────────┐
│    GOOGLE GEMINI 2.5 FLASH   │   │ DETERMINISTIC RULE  │
│ - Strict Anti-Hallucination  │   │   FALLBACK ENGINE   │
│ - Forced JSON Schema Output  │   │  (100% Deterministic│
└──────────────┬───────────────┘   │   Zero Downtime)    │
               │                   └──────────┬──────────┘
               │ Validate JSON via Zod        │
               └──────────────┬───────────────┘
                              ▼
                   Validated Plan Response
```

---

## 📁 Project Structure

```
airwise/
├── docs/
│   ├── ASSUMPTIONS.md         # Scientific formulas, CPCB breakpoints, EPA inhalation rates, mass-balance
│   ├── SECURITY.md            # Zero-trust Zod validation, rate limiting, CSP, privacy guarantees
│   └── DEMO_SCRIPT.md         # 2-minute video walkthrough script
├── src/
│   ├── app/
│   │   ├── api/plan/          # Server route handler (Gemini + Zod + rate limiter + fallback)
│   │   ├── layout.tsx         # Root layout with font and metadata configuration
│   │   └── page.tsx           # Main application view assembling all scientific modules
│   ├── components/
│   │   ├── aqi/               # CurrentAqiCard, HourlyChart, LocationSearch, TimeWindowsCard
│   │   ├── budget/            # BreathBudgetTracker (relative 100-pt index, activity ledger)
│   │   ├── community/         # CommunityModeModal (RWAs, Schools, Local Action printouts)
│   │   ├── impact/            # MyImpactDashboard (Baseline vs Optimized side-by-side comparison)
│   │   ├── indoor/            # IndoorAirModel (Physical single-zone mass-balance sandbox)
│   │   ├── layout/            # Header (scroll-aware navigation, modal triggers)
│   │   ├── plan/              # TodaysPlanView, ImpactExplainer, WhatIfSimulator
│   │   ├── profile/           # HouseholdProfileModal, ProfileBadge
│   │   ├── share/             # WhatsAppShareCard (Canvas rendering, Web Share API)
│   │   └── ui/                # HeroTitle, Accessible badges
│   └── lib/
│       ├── api/openMeteo.ts   # Open-Meteo AQI + weather API fetcher, dynamic window analyzer
│       ├── aqi/naqi.ts        # CPCB NAQI piecewise interpolation (PM2.5, PM10, 500 cap)
│       ├── exposure/
│       │   ├── engine.ts      # Deterministic physical mass engine & indoor mass-balance
│       │   └── breathBudget.ts# Breath budget relative scoring & rescheduling
│       ├── plan/planSchema.ts # Zod response schema & deterministic fallback generator
│       ├── security/          # In-memory sliding-window IP rate limiter
│       └── validation/        # Household profile Zod schema & localStorage helpers
```

---

## 🧪 Testing & Verification

AirWise maintains 100% passing test coverage across 13 test suites and 38 unit/integration tests:

```bash
cd C:\Users\devoj\Hackathon\airwise
npm test
```

### Test Suite Summary:
- `src/lib/aqi/naqi.test.ts`: CPCB NAQI boundary checks, sub-indices, dominant pollutant logic, 500 cap.
- `src/lib/exposure/engine.test.ts`: Physical inhaled PM2.5 mass intake ($\mu\text{g}$), N95 fit leakage, single-zone indoor mass-balance equation, deterministic what-if evaluations.
- `src/lib/exposure/breathBudget.test.ts`: Relative planning index without medical safety claims, hourly forecast activity rescheduling, future mitigation math.
- `src/lib/api/openMeteo.test.ts`: Open-Meteo payload parsing, meteorological window recommendations, severe smog lock alert.
- `src/lib/plan/plan.test.ts`: Schema validation, fallback plan structural validity, medical disclaimers.
- `src/app/api/plan/route.test.ts`: Server route handler, rate limiter integration, fallback dispatching, 64KB payload limit, prompt-injection sanitization.
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
git clone https://github.com/devoj/airwise.git
cd airwise
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
3. **U.S. Environmental Protection Agency (EPA):** *Exposure Factors Handbook: 2011 Edition*, Chapter 6 (Inhalation Rates).
4. **Nazaroff, W. W. (2004):** *Indoor particle dynamics*, Indoor Air, 14(s7), 175-183.
5. **National Institute for Occupational Safety and Health (NIOSH):** *Respiratory Protection - Filtration and Total Inward Leakage (TIL) Performance Standards*.
6. **Open-Meteo:** *Atmospheric Chemistry Forecasts & European Centre for Medium-Range Weather Forecasts (ECMWF / Copernicus CAMS / SILAM ensemble)*.
