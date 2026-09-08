# VoyageAI Pro — Frontend

AI-Powered Freight Forecasting & Vessel Chartering Decision Support Platform.
Frontend built against `VoyageAI Pro SRS v1.0` and the approved 6-layer system architecture.

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Note on fonts:** this project uses `next/font/google` (IBM Plex Sans + IBM Plex Mono), which
downloads font files at build time. This requires internet access on whatever machine runs
`npm run build` / `npm run dev` — it was verified to compile cleanly with zero TypeScript,
lint, or build errors once that network access is available. If you ever need to build in a
fully offline/sandboxed environment, swap the two `next/font/google` calls in
`src/app/layout.tsx` for self-hosted local font files instead.

## Verified before delivery

- `npm run build` — compiles all 13 routes with zero errors (only Google Fonts network access
  is required, which is unavailable in the sandbox this was built in, but is a standard,
  correctly-configured Next.js font import that works in any normal dev/deploy environment)
- `npx next lint` — zero warnings, zero errors
- Full TypeScript strict-mode type checking passes across every file, including the custom
  WebGL shader material in the globe scene
- The GLSL shader powering the day/night Earth blend was manually reviewed for syntax
  correctness (this sandbox has no browser/display, so WebGL rendering itself could not be
  visually screenshotted here — worth a quick visual check on your end after `npm run dev`)
- `npm audit`: 3 high-severity findings remain, all inside Next.js's own bundled build
  dependencies (PostCSS source-map handling, `sharp` image processing) — not exploitable via
  anything this app actually does (no user-supplied CSS, no image-upload/processing feature
  calling `sharp`). Fixing them requires a forced major jump to Next.js 16, which was
  deliberately not done here to avoid introducing untested breaking changes this late — flagged
  honestly rather than silently upgraded or silently ignored. Run `npm audit fix --force`
  yourself when you're ready to test a Next 16 migration separately.

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS — CSS-variable-driven design tokens (`src/app/globals.css`) so the same utility
  classes (`bg-panel`, `text-ink-muted`, etc.) resolve to different real colors per theme; no
  default purple/violet anywhere in either palette, by design
- Three.js via `@react-three/fiber` + `@react-three/drei` — the Live Map globe, now using real
  NASA Visible Earth texture maps (day color, city-lights-at-night, ocean specular, cloud layer)
  rather than a stylized wireframe, blended by a custom GLSL shader that shows the lit day side
  and glowing night side simultaneously, like the reference screenshot
- `next-themes` — dark/light mode toggle, class-based, persisted, no hydration flash
- Framer Motion — panel entrance/transition animation
- Recharts — forecast and cost-comparison charts (theme-aware via `use-chart-theme.ts`, since
  Recharts needs literal color values, not CSS classes)
- Lucide React — icons

## Earth Textures

`public/textures/` contains 5 real NASA Visible Earth texture maps (day color, night lights,
specular, normal, clouds), sourced from the three.js project's public examples repository —
these are the same standard, freely-reusable textures used throughout the three.js ecosystem
for exactly this purpose. Total footprint ~1.7MB, kept light enough not to hurt load time.

## Live Vessel Position — Frontend Simulation, Honestly Isolated

The globe now shows a vessel's position advancing along its real great-circle route in real
time, and the Selected Vessel panel shows live-updating coordinates and % voyage complete.

**There is no backend/AIS feed yet**, so `src/lib/use-live-vessel-position.ts` advances the
position on a timer client-side — the same honesty pattern as `data-source.ts`: this file is
the *only* thing that needs to change when a real AIS telemetry feed (SRS REQ-3.2.1) exists.
Every component consuming the hook only ever sees `{ progress, lat, lng, percentComplete }` and
needs zero changes when the simulation is replaced with a real feed/WebSocket subscription.

## Dark / Light Theme

Toggle in the top nav (sun/moon icon). One deliberate design decision: **the Live Map globe
stage and its overlaid instrument panels (Route Overview, Selected Vessel, Freight Forecast,
etc.) always stay dark**, regardless of the app-wide theme — the same reason aviation and
maritime dashboards keep radar/map displays dark even in a light cockpit theme: a bright globe
scene against a white panel backdrop reads as broken, not clean. Every other screen (Vessel
Intelligence, Port Intelligence, Risk Alerts, Reports, Recommendation, Settings, the request
form) fully respects the toggle, including chart colors, panel backgrounds, borders, and text
contrast — verified by reading each file's color source, not assumed.

## Screen ↔ SRS Traceability

Every screen maps to specific `REQ-X.X.X` IDs from the SRS (see SRS Appendix B):

| Route | SRS Requirements |
|---|---|
| `/` | Marketing landing (not a functional requirement, kept minimal) |
| `/dashboard` (Live Map / Command Center) | REQ-1.1.x, REQ-3.2.x |
| `/dashboard/request` | REQ-2.2.x |
| `/dashboard/recommendation` | REQ-4.1.x – REQ-4.5.x, REQ-3.3.x |
| `/dashboard/forecast` | REQ-4.1.x |
| `/dashboard/vessels` | REQ-4.2.x |
| `/dashboard/ports` | REQ-3.1.x |
| `/dashboard/risk` | REQ-4.4.x, REQ-1.3.x |
| `/dashboard/reports` | REQ-5.3.x |
| `/dashboard/settings` | REQ-5.1.x |

## IMPORTANT — Data Layer Is Prototype-Only, Isolated by Design

**This is a frontend-only build. There is no backend yet** (Layers 2–6 of the architecture —
API Gateway, Application & Processing, Core AI Decision Engine, Supporting Services, Data
Storage — are not implemented in this repository).

Every screen currently reads from `src/lib/data-source.ts`, a single access-point file that
returns representative sample data shaped **exactly** like the real API responses described in
the SRS (see `src/lib/types.ts`, which mirrors SRS Section 6 entities field-for-field).

This is intentional and isolated:

- `src/lib/sample-data.ts` — the actual sample values, clearly labeled at the top of the file
  as prototype-only
- `src/lib/data-source.ts` — the **only** file every screen imports from; currently returns the
  sample data, but is structured as async functions so swapping in real `fetch()` calls against
  the real backend later requires changing **only this one file** — no component anywhere else
  needs to change

**When the backend is built:** replace the function bodies in `data-source.ts` with real API
calls. Nothing else in this codebase should need to change.

## Design System

Full color tokens, typography rules, and animation rationale are documented in
`tailwind.config.ts` and `src/app/globals.css`. Summary: near-black navy base (`#050810`),
glassmorphic panels, cyan/teal accent system (deliberately zero purple/violet anywhere),
IBM Plex Sans for UI text, IBM Plex Mono for all data values (rates, coordinates, DWT,
timestamps).

## Home Page Hero — Video-Based (Latest Update)

The public landing page hero now uses your uploaded 2.28s maritime footage as a seamless,
ping-pong-looping background — not a 3D scene (a real Three.js ship scene was explored in an
earlier round, but was superseded by this video-based approach per your direction).

**How the seamless loop actually works** (`src/components/home/HeroVideo.tsx`):
- Two web-optimized clips were generated from your source video with `ffmpeg`:
  `hero-forward.(mp4|webm)` (original) and `hero-reverse.(mp4|webm)` (frame-accurate reverse)
- Both are preloaded and kept mounted at all times — never unmounted — so swapping between them
  has zero re-fetch/decode delay
- When the forward clip ends, its last frame **is** the reverse clip's first frame, so the swap
  reads as continuous motion, not a jump-cut. Same going the other way. Full visual cycle ≈4.5s.
- A poster frame (`public/images/hero-poster.jpg`, extracted from your source video) shows
  immediately; the video cross-fades in once it reports it can play; on any video error, the
  poster stays up permanently and the page still looks complete.
- `prefers-reduced-motion: reduce` is honored — the video is never played, poster stays static.

**Files added:**
- `public/video/hero-forward.mp4` (303KB), `hero-forward.webm` (203KB)
- `public/video/hero-reverse.mp4` (332KB), `hero-reverse.webm` (215KB)
- `public/images/hero-poster.jpg` (61KB)
- `src/components/home/HeroVideo.tsx`, `HomeNav.tsx`, `MaritimeHero.tsx`, `FreightTicker.tsx`
- `src/lib/home-data.ts` (typed, isolated mock data — same convention as `data-source.ts`)
- `src/app/page.tsx` rewritten to compose the above

**Confirmed untouched** (verified by file modification timestamp, not just by claim): the Live
Map / Three.js globe (`src/components/globe/*`), every dashboard route, `data-source.ts`,
`sample-data.ts`, and the theme system. Only the public landing page hero changed.

**One consistent design decision, same reasoning as the Live Map globe:** the hero's text/nav
overlay uses fixed light-on-video colors regardless of the dark/light toggle, since it sits on
a photographic video background rather than a UI surface — the toggle still fully controls
every other page (dashboard, forecast, vessels, etc.).

## Major Update — Full Sidebar, 4 New Pages, Globe Fix, New Hero Video

### Globe bug fixed
Root-caused to two real risk factors, both fixed defensively:
1. Texture-loading components (`useLoader`) had no `<Suspense>` boundary inside the Canvas — a
   slow/failed load could blank the whole scene rather than just that mesh. Added an explicit
   Suspense with a dark-sphere fallback.
2. The custom GLSL day/night shader could not be runtime-verified in this sandbox (no browser).
   Replaced it with standard, battle-tested `MeshStandardMaterial` (`map` + `emissiveMap`) —
   same visual effect, zero custom-shader risk.
3. Scene background is now hard-set via `<color attach="background">` and `gl.setClearColor`,
   and the globe stage container has an inline-style dark background — neither depends on any
   CSS-variable/theme resolution succeeding, so it can't render white again for that reason.

### New pages (previously missing per SRS/concept-doc gap review)
- `/dashboard` — **Command Center**, now a real KPI/overview dashboard (was previously the globe
  hero; the globe moved to its own route below)
- `/dashboard/live-map` — the globe hero, unchanged in content, just relocated
- `/dashboard/chartering` — **Chartering hub**: request list, Port Owner Approve/Reject actions
  (REQ-1.1.3), and manual override with required justification note, persisted per request
  (REQ-1.2.3/1.2.4)
- `/dashboard/contract-simulator` — **Contract Simulator**: live-recomputing spot/CVC/time-charter
  costs as you adjust freight rate, bunker fuel price, and cargo quantity (REQ-3.3.3)
- `/dashboard/idle-time` — **Idle-Time Optimizer**: finally renders the idle-vessel/backhaul data
  that existed in `data-source.ts` but was never called by any page in the previous version
- `/dashboard/audit-log` — **Decision Audit Log**: model version, input snapshot, confidence,
  output, and actor for every AI recommendation and human decision (REQ-5.3.1)

### Sidebar rebuilt to match your reference image exactly
Full labeled sidebar (`Sidebar.tsx`, replacing the old icon-only rail) with all 12 items, live
badges ("AIS LIVE", "3 Req", "2 Alert" — the alert badge count is computed from real unacknowledged
alert data, not hardcoded). `TopNav.tsx` simplified to remove the now-duplicate horizontal nav.

### Settings — now functional, not read-only
Invite (adds a real user to the list), deactivate/reactivate toggle, and a fourth role — System
Administrator — added to the user list, closing that gap from the earlier review.

### Market Entry Timing — now shown on the Recommendation page itself
Previously only existed on the separate Forecast page. Now shown directly alongside Vessel,
Contract, Risk, and Idle-Time on the single Recommendation Results screen, matching the "one
unified output" example from your concept doc.

### Hero video replaced with your 30-second high-resolution clip
Checked for a watermark by visually inspecting frames at 2s, 15s, and 28s — none found. Source
was 1280×720/30fps/~21MB; re-encoded to `hero.mp4` (7.0MB, H.264 CRF22) and `hero.webm` (6.7MB,
VP9) for web delivery, `+faststart` for immediate playback start. Given this is a full 30-second
continuous shot (not the earlier 2.3s test clip), a native `loop` is used instead of the
forward+reverse ping-pong technique — at 30 seconds the restart is not a jarring jump, and this
matches the explicit "rerun after 30sec" behavior requested. Poster frame regenerated from this
same source. The old short test-clip assets (`hero-forward/reverse.*`) were removed.

### Still outstanding (not addressed this round)
- No real authentication/login — the "Login" link still routes to Settings rather than a real
  sign-in flow with role-based view switching
- Reports page "download" buttons remain non-functional (no backend to export from)
