# AirWise: Urban Air Quality Assistant

> **Hack2Skill Hackathon Challenge 6:** GenAI Assistant for Severe Winter Smog Resilience & Community Self-Defense.

[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4_Tokens-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-100%25_Passing-729B1B?style=flat&logo=vitest)](https://vitest.dev/)
[![CPCB NAQI](https://img.shields.io/badge/Air_Standard-CPCB_India_NAQI-0E7490?style=flat)](https://cpcb.nic.in/)
[![WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG_2.1_AA-success?style=flat)](https://www.w3.org/WAI/WCAG21/AA/)

---

## 🌟 Overview

Winter smog across urban India traps toxic fine particulate matter at ground level during morning and nocturnal thermal inversions. Families frequently experience extreme smog without actionable, calibrated guidance tailored to their commute, household age groups, and home ventilation realities.

**AirWise** is an urban air quality assistant that provides personalized daily routines, scientifically backed indoor air hacks, community defense checklists, and quantified exposure reductions.

### 🛡️ The Deterministic Boundary Principle
> **LLMs must NOT invent numbers.**
> All numerical metrics — National AQI sub-indices, daily inhaled microgram-hour doses ($\mu\text{g}\cdot\text{h/m}^3$), indoor infiltration ratios, and what-if percentages — are computed **exclusively** by a deterministic, unit-tested scientific mathematical engine (`src/lib/exposure/` and `src/lib/aqi/`).
> Google Gemini 2.5 Flash acts strictly as a contextual communicator, receiving pre-calculated parameters and synthesizing empathetic, structured behavioral protocols.

---

## 🚀 Key Features

1. **Live CPCB NAQI & Telemetry:**
   - Real-time PM2.5 and PM10 telemetry via the free **Open-Meteo Air Quality API** (no API key required).
   - Exact piecewise linear sub-index calculation following **India's National Air Quality Index (NAQI)** standard (Good 0–50, Satisfactory 51–100, Moderate 101–200, Poor 201–300, Very Poor 301–400, Severe 401–500, capped at 500).
   - Dominant pollutant attribution (PM2.5 vs PM10).

2. **Inversion Forecast & Optimal Windows:**
   - 24-hour interactive forecast chart illustrating nocturnal inversion peaks vs afternoon convective dispersion.
   - Algorithmic detection of the **Optimal Outdoor Window** (lowest smog period for errands/ventilation) and **Peak Smog Trap** (dangerous thermal inversion window).

3. **Privacy-First Household Profile:**
   - Captures number of children, senior citizens, commute vehicle type, cooking fuel, purifier ownership, and mask usage.
   - **Zero-Storage Privacy:** Stored purely in browser `localStorage`. No accounts, no databases, no personal health data transmitted to any server.

4. **Deterministic Inhaled Dose Engine:**
   - Microenvironmental time-activity mass-exposure model quantifying daily particulate dose ($\mu\text{g}\cdot\text{h/m}^3$).
   - Calculates the outdoor-versus-indoor exposure split, demonstrating how indoor infiltration often dominates 24-hour exposure without active filtration.

5. **Real-Time What-If Sandbox:**
   - Instant live simulation: *"What if I commute by metro instead of two-wheeler?"*, *"What if I switch from cloth mask to N95?"*, *"What if I deploy a DIY box-fan filter?"*.
   - Live reactive recalculation of daily exposure dose and percentage savings.

6. **Today's Plan (GenAI + Fallback Engine):**
   - Low-emission daily routines with quantified impact on each recommendation.
   - Indoor air quality hacks (clean-room approach, DIY box-fan + MERV 13 filter, timed afternoon flushes).
   - Scientific myth-checks (e.g. debunking houseplants and wet towels as fine PM2.5 purifiers).
   - High-smog sensitive group alerts for infants and seniors.
   - **Offline/No-Key Fallback:** Completely functional with deterministic rule sets even when offline or without an LLM API key.

7. **Community Mode (Shareable & Printable):**
   - Actionable checklists for **Residential Welfare Associations (RWAs)**, apartment societies, and **Schools/Daycares**.
   - Concrete steps: distributing electric heaters to night security guards to ban open trash fires, wet-mopping driveways instead of dry-sweeping, and rescheduling outdoor assemblies.
   - One-click clean print layout (`window.print()`).

8. **Personal "Breath Budget" (Calorie-Style Particle Allowance):**
   - Turns abstract AQI numbers into an intuitive daily particulate budget (100 baseline points).
   - High-smog morning two-wheeler commutes "spend" points heavily; shifting to afternoon solar mixing or wearing an N95 discounts the cost by 90%; bedroom HEPA filtration grants point "refunds".
   - Interactive activity ledger allowing users to add custom daily routines and monitor their particle overdraft status live.

9. **WhatsApp Visual Share Card (One-Tap Indian Family Share):**
   - Instant client-side HTML5 Canvas rendering of an eye-catching, high-resolution 4:5 visual summary card (`airwise-delhi-today.png`).
   - One-tap WhatsApp Web / mobile app sharing with formatted text summary of today's AQI, best afternoon errand windows, morning smog trap warnings, and 3 golden rules for families.

---

## 🏗️ Architecture & Data Flow

```
┌────────────────────────────────────────────────────────┐
│                   CLIENT (Browser)                     │
│  - Location Search (Debounced 300ms + Geolocation)     │
│  - Household Profile (Stored strictly in localStorage) │
│  - Interactive What-If Sandbox (Instant Client Math)   │
│  - Accessible SVG Progression Chart & Live NAQI Card   │
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

## 🧠 Prompt Flow & LLM Engineering (For LinkedIn / Technical Review)

The Gemini integration is designed around **zero-hallucination data governance**:

1. **Mathematical Isolation:** The LLM is never asked to calculate exposure numbers or percentage reductions. Instead, our deterministic engine (`calculateDailyExposure`) runs first, generating:
   - Baseline Inhaled Particulate Dose ($\mu\text{g}\cdot\text{h/m}^3$)
   - Outdoor vs Indoor Dose split
   - Steady-state indoor room concentration ($C_{\text{in}}$)
   - Maximum potential reduction percentage
   - Health risk tier keyed to CPCB NAQI and household vulnerability
2. **System Prompt Constraint:**
   ```
   CRITICAL CONSTRAINT: You must NOT invent, guess, or hallucinate any numbers or percentages.
   All exposure metrics, sub-indices, and percentage reductions are pre-computed by our deterministic engine.
   Explain the direct impact of each choice using ONLY the deterministic figures provided.
   Output MUST strictly conform to the JSON schema.
   ```
3. **Double Zod Validation:** The response is parsed with `responseMimeType: 'application/json'` and validated against `planResponseSchema`. If validation fails or Gemini experiences rate limits, the system seamlessly serves `generateFallbackPlan` without breaking user flow.

---

## 🛠️ Stack & Technologies

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | High-performance React server and client components |
| **Language** | TypeScript (Strict) | End-to-end type safety |
| **Styling** | Tailwind CSS v4 | CSS variable design tokens, responsive layout |
| **Motion** | Framer Motion | Accessible motion, `useReducedMotion`, scroll-aware header |
| **Data Validation**| Zod | Runtime schema validation on client, server, and LLM output |
| **LLM Provider** | Google GenAI SDK (`@google/genai`) | Server-side Gemini 2.5 Flash invocation |
| **Telemetry** | Open-Meteo Air Quality API | Free real-time PM2.5, PM10, and hourly forecasts |
| **Test Suite** | Vitest + React Testing Library | Unit tests for exposure engine, CPCB tables, and UI |
| **Icons** | Lucide React | Clear accessible visual metaphors |

---

## 📊 Scientific Methodology & Assumptions

Detailed formulations, CPCB breakpoint tables, infiltration ratios, and respirator penetration factors are documented in:
📄 [docs/ASSUMPTIONS.md](file:///docs/ASSUMPTIONS.md)

Security controls, rate limiting, and zero-trust privacy guarantees are documented in:
📄 [docs/SECURITY.md](file:///docs/SECURITY.md)

2-minute demo video narration script:
📄 [docs/DEMO_SCRIPT.md](file:///docs/DEMO_SCRIPT.md)

---

## ⚡ Quick Start & Development

### 1. Prerequisites
- Node.js `v20+` or `v24+`
- npm `v10+`

### 2. Installation
```bash
git clone https://github.com/devojit/airwise.git
cd airwise
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local` (optional, for Gemini personalized mode):
```bash
cp .env.example .env.local
```
Add your Gemini API Key in `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Note: If no API key is provided, AirWise automatically runs in deterministic fallback mode with 100% feature availability).*

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running the Automated Test Suite
```bash
npm test
```
Runs 27+ comprehensive unit and integration tests across CPCB breakpoints, the exposure engine, Zod schemas, rate limiters, and React components.

### 6. Production Build & Linting
```bash
npm run lint
npm run build
```

---

## ♿ Accessibility (WCAG 2.1 AA Compliance)

- **Text Alternatives for Color:** NAQI categories use chip background fills with high-contrast text ($\ge 4.5:1$ contrast ratio). Color is never used alone; category names and icon badges accompany every status.
- **Screen Reader Support:** Hourly forecast chart includes an accessible text table disclosure and ARIA live regions.
- **Reduced Motion:** Fully respects `prefers-reduced-motion` through global CSS overrides and Framer Motion's `useReducedMotion()`.
- **Keyboard Navigability:** Full keyboard tabbing with visible `:focus-visible` outline rings.

---

## ⚖️ License & Medical Disclaimer

AirWise is distributed under the MIT License.

**Decision-Support Notice:** AirWise calculates exposure doses and reductions strictly from deterministic environmental equations and CPCB NAQI tables for community resilience. It does not provide medical diagnosis, clinical treatment, or physician advice. Always consult a licensed healthcare practitioner for medical guidance.
