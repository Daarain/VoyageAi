import json

import numpy as np
import pytest

from app import config as C
from app.engine import Engine
from app.models import decision as D

REQ = dict(originPortName="Gladstone, Australia", quantityMt=150000,
           candidateDischargePorts=["Dhamra", "Paradip", "Haldia", "Vizag"],
           selectedDischargePortName="Dhamra, India", laycanStart="2026-10-15",
           numberOfVoyages=2, contractDurationMonths=3)


@pytest.fixture(scope="session")
def engine():
    try:
        return Engine.load()
    except Exception:
        return Engine.train(save=True)[0]


def test_capesize_blocked_or_lightered_at_haldia():
    r = D.check_constraints("Capesize", "Gladstone", "Haldia")
    assert r["mode"] in ("lightering", "none")
    assert r["mode"] != "direct"


def test_maputo_rejects_deep_draft_classes():
    assert not D.check_constraints("Capesize", "Maputo", "Paradip")["feasible"]
    assert D.check_constraints("Supramax", "Maputo", "Paradip")["feasible"]


def test_milp_respects_min_coverage_and_ceiling():
    p50 = np.array([15, 15.5, 16, 16.5, 17, 17.5, 18, 18.5])
    p90 = p50 * 1.25
    r = D.optimise_portfolio(p50, p90, 15.4, min_period_cov=0.3)
    assert r["period_voyages"] >= int(np.ceil(0.3 * len(p50)))


def test_forecast_quantiles_ordered_and_confidence_bounded(engine):
    f = engine.fc.predict("Gladstone", "Dhamra", "Panamax")
    assert np.all(f["p10"] < f["p50"]) and np.all(f["p50"] < f["p90"])
    assert 0 <= f["confidence"] <= 100 and len(f["p50"]) == C.HORIZON_WEEKS


def test_recommendation_contract(engine):
    out = engine.recommend(REQ)
    rec = out["recommendation"]
    assert rec["recommendedVessel"]["portCompatible"] is True
    assert rec["recommendedContractType"] in ("Spot", "CVC", "Time Charter")
    assert rec["riskLevel"] in ("Low", "Medium", "High", "Critical")
    assert rec["expectedLandedCostP50"] <= rec["stressCeilingP90"]
    assert len(out["vesselOptions"]) == 4
    json.dumps(out)  # serialisable


def test_infeasible_classes_never_recommended(engine):
    out = engine.recommend({**REQ, "originPortName": "Maputo, Mozambique"})
    rec_cls = out["recommendation"]["recommendedVessel"]["vesselClass"]
    bad = {o["vesselClass"] for o in out["vesselOptions"] if not o["portCompatibility"]}
    assert rec_cls not in bad


def test_unknown_port_rejected(engine):
    with pytest.raises(Exception):
        engine.recommend({**REQ, "originPortName": "Atlantis"})


def test_model_not_worse_than_persistence_on_holdout():
    m = json.loads((C.ARTIFACTS / "metrics.json").read_text())["forecast"]["by_horizon"]
    for bucket in m.values():
        assert bucket["mape_model"] <= bucket["mape_naive_persistence"] * 1.02
        assert 0.70 <= bucket["coverage_p10_p90"] <= 0.90
