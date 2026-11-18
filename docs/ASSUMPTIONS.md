# AirWise: Scientific Assumptions & Methodology Reference

This document outlines the scientific foundations, mathematical formulations, empirical parameters, and reference literature underlying the AirWise calculation engines:
- CPCB National Air Quality Index (NAQI) Engine (`src/lib/aqi/naqi.ts`)
- Deterministic Inhaled Mass Exposure Engine (`src/lib/exposure/engine.ts`)
- Single-Zone Indoor Mass-Balance Engine (`src/lib/exposure/engine.ts`, `src/components/indoor/IndoorAirModel.tsx`)
- Relative Breath Budget Tracker (`src/lib/exposure/breathBudget.ts`)
- Dynamic Meteorological Window Recommender (`src/lib/api/openMeteo.ts`)

> [!IMPORTANT]
> **Decision Support Notice:** AirWise calculates exposure doses and reductions based on peer-reviewed microenvironmental models to empower family and community resilience against winter smog. Outputs are scientific estimates for lifestyle optimization, not diagnostic or individual clinical medical advice.

---

## 1. National Air Quality Index (NAQI) - India Standard

AirWise implements the **Central Pollution Control Board (CPCB)** methodology formulated by the Ministry of Environment, Forest and Climate Change (MoEFCC), Government of India (*CPCB 2014 Final Report on National Air Quality Index*).

### 1.1 Sub-Index Piecewise Linear Interpolation
For each particulate pollutant ($\text{PM}_{2.5}$, $\text{PM}_{10}$), the sub-index $I_p$ is calculated using the standard breakpoint equation:

$$I_p = I_{\text{low}} + \frac{I_{\text{high}} - I_{\text{low}}}{C_{\text{high}} - C_{\text{low}}} \times (C_p - C_{\text{low}})$$

Where:
- $C_p$: Measured or modeled pollutant concentration ($\mu\text{g/m}^3$).
- $[C_{\text{low}}, C_{\text{high}}]$: Breakpoint concentration range containing $C_p$.
- $[I_{\text{low}}, I_{\text{high}}]$: Corresponding AQI sub-index category range.

The composite NAQI is determined by the dominant pollutant:
$$\text{NAQI} = \min\left(500, \max(I_{\text{PM2.5}}, I_{\text{PM10}})\right)$$

### 1.2 CPCB Breakpoint Tables

| Category | NAQI Range | PM2.5 Range ($\mu\text{g/m}^3$) | PM10 Range ($\mu\text{g/m}^3$) | Public Health Impact Statement |
|---|---|---|---|---|
| **Good** | 0 – 50 | 0 – 30 | 0 – 50 | Minimal health impact. |
| **Satisfactory** | 51 – 100 | 31 – 60 | 51 – 100 | Minor breathing discomfort to sensitive people. |
| **Moderate** | 101 – 200 | 61 – 90 | 101 – 250 | Breathing discomfort to people with lung/heart disease and children. |
| **Poor** | 201 – 300 | 91 – 120 | 251 – 350 | Breathing discomfort to most people on prolonged exposure. |
| **Very Poor** | 301 – 400 | 121 – 250 | 351 – 430 | Respiratory illness on prolonged exposure. |
| **Severe** | 401 – 500 | 251 – 380+ | 431 – 510+ | Affects healthy people and seriously impacts vulnerable groups. |

*Concentrations above the severe breakpoint upper threshold are capped strictly at 500.*

---

## 2. Inhaled Particulate Mass Intake Model

Rather than relying purely on unitless indices, AirWise models the actual estimated **inhaled particulate mass intake** in micrograms ($\mu\text{g}$):

$$\text{Inhaled Mass } (\mu\text{g}) = C_p \times Q_{\text{vent}} \times T$$

Where:
- $C_p$: Effective microenvironmental PM2.5 concentration ($\mu\text{g/m}^3$).
- $Q_{\text{vent}}$: Volumetric minute ventilation / inhalation rate ($\text{m}^3/\text{hour}$).
- $T$: Duration of microenvironmental exposure (hours).

### 2.1 EPA Volumetric Inhalation Rates ($Q_{\text{vent}}$)
Calibrated from the *EPA Exposure Factors Handbook (2011 Edition, Chapter 6: Inhalation Rates)*:
- **Sedentary / Indoor Living:** $0.55\,\text{m}^3/\text{h}$ (~9.2 L/min) — desk work, reading, resting.
- **Light Transit / Commute:** $0.80\,\text{m}^3/\text{h}$ (~13.3 L/min) — seated in car, metro, bus.
- **Moderate Activity / Active Commute:** $1.40\,\text{m}^3/\text{h}$ (~23.3 L/min) — brisk walking, two-wheeler motorcycling.
- **Vigorous Outdoor Exercise:** $2.20\,\text{m}^3/\text{h}$ (~36.7 L/min) — jogging, cycling, outdoor sports.

### 2.2 Microenvironmental Outdoor Inhalation
$$\text{Mass}_{\text{out}} = T_{\text{out}} \times C_{\text{out}} \times (1 - \eta_{\text{mask}}) \times K_{\text{commute}} \times Q_{\text{vent}}$$

- **Respirator Real-World Penetration Factor ($1 - \eta_{\text{mask}}$):**
  - `none`: **1.00** (0% filtration).
  - `cloth_surgical`: **0.75** (Cloth/surgical masks achieve ~25% filtration of fine sub-micron aerosols due to poor fabric electrostatic capture and substantial perimeter gap leakage).
  - `n95_kn95`: **0.18** (~82% effective field protection. While certified filter media captures $\ge 95\%$ of 0.3 $\mu\text{m}$ particles under standard fit-tested conditions, real-world non-fit-tested consumer wear experiences 15–20% facial perimeter seal leakage; source: *NIOSH NPPTL Respirator User Studies, Grinshpun et al.*).
- **Commute Transit Corridor Multiplier ($K_{\text{commute}}$):**
  - `walk`: **1.10** (Ambient street-level pedestrian corridor).
  - `two_wheeler`: **1.35** (High proximity to direct vehicular exhaust plumes, diesel soot, and road dust re-entrainment).
  - `car_open`: **1.05** (Street-level vehicular canyon air).
  - `car_ac`: **0.35** (Cabin recirculation through automotive pollen/cabin particulate filter).
  - `metro_bus_transit`: **0.45** (Conditioned rapid transit stations and sealed metro coaches).

---

## 3. Physical Single-Zone Indoor Mass-Balance Model

To avoid crude rules of thumb, indoor particulate concentration is calculated using the classical steady-state single-zone mass-balance equation (*Nazaroff, 2004; EPA Indoor Air Quality Modeling Handbook*):

$$C_{\text{in}} = \frac{P \cdot \text{AER} \cdot C_{\text{out}} + \frac{S}{V}}{\text{AER} + k_{\text{dep}} + \frac{\text{CADR}}{V}}$$

Where:
- $C_{\text{out}}$: Ambient outdoor PM2.5 concentration ($\mu\text{g/m}^3$).
- $P$: Particle penetration factor through building envelope cracks (**0.80** for open windows; **0.55** for sealed doors/windows).
- $\text{AER}$: Air Exchange Rate per hour ($\text{h}^{-1}$):
  - `windows_open`: **1.80** $\text{h}^{-1}$ (Uncontrolled outdoor air ingress).
  - `timed_afternoon`: **0.70** $\text{h}^{-1}$ (Controlled 15–20 minute flushing during low-smog afternoon window).
  - `sealed_windows`: **0.35** $\text{h}^{-1}$ (Tightly weatherstripped residential room).
- $k_{\text{dep}}$: Natural particulate gravitational settling and surface deposition rate constant (**0.20** $\text{h}^{-1}$ for PM2.5 fine aerosols).
- $S$: Indoor emission generation rate ($\mu\text{g/h}$):
  - `lpg_electric`: **500** $\mu\text{g/h}$ (Clean cooking with kitchen exhaust ventilation).
  - `biomass_kerosene`: **6,000** $\mu\text{g/h}$ (Substantial soot generation).
  - `wood`: **15,000** $\mu\text{g/h}$ (Unvented solid fuel combustion).
- $V$: Room volume ($\text{m}^3$) = Floor Area ($\text{m}^2$) $\times$ Ceiling Height ($\text{m}$) (Default $15\,\text{m}^2 \times 2.8\,\text{m} = 42\,\text{m}^3$).
- $\text{CADR}$: Clean Air Delivery Rate of mechanical air cleaner ($\text{m}^3/\text{h}$):
  - With HEPA Purifier: **250** $\text{m}^3/\text{h}$ (Achieving ~5.9 Equivalent Air Changes/Hour in a 42 $\text{m}^3$ room).
  - Without Purifier: **0** $\text{m}^3/\text{h}$.

### 3.1 Future Mitigation vs. "Refund" Distinction
AirWise explicitly rejects treating air purifiers as generating a retroactive "refund" for pollution already inhaled into the respiratory tract. Once particles deposit in pulmonary alveoli, air cleaners cannot undo that biological dose. Instead, running a HEPA air purifier reduces the **future rate of indoor exposure accumulation**.

---

## 4. WHO 2021 Air Quality Guidelines & Breath Budget Mechanics

### 4.1 WHO Guideline Clarification
The World Health Organization (WHO) updated Global Air Quality Guidelines (2021) recommend:
- **PM2.5 24-hour mean guideline:** $15\,\mu\text{g/m}^3$
- **PM2.5 annual mean guideline:** $5\,\mu\text{g/m}^3$

> [!NOTE]
> The WHO $15\,\mu\text{g/m}^3$ standard is an **epidemiological population-level health risk guideline**, NOT an individual clinical threshold or personal daily quota. Long-term studies show non-linear concentration-response relationships with health effects occurring even at very low levels.

### 4.2 The 100-Point Breath Budget as a Relative Index
To make particulate exposure actionable for families without clinical misrepresentation, AirWise defines the 100-Point Breath Budget as a **relative exposure-management planning index**:
- **Baseline Reference:** A sedentary adult spending 24 hours at the WHO 24-hour guideline ($15\,\mu\text{g/m}^3 \times 0.60\,\text{m}^3/\text{h} \times 24\,\text{h} = 216\,\mu\text{g}$) represents **100 relative index points** (1 point $\approx 2.16\,\mu\text{g}$ PM2.5).
- **Practical Utility:** Enables users to visualize activity trade-offs (e.g., rescheduling a 40-minute walk from 8:00 AM smog to 1:30 PM atmospheric dispersion avoids ~45 index points).
- **Communication:** Clearly labeled in the UI as a relative lifestyle management tool, never as a medical safety boundary.

---

## 5. Dynamic Meteorological Outdoor Window Analysis

Rather than assuming afternoon hours are universally cleaner, AirWise analyzes multi-parameter hourly meteorological forecasts from Open-Meteo:

### 5.1 Meteorological Parameters Evaluated
1. **Hourly PM2.5 Forecast:** Tracking peak nocturnal thermal inversions vs. afternoon boundary-layer expansion.
2. **Wind Speed:** Surface winds $< 5\,\text{km/h}$ indicate stagnant conditions with poor dispersion; winds $> 12\,\text{km/h}$ promote convective mixing.
3. **Relative Humidity:** Humidity $> 80\%$ combined with low temperatures accelerates hygroscopic particle growth and secondary aerosol formation (winter radiation fog/smog).
4. **Solar Radiation & Thermal Dispersion:** Planetary boundary layer (PBL) height expands significantly during daylight insolation (12:00 PM – 3:30 PM), diluting ground-level particulate plumes.

### 5.2 No-Safe-Window Smog Lock Detection
When all 24 hours in a forecast exceed **300 NAQI (Very Poor / Severe)** or all candidate windows exceed **150 $\mu\text{g/m}^3$ PM2.5**, AirWise does NOT claim an afternoon window is "safe". Instead:
- Sets `isSafe: false` on the window.
- Flags `noSafeWindowAvailable: true`.
- Emits high-visibility alerts: *"Severe Smog Lockout: No Safe Outdoor Windows Today. All hours present hazardous pollutant burdens."*
- Recommends complete indoor sheltering with mechanical filtration and canceling non-essential errands.

---

## 6. Uncertainty & Data Provenance

AirWise maintains transparent distinction across data layers:
1. **Atmospheric Chemistry Models (Open-Meteo):** Seamless global coverage utilizing numerical weather prediction coupled with aerosol chemistry models (Copernicus CAMS, SILAM ensemble). Provides forecast trends and dispersion modeling.
2. **Physical Ground Stations (CPCB/DPCC):** Continuous Ambient Air Quality Monitoring Stations (CAAQMS) providing localized regulatory point measurements.
3. **Deterministic Mass Models:** Transparent mathematical physics equations linking ambient concentrations to microenvironments and respiratory volumes.
4. **Google Gemini 2.5 Flash:** Acts strictly as a structured natural-language synthesizer and behavioral coach. Governed by JSON schema validation and deterministic fallbacks, Gemini is explicitly prevented from fabricating or altering numerical metrics.
