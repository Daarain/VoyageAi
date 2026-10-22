# VoyageAI Pro - AI Decision Engine (backend)

Implements SRS section 4 (REQ-4.1 - 4.5) behind the existing frontend's
PREDICT -> CONSTRAIN -> OPTIMIZE -> SIMULATE pipeline.

| Stage | What runs | Code |
|---|---|---|
| PREDICT | 13-week freight forecast (USD/MT) with P10/P50/P90 + confidence score; low-confidence flag | `app/models/forecast.py` |
| PREDICT | Port congestion (expected waiting days, 1-4 wks), idle-days after discharge | `app/models/ops.py` |
| CONSTRAIN | Hard draft / LOA limits per port, partial-load capacity, Sagar lightering alternative | `app/models/decision.py` |
| OPTIMIZE | Vessel-class ranking + spot-vs-period voyage mix via **MILP** (`scipy.optimize.milp`) | `app/models/decision.py` |
| SIMULATE | 10,000-path Monte Carlo -> P50 / P90 landed cost, hedge VaR | `app/models/decision.py` |
| Risk / timing | Risk level + named factors; risk-adjusted fixing window | `app/models/decision.py` |

`app/engine.py` orchestrates everything and returns camelCase JSON shaped like `src/lib/types.ts`.

## Run

```bash
cd backend
pip install -r requirements.txt
python train.py                         # trains, writes artifacts/ + metrics.json  (~1 min)
uvicorn app.api:app --port 8000         # API docs at http://localhost:8000/docs
python -m pytest tests                  # 8 tests

# frontend (repo root)
echo NEXT_PUBLIC_VOYAGE_API_URL=http://localhost:8000 > .env.local
npm run dev
```
Unset the env var and the frontend runs on its built-in demo data exactly as before.

## API
`POST /v1/recommend` (full result) - also `/v1/forecast`, `/v1/risk`, `/v1/idle-time`, `/v1/vessel-options`,
`GET /v1/ports/congestion`, `/v1/market-insights`, `/v1/metrics`, `/health`.
Body = the frontend's procurement request (`originPortName`, `quantityMt`, `candidateDischargePorts`,
`selectedDischargePortName`, `laycanStart`, `numberOfVoyages`, `contractDurationMonths`, ...).

## Data - read this before presenting results
The datasets you listed (M5, Grupo Bimbo, DataCo, USAID, Olist, Amazon Last Mile) are retail-demand /
last-mile logistics data. **None contain bulk-freight rates, vessels or port draft**, so they cannot train
this problem. The models here train on:

* **SYNTHETIC mode (default, what is shipped):** a reproducible generator (mean-reverting market factor,
  macro shock episodes, seasonality, bunker & demand, monsoon/cyclone congestion). Route freight is then
  *derived from voyage economics* `(TCE x days + fuel) / cargo`. Metrics below are therefore about the
  pipeline, **not** about real markets.
* **REAL mode:** put `data/raw/market.csv` with weekly (or finer) columns
  `date, bunker, tce_Handysize, tce_Supramax, tce_Panamax, tce_Capesize`
  (optional `demand`, `wait_<Port>` e.g. `wait_Paradip`). Re-run `python train.py`; metrics.json will say
  `real+partial-synthetic`. Good sources: Baltic Exchange BHSI/BSI/BPI/BCI (licensed), a bunker price series
  (e.g. Singapore VLSFO), IMF PortWatch port-call data for congestion. Missing optional columns are still
  synthetic - the label tells you.

## Honest evaluation (artifacts/metrics.json, hold-out = 2024-01-01 onward)
Forecast MAPE (model vs naive "no change"): 1-4w 4.77 vs 4.84 - 5-8w 7.12 vs 7.53 - 9-13w 9.15 vs 9.80;
P10-P90 coverage ~80% (target 80%). Congestion MAE 0.40 vs 0.50 days (persistence). Idle-days MAE 0.42 vs 1.40.
The forecast edge over persistence is small on purpose: an earlier plain-GBM version was *worse* than
persistence, so the final design blends a mean-reversion model by per-horizon skill weights learned on a
validation slice. Idle/congestion gains reflect the synthetic generator's structure.

## Known limitations
* Port drafts, LOA, vessel particulars, distances (great-circle x 1.22) are **approximate** - verify (`app/config.py`).
* SRS mentions deep-learning forecasting, RL entry timing and NLP risk extraction. Implemented here: quantile/linear
  forecasting, forecast-based timing, rule+model risk scoring. No news/NLP, no live AIS/FFA/weather feeds yet.
* Contract prices (CVC premium 2%, TC basis 0.98) and demurrage rates are configurable assumptions, not market quotes.
* Vessel availability is not modelled (no fleet/AIS data); every feasible class is marked "Available".
* `api.py` needs `pip install -r requirements.txt` (FastAPI/pydantic); it was syntax-checked but the HTTP layer
  could not be exercised in the authoring sandbox. The engine itself is covered by tests.
