# Shwaas (श्वास): 2-Minute Video Walkthrough Demo Script

Use this comprehensive script for your Hack2Skill Hackathon submission or video demonstration.

---

### [0:00 - 0:25] The Problem & The Solution
**Visual:** Open Shwaas at `localhost:3000`. Show the clean, atmospheric Minimal Editorial UI (Teal `#0E7490`, slate background, crisp typography, header showing "Shwaas (श्वास) — हर सांस का हिसाब").
**Narrator:**
> "Severe winter smog across urban India traps toxic fine particulate matter at ground level, creating dangerous health emergencies for millions of families. Most air quality apps merely display scary numbers without showing citizens how their daily decisions directly alter their inhaled pollution intake.
>
> Meet **Shwaas** (श्वास) — *हर सांस का हिसाब* — an AI-powered urban air quality assistant that combines free real-time Open-Meteo atmospheric telemetry, India's official CPCB NAQI standards, and a deterministic mathematical exposure engine to generate tailored daily smog defense routines with quantified exposure reductions."

---

### [0:25 - 0:45] Live CPCB NAQI & Dynamic Meteorological Windows
**Visual:** Select 'Delhi' or click 'Locate Me'. Hover over the 24-hour forecast chart. Highlight the Dynamic Time Windows card and the Severe Smog Lockout alert if AQI > 300.
**Narrator:**
> "Shwaas fetches live PM2.5 and PM10 concentrations, computing India's National AQI using exact CPCB breakpoint tables.
>
> Rather than assuming afternoon is always safe, our dynamic meteorological engine evaluates wind speed, humidity, and atmospheric boundary-layer mixing. When severe smog locks the city above 300 AQI, it triggers an explicit alert warning that no outdoor window is truly safe, advising complete indoor sheltering."

---

### [0:45 - 1:10] Breath Budget & Physical Indoor Mass-Balance Sandbox
**Visual:** Scroll to the 'Breath Budget Tracker' and the 'Physical Indoor Room Mass-Balance' model. Adjust the room size slider and toggle the HEPA purifier.
**Narrator:**
> "Here is our scientific foundation: each person tracks a relative daily **Breath Budget**, benchmarked against WHO guidelines. Shwaas transparently computes inhaled particulate mass in micrograms using EPA inhalation rates.
>
> In the **Indoor Air Modeling sandbox**, we solve the classical single-zone mass-balance equation live. You can test your room volume, infiltration rates, and purifier CADR to see steady-state indoor PM2.5 concentrations drop from 180 down to under 25 micrograms."

---

### [1:10 - 1:35] Baseline vs. Optimized Impact Dashboard & Gemini Protocol
**Visual:** Scroll to the 'MY SHWAAS IMPACT' dashboard. Point out the side-by-side comparison bars showing the avoided particulate mass. Show 'Today's Plan'.
**Narrator:**
> "In the **Shwaas Impact Dashboard**, we compare your unmitigated baseline routine against our optimized protocol — highlighting over 70% avoided particulate burden.
>
> **Gemini never invents numbers.** Our server-side route validates all metrics against Zod schemas. Gemini synthesizes personalized, empathetic defense protocols, DIY box-fan hacks, and crucial myth-checks without hallucinating statistics."

---

### [1:35 - 2:00] WhatsApp Sharing & Community Self-Defense
**Visual:** Click 'Generate WhatsApp Card' to render the visual plan preview. Then open 'Community Mode' from the header to showcase RWA, School, and Community checklists with one-click printing.
**Narrator:**
> "To protect extended families, one tap generates a **WhatsApp Share Card** with today's action plan ready for family group chats.
>
> And because clean air requires collective defense, **Community Mode** provides printable, actionable protocols for apartment RWAs to provide security guard heaters and for schools to halt morning outdoor assemblies.
>
> Shwaas: हर सांस का हिसाब. Thank you!"
