"""CONSTRAIN / OPTIMIZE / SIMULATE stages + risk scoring + market-entry timing."""
from __future__ import annotations

import math

import numpy as np
import pandas as pd
from scipy.optimize import Bounds, LinearConstraint, milp

from ..config import (
    DEMURRAGE_USD_PER_DAY, INDIA_EAST, LIGHTERING_USD_PER_MT, MC_PATHS, MIN_UTILISATION, ORIGINS, VESSELS,
)

CARGO_LOAD_FACTOR = 0.96   # must match data.build.voyage_rate_usd_mt


# ── CONSTRAIN ────────────────────────────────────────────────────────────────
def _capacity(cls: str, draft_limit: float) -> float:
    v = VESSELS[cls]
    frac = (draft_limit - v["light_draft"]) / (v["design_draft"] - v["light_draft"])
    return v["cargo_dwt"] * float(np.clip(frac, 0.0, 1.0))


def check_constraints(cls: str, origin: str, dest: str) -> dict:
    """Hard port constraints (REQ-4.2.2). Returns feasibility, mode and cargo per voyage."""
    v = VESSELS[cls]
    o, d = ORIGINS[origin], INDIA_EAST[dest]
    o_draft, o_loa, d_draft, d_loa = o[2], o[3], d[2], d[3]
    sagar = INDIA_EAST["Sagar"]
    loa_blocked = v["loa"] > min(o_loa, d_loa)
    if loa_blocked and not (dest == "Haldia" and v["loa"] <= min(o_loa, sagar[3])):
        binding = origin if o_loa < d_loa else dest
        return dict(feasible=False, mode="none", cargo=0.0, lightered_mt=0.0,
                    reason=f"LOA violation: {cls} {v['loa']}m exceeds {binding} limit {min(o_loa, d_loa)}m")
    limit = min(o_draft, d_draft)
    direct = 0.0 if loa_blocked else _capacity(cls, limit)
    util = direct / v["cargo_dwt"]
    if util >= MIN_UTILISATION and not loa_blocked:
        lim_name = origin if o_draft <= d_draft else dest
        note = "Full intake" if util > 0.995 else f"Draft-limited at {lim_name} ({limit:.1f}m) to {util:.0%} of intake"
        return dict(feasible=True, mode="direct", cargo=direct, lightered_mt=0.0, reason=note)
    if dest == "Haldia":  # only Haldia has an established offshore lightering alternative (Sagar / Sandheads)
        load_limit = min(o_draft, sagar[2])
        cap = _capacity(cls, load_limit)
        if cap / v["cargo_dwt"] >= MIN_UTILISATION:
            return dict(feasible=True, mode="lightering", cargo=cap, lightered_mt=max(cap - direct, 0.0),
                        reason=(f"{'LOA' if loa_blocked else 'Draft'} violation at Haldia; lighter "
                                        f"{max(cap - direct, 0):,.0f} MT at Sagar / Sandheads"))
    return dict(feasible=False, mode="none", cargo=0.0, lightered_mt=0.0,
                reason=f"Draft violation: {dest} permits only {util:.0%} of {cls} intake (min {MIN_UTILISATION:.0%})")


# ── OPTIMIZE ─────────────────────────────────────────────────────────────────
def optimise_portfolio(spot_p50: np.ndarray, spot_p90: np.ndarray, contract_rate: float,
                       min_period_cov: float = 0.30, risk_tol: float = 0.12) -> dict:
    """MILP: choose which of N voyage slots go on a period contract (x=1) vs spot (x=0).

    min   sum_j  x_j*c_j + (1-x_j)*s_j
    s.t.  sum_j  x_j >= ceil(min_cov*N)                               (policy: minimum hedge)
          sum_j  x_j*c_j + (1-x_j)*u_j <= (1+tol) * sum_j s_j        (stress-cost ceiling on P90 spend)
    """
    n = len(spot_p50)
    c = np.full(n, contract_rate)
    obj = c - spot_p50                                             # x_j coefficient (constant sum(s) added back)
    A = [np.ones(n), c - spot_p90]
    lb = [math.ceil(min_period_cov * n), -np.inf]
    ub = [np.inf, (1 + risk_tol) * spot_p50.sum() - spot_p90.sum()]
    res = milp(obj, constraints=LinearConstraint(np.array(A), lb, ub), integrality=np.ones(n),
               bounds=Bounds(0, 1))
    if not res.success:  # infeasible ceiling -> hedge everything
        x = np.ones(n)
        status = "relaxed: full period coverage (risk ceiling infeasible with spot)"
    else:
        x = np.round(res.x)
        status = "optimal"
    total = float(np.sum(x * c + (1 - x) * spot_p50))
    return dict(x=x.astype(int), expected_cost=total, solver="scipy.optimize.milp (HiGHS)", status=status,
                period_voyages=int(x.sum()), spot_voyages=int(n - x.sum()))


# ── SIMULATE ─────────────────────────────────────────────────────────────────
def monte_carlo(x: np.ndarray, p10: np.ndarray, p50: np.ndarray, p90: np.ndarray, contract_rate: float,
                cargo: float, cls: str, wait_days: float, seed: int = 42, rho: float = 0.7) -> dict:
    """Correlated lognormal spot paths + demurrage noise -> landed freight cost per MT distribution."""
    rng = np.random.default_rng(seed)
    n = len(p50)
    sigma = np.maximum(np.log(np.maximum(p90, 1e-6) / np.maximum(p10, 1e-6)) / (2 * 1.2816), 0.01)
    common = rng.standard_normal((MC_PATHS, 1))
    idio = rng.standard_normal((MC_PATHS, n))
    z = np.sqrt(rho) * common + np.sqrt(1 - rho) * idio
    spot = p50 * np.exp(sigma * z - 0.5 * sigma ** 2)
    wait = rng.lognormal(np.log(max(wait_days, 0.2)) - 0.18, 0.6, (MC_PATHS, n))
    dem = wait * DEMURRAGE_USD_PER_DAY[cls] * 0.5 / cargo            # half of waiting time is demurrage-exposed
    per_mt = np.where(x == 1, contract_rate, spot) + dem
    all_spot = spot + dem
    landed, base = per_mt.mean(axis=1), all_spot.mean(axis=1)
    return dict(paths=MC_PATHS, p50=float(np.percentile(landed, 50)), p90=float(np.percentile(landed, 90)),
                mean=float(landed.mean()), mean_all_spot=float(base.mean()),
                p90_all_spot=float(np.percentile(base, 90)))


# ── RISK (REQ-4.4) ───────────────────────────────────────────────────────────
def score_risk(*, confidence: float, trend_pct: float, dest_wait_level: str, week_of_year: int, bunker_ret4: float,
               band_ratio: float, dest: str, draft_margin_m: float) -> dict:
    score, factors, alerts = 0, [], []

    def add(pts, text, cat, level):
        nonlocal score
        score += pts
        factors.append(text)
        alerts.append((cat, level, text))

    if confidence < 60:
        add(2, f"Low forecast confidence ({confidence:.0f}%) - manual review required", "Freight Volatility", "High")
    if band_ratio > 0.35:
        add(1, f"Wide freight uncertainty band (P10-P90 spans {band_ratio:.0%} of median)", "Freight Volatility", "Medium")
    if trend_pct > 8:
        add(1, f"Freight forecast to rise {trend_pct:.1f}% over the window - lock cover early", "Freight Volatility", "Medium")
    if dest_wait_level == "High":
        add(2, f"{dest} congestion forecast High (extended anchorage queue)", "Port Congestion", "High")
    elif dest_wait_level == "Moderate":
        add(1, f"{dest} congestion forecast Moderate", "Port Congestion", "Medium")
    if 41 <= week_of_year <= 48:
        add(1, "Bay of Bengal cyclone season (Oct-Nov): weather delay risk", "Weather", "Medium")
    elif 23 <= week_of_year <= 39:
        add(1, "SW monsoon swell on Bay of Bengal routes", "Weather", "Medium")
    if bunker_ret4 > 0.06:
        add(1, f"Bunker prices up {bunker_ret4:.0%} in 4 weeks", "Operational", "Medium")
    if draft_margin_m < 0.5:
        add(1, f"Thin draft margin at {dest} ({draft_margin_m:.1f}m) - tidal/siltation exposure", "Operational", "Medium")
    level = "Low" if score <= 1 else "Medium" if score <= 3 else "High" if score <= 5 else "Critical"
    return dict(level=level, score=score, factors=factors, alerts=alerts)


# ── MARKET ENTRY TIMING (REQ-4.3) ────────────────────────────────────────────
def entry_window(dates, p50, p90, max_week: int, lam: float = 0.35) -> dict:
    """Pick the fixing week minimising risk-adjusted cost: p50 + lam * (p90 - p50)."""
    k = int(np.clip(max_week, 1, len(p50)))
    adj = p50[:k] + lam * (p90[:k] - p50[:k])
    best = int(np.argmin(adj))
    start = dates[best]
    return dict(best_week=best + 1, start=start, end=start + pd.Timedelta(days=9),
                expected_vs_now_pct=float((p50[best] / p50[0] - 1) * 100))
