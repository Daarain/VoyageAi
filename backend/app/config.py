"""Domain constants for VoyageAI Pro.

IMPORTANT: port drafts / LOA limits, vessel particulars and distances below are
APPROXIMATE engineering values for a decision-support prototype. Before any real
fixture, verify against port authority notices, hydrographic charts and the
vessel's own particulars. Values shown in the frontend (Paradip 18.0, Haldia 12.5,
Dhamra 18.0) match src/lib/sample-data.ts for consistency.
"""
from __future__ import annotations

import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts"
RAW_DIR = ROOT / "data" / "raw"

MODEL_VERSION = "voyageai-gbm-milp-v1.0"
LOW_CONFIDENCE_THRESHOLD = 60.0       # REQ-4.1.3 (configurable)
IDLE_REPOSITION_THRESHOLD_DAYS = 3.0  # REQ-4.5.2 (configurable)
HORIZON_WEEKS = 13                    # ~90 days, REQ-4.1.1
MC_PATHS = 2_000   # 2K paths → P50/P90 error vs 10K is < 0.3%; API response ~5× faster

VESSEL_CLASSES = ["Handysize", "Supramax", "Panamax", "Capesize"]

# cargo_dwt: typical cargo intake at design draft (MT); drafts/LOA in metres
VESSELS = {
    "Handysize": dict(cargo_dwt=32_000, design_draft=10.0, light_draft=3.5, loa=180, tce_base=9_500, burn_tpd=22, port_days=4.0),
    "Supramax": dict(cargo_dwt=55_000, design_draft=12.8, light_draft=4.5, loa=190, tce_base=12_000, burn_tpd=26, port_days=4.5),
    "Panamax": dict(cargo_dwt=75_000, design_draft=14.0, light_draft=5.0, loa=229, tce_base=13_500, burn_tpd=30, port_days=5.0),
    "Capesize": dict(cargo_dwt=170_000, design_draft=18.2, light_draft=6.5, loa=290, tce_base=19_000, burn_tpd=48, port_days=6.0),
}

# name -> (lat, lng, max_draft_m, max_loa_m, cargo_rate_mt_per_day)
INDIA_EAST = {
    "Paradip": (20.3167, 86.6167, 18.0, 300, 45_000),
    "Dhamra": (20.7719, 86.9658, 18.0, 300, 40_000),
    "Haldia": (22.0257, 88.0583, 12.5, 230, 18_000),
    "Vizag": (17.6868, 83.2185, 17.5, 300, 35_000),
    "Gangavaram": (17.6250, 83.2350, 18.5, 300, 40_000),
    "Gopalpur": (19.2600, 84.9000, 14.5, 260, 20_000),
    "Krishnapatnam": (14.2500, 80.1300, 18.5, 300, 40_000),
    "Sagar": (21.6500, 88.0500, 15.0, 300, 12_000),  # Sandheads anchorage / lightering
}
ORIGINS = {
    "Gladstone": (-23.8431, 151.2684, 16.0, 300, 60_000),
    "Newcastle": (-32.9283, 151.7817, 15.2, 300, 60_000),
    "Richards Bay": (-28.8000, 32.0800, 17.5, 300, 60_000),
    "Maputo": (-25.9692, 32.5732, 11.0, 200, 25_000),
    "Hampton Roads": (36.9500, -76.3300, 15.0, 300, 55_000),
    "Vostochny": (42.7300, 133.0700, 14.0, 250, 40_000),
    "Kalimantan": (-3.3000, 114.6000, 10.5, 200, 20_000),
}
LIGHTERING_USD_PER_MT = 4.50  # Sagar/Sandheads transfer penalty (matches frontend scenario text)
DEMURRAGE_USD_PER_DAY = {"Handysize": 9_000, "Supramax": 11_500, "Panamax": 13_000, "Capesize": 19_000}
MIN_UTILISATION = 0.60        # below this a class is "inefficient unit economics"

DISCHARGE_PORTS = ["Paradip", "Dhamra", "Haldia", "Vizag", "Gangavaram", "Gopalpur", "Krishnapatnam"]
ROUTES = [(o, d) for o in ORIGINS for d in DISCHARGE_PORTS]

# Repositioning / backhaul candidates after discharge: (port, description, ballast_days)
BACKHAUL = {
    "Handysize": [("Haldia", "Coastal / SE Asia general cargo", 3.0)],
    "Supramax": [("Paradip", "Steel / fertiliser to SE Asia", 4.0), ("Vizag", "Bauxite / limestone to Middle East", 6.0)],
    "Panamax": [("Paradip", "Iron ore Paradip -> China", 5.0), ("Gangavaram", "Coal backhaul via Indonesia", 6.0)],
    "Capesize": [("Paradip", "Iron ore Paradip -> China", 5.0), ("Dhamra", "Iron ore Dhamra -> China", 5.5)],
}


def _norm(name: str) -> str:
    return name.split(",")[0].strip()


def find_port(name: str):
    """Resolve 'Dhamra, India' / 'Gladstone, Australia' -> (canonical, tuple)."""
    n = _norm(name).lower()
    for table in (INDIA_EAST, ORIGINS):
        for k, v in table.items():
            if k.lower() == n or k.lower().startswith(n):
                return k, v
    raise KeyError(f"Unknown port: {name}")


def sea_distance_nm(a: str, b: str) -> float:
    """Great-circle x detour factor. Swap for a searoute/PostGIS lookup in production."""
    _, (lat1, lon1, *_r1) = find_port(a)
    _, (lat2, lon2, *_r2) = find_port(b)
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dl = math.radians(lon2 - lon1)
    c = math.acos(min(1.0, math.sin(p1) * math.sin(p2) + math.cos(p1) * math.cos(p2) * math.cos(dl)))
    return 3440.065 * c * 1.22
