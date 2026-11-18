# AirWise: Scientific Assumptions & Methodology Reference

This document outlines all scientific foundations, breakpoint standards, empirical factors, and mathematical formulations used by the AirWise deterministic exposure engine and AQI calculation module.

> [!IMPORTANT]
> **Decision Support Notice:** AirWise calculates exposure doses and reductions based on peer-reviewed microenvironmental models to empower community resilience against winter smog. Outputs are scientific estimates for lifestyle optimization, not diagnostic or individual clinical medical advice.

---

## 1. National Air Quality Index (NAQI) - India Standard

AirWise implements the **Central Pollution Control Board (CPCB)** methodology formulated by the Ministry of Environment, Forest and Climate Change (MoEFCC), Government of India (CPCB 2014 Final Report on *National Air Quality Index*).

### Sub-Index Equation
For each particulate pollutant (PM2.5, PM10), the sub-index $I_p$ is calculated using piecewise linear interpolation:

$$I_p = I_{\text{low}} + \frac{I_{\text{high}} - I_{\text{low}}}{C_{\text{high}} - C_{\text{low}}} \times (C_p - C_{\text{low}})$$

Where:
- $C_p$: Current pollutant concentration ($\mu\text{g/m}^3$)
- $[C_{\text{low}}, C_{\text{high}}]$: Breakpoint concentration range containing $C_p$
- $[I_{\text{low}}, I_{\text{high}}]$: Corresponding AQI sub-index category range

The composite NAQI is determined by the dominant pollutant:
$$\text{NAQI} = \min\left(500, \max(I_{\text{PM2.5}}, I_{\text{PM10}})\right)$$

### CPCB Breakpoint Tables

| Category | AQI Range | PM2.5 Range ($\mu\text{g/m}^3$) | PM10 Range ($\mu\text{g/m}^3$) | Public Health Impact Statement |
|---|---|---|---|---|
| **Good** | 0 – 50 | 0 – 30 | 0 – 50 | Minimal impact |
| **Satisfactory** | 51 – 100 | 31 – 60 | 51 – 100 | Minor breathing discomfort to sensitive people |
| **Moderate** | 101 – 200 | 61 – 90 | 101 – 250 | Breathing discomfort to people with lung/heart diseases and children |
| **Poor** | 201 – 300 | 91 – 120 | 251 – 350 | Breathing discomfort to most people on prolonged exposure |
| **Very Poor** | 301 – 400 | 121 – 250 | 351 – 430 | Respiratory illness on prolonged exposure |
| **Severe** | 401 – 500 | 251 – 380+ | 431 – 510+ | Affects healthy people and seriously impacts vulnerable groups |

*Concentrations above the severe breakpoint upper threshold are capped strictly at 500.*

---

## 2. Inhaled Particulate Exposure Model

The AirWise deterministic exposure engine (`src/lib/exposure/engine.ts`) implements a microenvironmental time-activity mass-exposure model. It quantifies the daily inhaled PM2.5 mass dose in $\mu\text{g}\cdot\text{h/m}^3$:

$$\text{Dose}_{\text{daily}} = \text{Dose}_{\text{outdoor}} + \text{Dose}_{\text{indoor}}$$

### 2.1 Outdoor Dose Formulation
$$\text{Dose}_{\text{outdoor}} = T_{\text{out}} \times C_{\text{out}} \times M_{\text{mask}} \times K_{\text{commute}}$$

- $T_{\text{out}}$: Daily hours spent outdoors.
- $C_{\text{out}}$: Ambient outdoor PM2.5 concentration ($\mu\text{g/m}^3$).
- $M_{\text{mask}}$: **Respirator Penetration Factor** (fraction of ambient particulate passing through the mask and facial seal):
  - `none`: **1.00** (0% filtration efficiency)
  - `cloth_surgical`: **0.70** (Only ~30% effective particulate removal due to loose edge seal and low fine-particle media capture; source: *CDC / NIOSH Mask Performance Studies*)
  - `n95_kn95`: **0.08** (~92% real-world protection accounting for typical facial fit; source: *OSHA / NIOSH NPPTL fit factor standards*)
- $K_{\text{commute}}$: **Transit Corridor & Inhalation Rate Multiplier**:
  - `walk`: **1.35** (Elevated physical breathing rate ~22–28 L/min vs 8 L/min at rest; source: *EPA Exposure Factors Handbook*)
  - `bicycle`: **1.50** (Aerobic minute ventilation ~35–45 L/min)
  - `two_wheeler`: **1.40** (Proximity to preceding exhaust tailpipes, turbulent roadway dispersion)
  - `car_open`: **1.10** (Roadway canyon air ingestion)
  - `car_ac`: **0.40** (Cabin HEPA/particulate recirculation filter drops ~60% of roadway fine dust)
  - `metro_bus_transit`: **0.50** (Mechanically conditioned underground/sheltered rapid transit)

### 2.2 Indoor Dose Formulation
$$\text{Dose}_{\text{indoor}} = T_{\text{in}} \times C_{\text{in}}$$
$$C_{\text{in}} = (C_{\text{out}} \times F_{\text{infiltration}} \times F_{\text{purifier}}) + C_{\text{cooking}}$$

- $T_{\text{in}} = 24 - T_{\text{out}}$: Indoor hours.
- $F_{\text{infiltration}}$: **Building Envelope Infiltration Ratio**:
  - `windows_open`: **0.85** (Free natural air exchange, outdoor smog penetrates indoors)
  - `sealed_windows`: **0.55** (Closed modern urban residential envelope, cracks & weatherstripping)
  - `timed_afternoon`: **0.65** (Sealed during nighttime/morning thermal inversions; brief 30-min flush during solar afternoon dispersion window)
- $F_{\text{purifier}}$: **Air Cleaner Clearance Factor**:
  - True (True HEPA or DIY Corsi-Rosenthal / Box-fan + MERV 13): **0.25** (~75% reduction in steady-state room particulate concentration; source: *ASHRAE 52.2 / EPA Indoor AirPlus guidelines*)
  - False: **1.00** (No active mechanical particle capture)
- $C_{\text{cooking}}$: **Indoor Combustion Emission Increment**:
  - `lpg_electric`: **5 $\mu\text{g/m}^3$** (Clean fuel with kitchen chimney exhaust)
  - `biomass_kerosene`: **45 $\mu\text{g/m}^3$** (High indoor residual unburned particulate)
  - `wood`: **70 $\mu\text{g/m}^3$** (Severe biomass combustion plume)

---

## 3. Deterministic Integrity & GenAI Boundary

1. **No Hallucinated Metrics:** Every numerical exposure value, dose percentage, sub-index, and what-if calculation is calculated exclusively by `src/lib/exposure/engine.ts` and `src/lib/aqi/naqi.ts`.
2. **LLM Function:** The Google Gemini 2.5/Flash model acts solely as an empathetic, context-aware communicator. It receives the verified deterministic metrics and synthesizes personalized community routines, behavioral framing, and clear impact explanations without generating arbitrary numbers.
