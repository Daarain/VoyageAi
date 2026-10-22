"""Market data layer.

Two modes, chosen automatically:
  * REAL   - if backend/data/raw/market.csv exists (see README for the schema) the
             class TCE indices and bunker price come from it.
  * SYNTHETIC - otherwise a reproducible, economically-structured generator is used
             so the whole pipeline trains and runs end to end.

Either way, route-level freight (USD/MT) is DERIVED from voyage economics
(TCE x days + fuel) / cargo, which is how a voyage rate is actually built, so the
models learn from the same structure with real or synthetic inputs.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from ..config import (
    DISCHARGE_PORTS, INDIA_EAST, RAW_DIR, ROUTES, VESSEL_CLASSES, VESSELS, find_port, sea_distance_nm,
)

START, END = "2015-01-05", "2026-09-28"
SPEED_KTS = 13.0


def _ar1(n: int, phi: float, sigma: float, rng: np.random.Generator) -> np.ndarray:
    x = np.zeros(n)
    e = rng.normal(0, sigma, n)
    for i in range(1, n):
        x[i] = phi * x[i - 1] + e[i]
    return x


def _event_shocks(dates: pd.DatetimeIndex) -> np.ndarray:
    """Deterministic macro episodes (log-scale) with exponential decay."""
    events = [("2016-02-01", -0.45, 26), ("2017-01-01", 0.30, 30), ("2020-04-01", -0.25, 12),
              ("2021-03-01", 0.60, 40), ("2022-03-01", -0.20, 20), ("2023-06-01", -0.15, 18),
              ("2024-12-01", 0.18, 16), ("2026-01-01", 0.12, 20)]
    out = np.zeros(len(dates))
    for d, mag, half in events:
        t = (dates - pd.Timestamp(d)).days.values / 7.0
        out += np.where(t >= 0, mag * np.exp(-np.log(2) * t / half), 0.0)
    return out


def synthetic_market(seed: int = 7) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    dates = pd.date_range(START, END, freq="W-MON")
    n = len(dates)
    woy = dates.isocalendar().week.values.astype(float)
    seas = 2 * np.pi * woy / 52.0

    macro = _ar1(n, 0.975, 0.045, rng) + _event_shocks(dates)
    bunker = 520 * np.exp(0.35 * macro + _ar1(n, 0.98, 0.03, rng) + 0.05 * np.sin(seas))
    demand = 1.0 + 0.18 * np.sin(seas + 0.6) + 0.10 * _ar1(n, 0.9, 0.06, rng) + 0.05 * np.tanh(macro)

    df = pd.DataFrame({"date": dates, "bunker": bunker, "demand": demand})
    beta = {"Handysize": 0.55, "Supramax": 0.75, "Panamax": 0.95, "Capesize": 1.35}
    seas_amp = {"Handysize": 0.03, "Supramax": 0.05, "Panamax": 0.07, "Capesize": 0.10}
    for c in VESSEL_CLASSES:
        idio = _ar1(n, 0.93, 0.03, rng)
        df[f"tce_{c}"] = VESSELS[c]["tce_base"] * np.exp(beta[c] * macro + idio + seas_amp[c] * np.sin(seas + 1.2))

    # port congestion: baseline + monsoon (Jun-Sep) + cyclone (Oct-Nov) + demand pressure
    for p in DISCHARGE_PORTS:
        base = {"Paradip": 1.6, "Dhamra": 0.9, "Haldia": 2.4, "Vizag": 1.2, "Gangavaram": 1.0,
                "Gopalpur": 0.8, "Krishnapatnam": 1.1}[p]
        monsoon = np.where((woy >= 23) & (woy <= 39), 0.9, 0.0)
        cyclone = np.where((woy >= 41) & (woy <= 48), 1.3, 0.0)
        press = 2.5 * np.clip(demand - 1.0, 0, None) + 0.6 * np.clip(macro, 0, None)
        w = base + monsoon + cyclone + press + _ar1(n, 0.8, 0.35, rng)
        df[f"wait_{p}"] = np.clip(w, 0.0, None)
    return df


def load_market() -> tuple[pd.DataFrame, str]:
    """Return (weekly market frame, source label)."""
    f = RAW_DIR / "market.csv"
    if f.exists():
        real = pd.read_csv(f, parse_dates=["date"]).sort_values("date")

        # Normalise column names: strip whitespace, fix common casing issues
        real.columns = [c.strip() for c in real.columns]

        need = ["date", "bunker"] + [f"tce_{c}" for c in VESSEL_CLASSES]
        missing = [c for c in need if c not in real.columns]
        if missing:
            raise ValueError(
                f"data/raw/market.csv is missing required columns: {missing}\n"
                "Run  python fetch_market_data.py  to rebuild it.\n"
                "See  DATA_SOURCES.md  for manual download instructions."
            )

        # Resample to weekly Monday, interpolate short gaps (up to 2 weeks)
        real = (real.set_index("date")
                     .resample("W-MON").mean()
                     .interpolate("linear", limit=14)
                     .ffill().bfill()
                     .reset_index())

        # Fill any missing optional columns (wait_*, demand) from synthetic
        syn = synthetic_market()
        for col in [c for c in syn.columns if c not in real.columns and c != "date"]:
            real[col] = np.interp(
                real["date"].astype("int64"),
                syn["date"].astype("int64"),
                syn[col],
            )

        # Count how many wait_* columns came from real data
        real_wait = sum(1 for c in real.columns if c.startswith("wait_")
                        and c in pd.read_csv(f, nrows=0).columns)
        source = "real" if real_wait >= 4 else "real+partial-synthetic"
        return real, source

    return synthetic_market(), "synthetic"


def voyage_rate_usd_mt(origin: str, dest: str, cls: str, tce: float, bunker: float, wait_days: float = 0.0) -> float:
    """Voyage-charter freight (USD/MT) implied by TCE, fuel, distance and port time."""
    v = VESSELS[cls]
    nm = sea_distance_nm(origin, dest)
    sea_days = nm / (SPEED_KTS * 24.0)
    _, o = find_port(origin)
    _, d = find_port(dest)
    cargo = v["cargo_dwt"] * 0.96
    port_days = v["port_days"] + cargo / o[4] + cargo / d[4] + wait_days
    days = 2 * sea_days + port_days              # laden + ballast return
    fuel = v["burn_tpd"] * bunker * (sea_days + 0.9 * sea_days)
    return (tce * days + fuel) / cargo


def build_rate_panel(market: pd.DataFrame, seed: int = 11) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    rows = []
    for (o, d) in ROUTES:
        for c in VESSEL_CLASSES:
            wait = market.get(f"wait_{d}", pd.Series(1.0, index=market.index)).values
            rate = np.array([voyage_rate_usd_mt(o, d, c, t, b, w)
                             for t, b, w in zip(market[f"tce_{c}"].values, market["bunker"].values, wait)])
            rate = rate * np.exp(rng.normal(0, 0.012, len(rate)))  # route-level basis noise
            rows.append(pd.DataFrame({"date": market["date"], "origin": o, "dest": d, "cls": c,
                                      "rate": rate, "dist_nm": sea_distance_nm(o, d)}))
    return pd.concat(rows, ignore_index=True)


def congestion_frame(market: pd.DataFrame) -> pd.DataFrame:
    out = []
    for p in DISCHARGE_PORTS:
        out.append(pd.DataFrame({"date": market["date"], "port": p, "wait": market[f"wait_{p}"].values,
                                 "demand": market["demand"].values,
                                 "mkt": np.log(market["tce_Panamax"].values / VESSELS["Panamax"]["tce_base"])}))
    return pd.concat(out, ignore_index=True)


def idle_samples(market: pd.DataFrame, n: int = 6000, seed: int = 21) -> pd.DataFrame:
    """Post-discharge idle days. Generative story: idle grows with congestion at discharge,
    weak market, bad backhaul availability and monsoon; shrinks with a strong market."""
    rng = np.random.default_rng(seed)
    idx = rng.integers(0, len(market), n)
    cls = rng.choice(VESSEL_CLASSES, n)
    port = rng.choice(DISCHARGE_PORTS, n)
    m = market.iloc[idx].reset_index(drop=True)
    woy = m["date"].dt.isocalendar().week.values.astype(float)
    wait = np.array([m.loc[i, f"wait_{port[i]}"] for i in range(n)])
    mkt = np.log(np.array([m.loc[i, f"tce_{cls[i]}"] for i in range(n)]) /
                 np.array([VESSELS[c]["tce_base"] for c in cls]))
    backhaul = np.clip(rng.beta(3, 2, n) + 0.15 * np.sin(2 * np.pi * woy / 52), 0, 1)
    size = np.array([{"Handysize": 0, "Supramax": 1, "Panamax": 2, "Capesize": 3}[c] for c in cls])
    idle = (1.2 + 0.35 * size + 0.8 * wait - 2.2 * mkt + 4.0 * (1 - backhaul)
            + np.where((woy >= 23) & (woy <= 39), 0.8, 0.0) + rng.normal(0, 0.5, n))
    return pd.DataFrame({"cls": cls, "port": port, "woy": woy, "wait": wait, "mkt": mkt,
                         "backhaul": backhaul, "idle": np.clip(idle, 0, None)})
