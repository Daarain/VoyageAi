# VoyageAI Pro — Complete Presentation & Live Demo Playbook

> **Target Audience:** Executive Stakeholders, Chartering Managers, Vessel Owners, Investors, and User Testers.  
> **Estimated Demo Duration:** 7 – 10 Minutes (or 3-Minute Rapid Pitch).  
> **Platform Version:** VoyageAI Pro v2.4 (Enterprise Maritime Intelligence).

---

## 📋 Executive Presentation Overview

| Stage | Tab / Screen | Goal & Key Message | Time |
| :--- | :--- | :--- | :--- |
| **Act I** | **Landing Page (`/`) & Command Center (`/dashboard`)** | High-level macro view: fleet tracking, portfolio value, cumulative savings, and active alerts. | 1.5 min |
| **Act II** | **New Procurement Request (`/dashboard/request`)** | Select real-world bulk scenario (e.g. 150,000 MT Coking Coal for Tata Steel / JSW). | 1.5 min |
| **Act III** | **4-Stage AI Optimization Pipeline (`/dashboard/optimizing`)** | Watch live execution: TFT Predict → PostGIS Hydrographic Constrain → MILP Optimize → Monte Carlo Simulate. | 1.5 min |
| **Act IV** | **Action Cockpit (`/dashboard/recommendation`)** | Review Gemini-synthesized strategy, Panamax allocation, direct vs lightering savings ($520k saved), and contract options. | 1.5 min |
| **Act V** | **3-Tier Cryptographic 2FA Escrow (`/dashboard/escrow`)** | 2FA Fixture Lock (`123456`), NBFC credit line activation, satellite AIS geofencing, and SHA-256 digital document milestone payout. | 1.5 min |
| **Act VI** | **Supporting Deep-Dives (Live Map, Which Vessel, Risk, Reports)** | Live AIS vessel telemetry, vessel draft matrix, FFA risk alerts, and executive PDF/CSV downloads. | 1.5 min |

---

## 🎬 Step-by-Step Click-by-Click Demo Flow

### ACT I: The Hook & Command Center Overview

#### 1. Start on the Landing Page (`/`)
* **What to click:** Open the root URL (`/`).
* **What to highlight:**
  * Point out the headline: *"Forecast Freight. Charter Smarter."*
  * Explain the problem: Volatile ocean freight rates, demurrage risks, and port draft mismatches cost commodity buyers millions in unhedged spot volatility.
* **Action:** Click **"Enter Command Center"** or **"Launch Dashboard"**.

#### 2. Arrive at Command Center (`/dashboard`)
* **What you see:**
  * **Interactive Onboarding Tour modal** (if first visit, or click *"Tour"* in TopNav).
  * **Top KPI Bar:** 
    * Total Cargo Moved (e.g., `4.8M MT`)
    * Net Optimization Savings (e.g., `$1.48M USD`, `+12.4%`)
    * Active Chartered Fleet & Voyage Status
    * Active Risk & Congestion Index
  * **Executive Portfolio Chart:** Monthly freight cost vs. AI-optimized benchmark.
  * **Active Chartering Requests Queue & Live Risk Banner.**
* **What to say:**
  > *"VoyageAI Pro acts as the single operational cockpit for charterers, combining Baltic FFA predictive modeling, spatial hydrographic constraints, and automated smart escrow."*

---

### ACT II: Creating a New Procurement Request

#### 1. Navigate to "New Request"
* **What to click:** Click **"New Request"** (labeled with `AI` badge) in the left sidebar or click **"Create Request"** button from the Command Center.
* **URL:** `/dashboard/request`

#### 2. Select a Pre-configured Scenario or Customize Inputs
* **Top Scenario Switcher (Recommended for Demo):**
  * Click on the preset badge: **"Gladstone (Australia) → Dhamra / Kalinganagar (Primary Demo Workflow)"**.
* **What inputs are populated automatically:**
  * **Commodity:** `Coking Coal` (dropdown options: Coking Coal, Thermal Coal, Iron Ore, Grain, Bauxite)
  * **Quantity (MT):** `150,000 MT`
  * **Origin Port:** `Gladstone, Australia` (Deep-water export terminal)
  * **Target Steel Plant:** `Tata Steel Kalinganagar Plant (Odisha)` (Rail corridor via Dhamra)
  * **Candidate Discharge Ports (Multi-select check pills):**
    * ☑️ **Dhamra Port** (18.0m draft — *Deep-draft direct berthing*)
    * ☑️ **Paradip Port** (18.0m draft — *4.8 days queue congestion*)
    * ☑️ **Haldia Port** (8.5m draft — *Sagar Lightering penalty +$4.50/MT*)
    * ☑️ **Vizag Port** (16.5m draft — *Alternative East Coast deep berth*)
  * **Laycan Window:** `2026-10-15` to `2026-10-30`
  * **Number of Voyages:** `2`
  * **Contract Duration:** `3 Months`
* **What to highlight:**
  * Show the **Corridor Intelligence Badge** (High-Volume Pacific Corridor vs Sparse Data fallback).
  * Point out the **Weather Resilience Notice**: *"Climatology Fallback Engine active for uncompromised reliability."*

#### 3. Trigger AI Optimization
* **What to click:** Click the prominent gradient button:  
  👉 **"Run AI Fleet & Route Optimization"**

---

### ACT III: The 4-Stage Optimization Pipeline in Real-Time

#### 1. Processing Screen (`/dashboard/optimizing`)
* **What happens automatically:**
  The system runs through a live, 4-stage sequential engineering pipeline with live terminal log streams:

  1. **Stage 1 — PREDICT (Temporal Fusion Transformer v2.4):**
     * Parses Baltic Forward Freight Agreements (FFA) forward paper curve.
     * Detects imminent **+14.0% paper freight rally** over the next 45–60 days.
  2. **Stage 2 — CONSTRAIN (PostGIS Hydrographic Draft Engine):**
     * Tests candidate ports against vessel drafts.
     * Rejects Capesize direct entry at Haldia Port due to 8.5m draft limit ($4.50/MT lightering penalty).
     * Validates **Dhamra Port (18.0m draft)** for 100% direct berthing with zero penalty.
  3. **Stage 3 — OPTIMIZE (Google OR-Tools MILP Solver):**
     * Computes optimal portfolio split: **62.5% Period Contract (5 voyages)** to hedge the FFA spike + **37.5% Spot Flexibility (3 voyages)**.
     * Allocates **2 × Panamax (75,000 MT)** vessels.
  4. **Stage 4 — SIMULATE (10,000-Path Monte Carlo Stress Engine):**
     * P50 Base Cost: **$24.80/MT**
     * P90 Stress Ceiling: **$32.40/MT**
     * Downside Risk Hedge (Value at Risk / VaR): **$1,300,000 USD**.

* **What to say during processing:**
  > *"Rather than relying on human gut feel, VoyageAI Pro solves the mathematical trade-off between physical port drafts, forward paper curves, and fleet capacity in under 5 seconds."*
* **What to click:** Once all 4 checkmarks turn green, click **"View Executive Action Cockpit"** (or it auto-transitions).

---

### ACT IV: Commercial Action Cockpit & Strategy Review

#### 1. Arrive at Action Cockpit (`/dashboard/recommendation`)
* **What to showcase:**
  * **Top Recommendation Banner:** **"LOCK 3-MONTH MULTI-VOYAGE CONTRACT"**
  * **Key Metrics Cards:**
    * **Net Estimated Savings:** `$520,000 USD` (`8.4%` under spot baseline)
    * **Recommended Vessel:** `Panamax (75,000 DWT)` (98% Fit Score)
    * **P50 Base Landed Cost:** `$24.80 / MT` (vs $28.27/MT Spot)
    * **P90 Stress Ceiling:** `$32.40 / MT`
  * **Lightering Economics Comparison Widget:**
    * Shows direct Dhamra berthing ($0 lightering) vs. Haldia offshore lightering penalty ($4.50/MT saving).
  * **Contract Comparison Bar Chart:**
    * Visual comparison: Spot ($4.24M) vs. CVC ($3.91M) vs. Recommended Period Time Charter ($3.72M).
  * **Backhaul Monetization Section:**
    * Shows post-discharge repositioning: Vessel loads export Iron Ore ex-Paradip to Qingdao/Asia to eliminate empty ballast fuel burn.

#### 2. Transition to Execution
* **What to click:** Click the highlighted CTA button:  
  👉 **"Lock Fixture & Initiate 2FA Escrow"**

---

### ACT V: Smart 2FA Escrow & Automated Settlement

#### 1. Arrive at Escrow Hub (`/dashboard/escrow`)
* **What to highlight:**
  * **Fixture ID & Contract Header:** `FIX-2026-8F7E` | `Total Value: $3,720,000 USD`
  * **Partner Working Capital Facility:** `HDFC Maritime Working Capital Facility ($4.5M pre-approved)`
  * **Two-Factor Authentication Security:**

#### 2. Execute 2FA Fixture Lock (if not already verified)
* **What to click:** Click **"Verify & Lock Fixture (2FA)"** button.
* **Modal interaction:**
  * Enter Demo PIN: `123456`
  * Click **"Confirm & Sign Fixture"**.
* **Result:** A success toast pops up; cryptographic SHA-256 hash is generated and verified!

#### 3. Demonstrate the 3-Tier Milestone Release Engine
Walk through the 3 gated operational triggers:

* **Milestone 1 — Advance Booking Payout (15% = $558,000 USD):**
  * *Trigger:* Digital fixture execution + 2FA authentication.
  * *Status:* ✅ **Completed / Released** (Shows green checkmark and timestamp).
* **Milestone 2 — Loading Payout (40% = $1,488,000 USD):**
  * *Trigger:* Vessel crosses Gladstone Satellite AIS Geofence + Cryptographic Electronic Bill of Lading (B/L) SHA-256 hash match.
  * *Interactive Action:* Click the **"Simulate AIS Geofence & Release Loading Payout"** button.
  * *Result:* Milestone 2 instantaneously switches to **"Completed"**, ledger updates, and payout is logged!
* **Milestone 3 — Final Discharge Settlement (45% = $1,674,000 USD):**
  * *Trigger:* PostGIS Spatial arrival at Dhamra outer anchorage polygon + Final Draft Survey document hash match.
  * *Interactive Action:* Click **"Verify Draft Survey & Finalize Settlement"**.
  * *Result:* 100% of escrow funds ($3,720,000) are fully released with zero payment disputes!

#### 4. Switch Tabs in Escrow View
* Click on **"Cryptographic Audit Ledger"** tab to show the immutable log of telemetry timestamps, SHA-256 document hashes, and bank authorization IDs.
* Click on **"Digital Contract Terms"** tab to view formatted charterparty clauses (Gencon / NYPE).

---

### ACT VI: Supporting Intelligence Tabs & Deep-Dives

Depending on your audience's interest, click through these high-impact modules:

#### 1. Live Map & AIS Tracking (`/dashboard/live-map`)
* **What to click:** Click **"Live Map"** in sidebar (`AIS LIVE` badge).
* **What to show:**
  * Interactive dark-mode maritime globe / canvas map.
  * Live route polyline from Gladstone, Australia → Dhamra, India.
  * Vessel icon showing *MV Kalinganagar Voyager* (`Panamax 75,000 DWT`, Speed: 13.8 kts, Dynamic Draft: 13.5m).
  * Real-time ocean anchorage weather chips (Dhamra Hs = 1.16m Green; Paradip Hs = 1.85m Amber).

#### 2. Vessel Matrix ("Which Vessel?") (`/dashboard/which-vessel`)
* **What to click:** Click **"Which Vessel?"** in sidebar.
* **What to show:**
  * Side-by-side comparison: **Panamax (Best Match, 98%)** vs. **Supramax (79%)** vs. **Capesize (Draft Violation, 62%)** vs. **Handysize (41%)**.
  * Detailed breakdown of why Capesize was rejected (exceeds 8.5m draft at Haldia) and why Panamax minimizes total landed cost per MT.

#### 3. Freight Forecast Engine (`/dashboard/forecast`)
* **What to click:** Click **"Freight Forecast"** in sidebar.
* **What to show:**
  * 6-Month forward freight curve (Historical vs. TFT Forecast with P10/P50/P90 confidence intervals).
  * Market commentary highlighting why entering a period contract now locks in sub-$25/MT rates before the Q4 spike.

#### 4. Risk & Alerts Center (`/dashboard/risk`)
* **What to click:** Click **"Risk & Alerts"** in sidebar (`2 Alert` badge).
* **What to show:**
  * Active alerts categorized by **Freight Volatility**, **Weather**, and **Port Congestion**.
  * Interactive **"Acknowledge Alert"** button for risk compliance tracking.
  * Resilience alert showing how the system seamlessly fell back to 30-day climatology averages when the live weather API timed out.

#### 5. Reports & PDF Export (`/dashboard/reports`)
* **What to click:** Click **"Reports & Export"** in sidebar.
* **What to show:**
  * Cumulative savings bar chart ($1.48M saved across recent quarters).
  * Click **"Download PDF"** → generates and downloads an executive `VoyageAI Pro Q3 Savings Summary` PDF.
  * Click **"Export CSV"** → exports clean tabular chartering data.

#### 6. Decision Audit Log (`/dashboard/audit-log`)
* **What to click:** Click **"Decision Audit Log"** in sidebar.
* **What to show:**
  * Time-stamped, searchable ledger of every AI optimization, model version (`TFT v2.4`, `OR-Tools MILP`), user sign-off, and parameter override.

---

## 🎯 Quick Reference: Presenter's Cheat Sheet

| Question from Audience | How to Answer / What to Show |
| :--- | :--- |
| **"What if the origin port has sparse historical data?"** | Go to `/dashboard/request` → Select the **Maputo (Mozambique) Scenario**. Show how the engine triggers the **Cold-Start Monte Carlo Proxy**. |
| **"What if external weather APIs go offline?"** | Show the **Weather Resilience Alert** in `/dashboard/risk` or Act II header. The system applies 30-day climatology moving averages with zero downtime. |
| **"How do you prevent demurrage at congested ports?"** | Show Act III / Act IV lightering and port intelligence where **Dhamra (0 queue)** is prioritized over **Paradip (4.8 days queue)**. |
| **"How do shipowners trust the payout mechanism?"** | Show the **3-Tier Escrow Hub** (`/dashboard/escrow`) with automated satellite AIS geofence and SHA-256 digital document verification. |

---

## 🔄 Resetting the Demo for the Next Run
To return the workflow back to its clean starting state for another presentation:
1. Navigate to `/dashboard/escrow` or `/dashboard/optimizing`.
2. Click the **"Reset Demo State"** button (or clear browser localStorage via settings).
3. The demo is instantly primed for your next audience!
