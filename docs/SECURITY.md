# AirWise: Security & Privacy Architecture

This document outlines the security controls, privacy guarantees, data flow boundaries, and defensive architecture implemented across AirWise.

---

## 1. Zero-Trust Input Validation (Zod)

Every boundary where external data enters the application enforces strict runtime type validation via Zod schemas:

1. **Client-Side Form Validation (`src/lib/validation/profileSchema.ts`):**
   - Validates household size (`numKids`, `numElderly` bounded between 0 and 20).
   - Validates commute types, fuels, ventilation strategies against strict enum sets.
   - Enforces physical constraints (outdoor hours bounded strictly between 0 and 24).
2. **Server-Side API Payload Validation (`src/app/api/plan/route.ts`):**
   - Validates request payloads on the server before invoking computational engines or external services.
   - Unrecognized parameters are stripped, and malformed inputs are rejected with `HTTP 400 Bad Request`.
3. **LLM Output Schema Validation (`src/lib/plan/planSchema.ts`):**
   - Gemini responses are strictly forced to `responseMimeType: 'application/json'`.
   - Before any LLM output is passed to the UI for rendering, it is validated against `planResponseSchema`. If validation fails, a verified deterministic rule-based fallback plan is dispatched instead.

---

## 2. Server-Side Route Rate Limiting

To prevent API abuse, denial-of-service, and quota exhaustion:
- The `/api/plan` route implements an in-memory sliding-window IP rate limiter (`src/lib/security/rateLimiter.ts`).
- Rate quota: **15 plan calculations per minute per client IP**.
- When exceeded, requests are stopped with `HTTP 429 Too Many Requests` along with a standardized `Retry-After` header.

---

## 3. Secret Isolation & Zero Client Exposure

- **Server-Only API Key:** The `GEMINI_API_KEY` is loaded exclusively inside the server-side Next.js route handler (`src/app/api/plan/route.ts`).
- **No Secrets in Client Bundles:** No `NEXT_PUBLIC_` prefixes are used for sensitive keys. The client code never possesses, caches, or transmits the LLM key.
- **Git Protection:** `.env*` files are strictly ignored in `.gitignore`, with only a clean `.env.example` committed to version control.

---

## 4. HTTP Security Headers

Configured in `next.config.ts` for all route responses:
- `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload` (enforces modern TLS).
- `X-Frame-Options`: `DENY` (prevents clickjacking attacks).
- `X-Content-Type-Options`: `nosniff` (mitigates MIME-sniffing exploits).
- `Referrer-Policy`: `strict-origin-when-cross-origin` (prevents URL referrer leakage).
- `Permissions-Policy`: `camera=(), microphone=(), geolocation=(self)` (restricts hardware capabilities).

---

## 5. Client-Side Privacy Guarantee

- **No User Database or Accounts:** AirWise does not operate a user database or store session cookies.
- **Local Storage Isolation:** Household compositions, children/elderly member numbers, and commute types are saved exclusively inside the user's browser `localStorage` (`airwise_household_profile_v1`).
- **No Personally Identifiable Health Records:** AirWise never asks for names, addresses, phone numbers, or clinical diagnoses. Calculations run purely on generic lifestyle and environmental variables.

---

## 6. Anti-Hallucination Data Flow Boundaries

To ensure absolute scientific and computational fidelity:
- **Numerical Computation Boundary:** The LLM is strictly prohibited from generating, inventing, or altering numerical exposure figures, particulate concentrations, or AQI indices.
- **Strict One-Way Information Flow:**
  $$\text{Open-Meteo Telemetry} \xrightarrow{} \text{Deterministic CPCB NAQI \& Exposure Engine} \xrightarrow{} \text{Verified Numbers Passed to Prompt} \xrightarrow{} \text{Gemini Synthesizes Text Plan} \xrightarrow{} \text{Zod Schema Validation}$$
- **Fail-Safe Deterministic Fallback:** If the Gemini API is unreachable, times out, rate-limits, or emits an unparsable schema, the application seamlessly activates `generateFallbackPlan()` to ensure uninterrupted, scientifically valid guidance without degradation.
