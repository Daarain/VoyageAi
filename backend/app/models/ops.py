"""REQ-4.4 port-congestion prediction and REQ-4.5 idle-time prediction."""
from __future__ import annotations

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor

from ..config import ARTIFACTS, DISCHARGE_PORTS, VESSEL_CLASSES

CONG_FEATURES = ["port_id", "woy_sin", "woy_cos", "demand", "mkt", "wait", "wait_avg4", "h"]
IDLE_FEATURES = ["cls_id", "port_id", "woy_sin", "woy_cos", "wait", "mkt", "backhaul"]


def wait_level(days: float) -> str:
    return "Low" if days < 1.5 else "Moderate" if days < 3.5 else "High"


class CongestionModel:
    """Expected vessel waiting days at a discharge port, 1-4 weeks ahead."""

    def __init__(self):
        self.model = None
        self.frame: pd.DataFrame | None = None
        self.metrics: dict = {}

    @staticmethod
    def _features(cf: pd.DataFrame) -> pd.DataFrame:
        parts = []
        for p, g in cf.groupby("port", sort=False):
            g = g.sort_values("date").reset_index(drop=True)
            g["wait_avg4"] = g["wait"].rolling(4).mean()
            g["port_id"] = DISCHARGE_PORTS.index(p)
            parts.append(g)
        return pd.concat(parts, ignore_index=True)

    def _stack(self, f, with_target):
        out = []
        for h in range(1, 5):
            x = f.copy()
            x["h"] = h
            woy = (x["date"] + pd.to_timedelta(7 * h, unit="D")).dt.isocalendar().week.values.astype(float)
            x["woy_sin"], x["woy_cos"] = np.sin(2 * np.pi * woy / 52), np.cos(2 * np.pi * woy / 52)
            if with_target:
                x["y"] = x.groupby("port")["wait"].shift(-h)
            out.append(x)
        d = pd.concat(out, ignore_index=True)
        return d.dropna(subset=CONG_FEATURES + (["y"] if with_target else []))

    def fit(self, cf: pd.DataFrame) -> dict:
        f = self._features(cf)
        d = self._stack(f, True)
        tr, te = d[d["date"] <= "2023-12-31"], d[d["date"] > "2023-12-31"]
        mk = lambda: HistGradientBoostingRegressor(max_iter=150, learning_rate=0.06, max_leaf_nodes=12,
                                                   min_samples_leaf=80, l2_regularization=2.0, random_state=3)
        m = mk().fit(tr[CONG_FEATURES], tr["y"])
        pred = m.predict(te[CONG_FEATURES])
        self.metrics = dict(mae_days_model=float(np.mean(np.abs(pred - te["y"]))),
                            mae_days_persistence=float(np.mean(np.abs(te["wait"] - te["y"]))),
                            test_rows=int(len(te)))
        self.model = mk().fit(d[CONG_FEATURES], d["y"])
        self.frame = f
        return self.metrics

    def predict(self, port: str, weeks=(1, 2, 3, 4)) -> dict:
        g = self.frame[self.frame["port"] == port].sort_values("date").tail(1)
        x = self._stack(g, False)
        pred = np.clip(self.model.predict(x[CONG_FEATURES]), 0, None)
        return dict(port=port, current_wait_days=float(g["wait"].iloc[0]),
                    weekly_wait_days=[float(v) for v in pred[: len(weeks)]],
                    level=wait_level(float(np.mean(pred[:2]))))


class IdleModel:
    """Expected ballast/idle days after discharge."""

    def __init__(self):
        self.model = None
        self.metrics: dict = {}

    @staticmethod
    def _prep(d: pd.DataFrame) -> pd.DataFrame:
        d = d.copy()
        d["cls_id"] = d["cls"].map(VESSEL_CLASSES.index)
        d["port_id"] = d["port"].map(DISCHARGE_PORTS.index)
        d["woy_sin"], d["woy_cos"] = np.sin(2 * np.pi * d["woy"] / 52), np.cos(2 * np.pi * d["woy"] / 52)
        return d

    def fit(self, samples: pd.DataFrame) -> dict:
        d = self._prep(samples)
        cut = int(len(d) * 0.8)
        tr, te = d.iloc[:cut], d.iloc[cut:]
        mk = lambda: HistGradientBoostingRegressor(max_iter=200, learning_rate=0.05, max_leaf_nodes=10,
                                                   min_samples_leaf=40, random_state=3)
        pred = mk().fit(tr[IDLE_FEATURES], tr["idle"]).predict(te[IDLE_FEATURES])
        self.metrics = dict(mae_days_model=float(np.mean(np.abs(pred - te["idle"]))),
                            mae_days_mean_baseline=float(np.mean(np.abs(tr["idle"].mean() - te["idle"]))))
        self.model = mk().fit(d[IDLE_FEATURES], d["idle"])
        return self.metrics

    def predict(self, cls: str, port: str, month_woy: float, wait: float, mkt: float, backhaul: float = 0.6) -> float:
        row = self._prep(pd.DataFrame([dict(cls=cls, port=port, woy=month_woy, wait=wait, mkt=mkt, backhaul=backhaul)]))
        return float(max(0.0, self.model.predict(row[IDLE_FEATURES])[0]))


def save(obj, name):
    joblib.dump(obj, ARTIFACTS / f"{name}.joblib")


def load(name):
    return joblib.load(ARTIFACTS / f"{name}.joblib")
