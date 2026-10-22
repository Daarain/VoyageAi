"""REQ-4.1.x Freight forecasting (hybrid, horizon-aware).

Target = log(rate[t+h] / rate[t]) for h = 1..13 weeks, one global model over all
(route, vessel class) series.

  * Central path : persistence + w(h) * Ridge mean-reversion delta. The skill weight
                   w(h) in [0,1] is learned on a VALIDATION slice, so the model can never
                   be systematically worse than a naive random-walk at any horizon.
  * Uncertainty  : gradient-boosted quantile regressors (P10 / P90) supply a
                   state-dependent band width (volatility, congestion, momentum), scaled so
                   the P10-P90 band hits ~80% coverage on validation.
Everything is evaluated on a strictly later TEST period (see metrics.json).
"""
from __future__ import annotations

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.linear_model import Ridge

from ..config import ARTIFACTS, HORIZON_WEEKS, LOW_CONFIDENCE_THRESHOLD, VESSEL_CLASSES

QUANTILES = (0.1, 0.9)
LIN = ["dev26", "tce_dev26", "ret4", "ret13", "bunker_ret4", "tce_ret4"]
FEATURES = ["lr", "ret1", "ret4", "ret13", "vol8", "dev26", "tce_ret4", "tce_dev26", "bunker_lvl", "bunker_ret4",
            "demand", "wait", "wait_avg4", "woy_sin", "woy_cos", "dist_nm", "cls_id", "h"]
VAL_START = pd.Timestamp("2022-01-01")
SPLIT_DATE = pd.Timestamp("2023-12-31")  # test = everything after this date


def build_features(panel: pd.DataFrame, market: pd.DataFrame) -> pd.DataFrame:
    m = market.set_index("date")
    frames = []
    for (o, d, c), g in panel.groupby(["origin", "dest", "cls"], sort=False):
        g = g.sort_values("date").reset_index(drop=True)
        lr = np.log(g["rate"])
        f = pd.DataFrame({"date": g["date"], "origin": o, "dest": d, "cls": c, "rate": g["rate"], "lr": lr})
        f["ret1"] = lr.diff(1)
        f["ret4"] = lr.diff(4)
        f["ret13"] = lr.diff(13)
        f["vol8"] = lr.diff().rolling(8).std()
        f["dev26"] = lr - lr.rolling(26).mean()
        tce = np.log(m.loc[g["date"], f"tce_{c}"].values)
        f["tce_ret4"] = pd.Series(tce).diff(4).values
        f["tce_dev26"] = tce - pd.Series(tce).rolling(26).mean().values
        b = np.log(m.loc[g["date"], "bunker"].values)
        f["bunker_lvl"] = b
        f["bunker_ret4"] = pd.Series(b).diff(4).values
        f["demand"] = m.loc[g["date"], "demand"].values
        w = m.loc[g["date"], f"wait_{d}"].values
        f["wait"] = w
        f["wait_avg4"] = pd.Series(w).rolling(4).mean().values
        f["dist_nm"] = g["dist_nm"].values
        f["cls_id"] = VESSEL_CLASSES.index(c)
        frames.append(f)
    return pd.concat(frames, ignore_index=True)


def _stack(feat: pd.DataFrame, horizons, with_target: bool) -> pd.DataFrame:
    parts = []
    for h in horizons:
        x = feat.copy()
        x["h"] = h
        tgt_date = x["date"] + pd.to_timedelta(7 * h, unit="D")
        woy = tgt_date.dt.isocalendar().week.values.astype(float)
        x["woy_sin"] = np.sin(2 * np.pi * woy / 52)
        x["woy_cos"] = np.cos(2 * np.pi * woy / 52)
        if with_target:
            x["y"] = x.groupby(["origin", "dest", "cls"])["lr"].shift(-h) - x["lr"]
            x["tgt_date"] = tgt_date
        parts.append(x)
    out = pd.concat(parts, ignore_index=True)
    return out.dropna(subset=FEATURES + (["y"] if with_target else []))


def _lin(d: pd.DataFrame) -> np.ndarray:
    base = d[LIN].values
    h = d["h"].values[:, None]
    return np.hstack([base * h, base * np.sqrt(h), d[["woy_sin", "woy_cos"]].values * np.minimum(h, 4) / 4.0])


def _mape(base_lr, y_true, y_pred) -> float:
    a = np.exp(base_lr + y_true)
    f = np.exp(base_lr + y_pred)
    return float(np.mean(np.abs(f - a) / a) * 100)


class Forecaster:
    def __init__(self):
        self.ridge: Ridge | None = None
        self.q: dict[float, HistGradientBoostingRegressor] = {}
        self.w = np.zeros(HORIZON_WEEKS + 1)
        self.scale = 1.0
        self.metrics: dict = {}
        self.feat: pd.DataFrame | None = None
        self.as_of: pd.Timestamp | None = None

    @staticmethod
    def _gbm(q):
        return HistGradientBoostingRegressor(loss="quantile", quantile=q, max_iter=120, learning_rate=0.06,
                                             max_leaf_nodes=12, min_samples_leaf=300, l2_regularization=5.0,
                                             random_state=3)

    def _fit_parts(self, d: pd.DataFrame):
        ridge = Ridge(alpha=300).fit(_lin(d), d["y"])
        q = {k: self._gbm(k).fit(d[FEATURES], d["y"]) for k in QUANTILES}
        return ridge, q

    @staticmethod
    def _half_width(q, d):
        return np.maximum((q[0.9].predict(d[FEATURES]) - q[0.1].predict(d[FEATURES])) / 2.0, 1e-3)

    def fit(self, panel, market, data_source: str = "synthetic") -> dict:
        feat = build_features(panel, market)
        data = _stack(feat, range(1, HORIZON_WEEKS + 1), with_target=True)
        train = data[data["tgt_date"] < VAL_START]
        val = data[(data["date"] >= VAL_START) & (data["tgt_date"] <= SPLIT_DATE)]
        test = data[data["date"] > SPLIT_DATE]

        ridge, q = self._fit_parts(train)
        # skill weight per horizon, chosen on validation
        rv = ridge.predict(_lin(val))
        for h in range(1, HORIZON_WEEKS + 1):
            mk = (val["h"] == h).values
            errs = {w: _mape(val["lr"].values[mk], val["y"].values[mk], w * rv[mk]) for w in np.arange(0, 1.01, 0.1)}
            self.w[h] = min(errs, key=errs.get)
        # interval scale on validation
        hw_v = self._half_width(q, val)
        centre_v = self.w[val["h"].values] * rv
        best, gap = 1.0, 9.0
        for s in np.arange(0.5, 4.0, 0.05):
            cov = ((val["y"].values >= centre_v - s * hw_v) & (val["y"].values <= centre_v + s * hw_v)).mean()
            if abs(cov - 0.8) < gap:
                best, gap = float(s), abs(cov - 0.8)
        self.scale = best

        # honest hold-out evaluation
        rt = ridge.predict(_lin(test))
        centre = self.w[test["h"].values] * rt
        hw = self._half_width(q, test) * self.scale
        rows = {}
        for lab, (a, b) in {"1-4w": (1, 4), "5-8w": (5, 8), "9-13w": (9, 13)}.items():
            mk = ((test["h"] >= a) & (test["h"] <= b)).values
            yv, lv = test["y"].values[mk], test["lr"].values[mk]
            rows[lab] = dict(
                mape_model=_mape(lv, yv, centre[mk]),
                mape_naive_persistence=_mape(lv, yv, np.zeros(mk.sum())),
                coverage_p10_p90=float(((yv >= centre[mk] - hw[mk]) & (yv <= centre[mk] + hw[mk])).mean()),
            )
        self.metrics = dict(data_source=data_source, train_rows=int(len(train)), val_rows=int(len(val)),
                            test_rows=int(len(test)), test_start=str((SPLIT_DATE + pd.Timedelta(days=1)).date()),
                            interval_scale=self.scale, skill_weight_by_horizon=[round(float(x), 2) for x in self.w[1:]],
                            by_horizon=rows)

        # production refit on all data (weights / scale carried over)
        self.ridge, self.q = self._fit_parts(data)
        # Keep only the last observation per route for inference (saves ~17 MB on disk).
        # Also store 12-week history as a compact dict so predict() never needs the full frame.
        self.feat = (
            feat.sort_values("date")
            .groupby(["origin", "dest", "cls"], sort=False)
            .tail(1)
            .reset_index(drop=True)
        )
        # history: {(origin, dest, cls): [(date, rate), ...]} — last 12 weeks only
        self._history: dict = {
            k: list(zip(g["date"].tail(12).tolist(), g["rate"].tail(12).tolist()))
            for k, g in feat.groupby(["origin", "dest", "cls"], sort=False)
        }
        self.as_of = feat["date"].max()
        return self.metrics

    def predict(self, origin: str, dest: str, cls: str, horizon: int = HORIZON_WEEKS) -> dict:
        # self.feat now holds exactly one row per (origin, dest, cls) — the last observation
        mask = (self.feat.origin == origin) & (self.feat.dest == dest) & (self.feat.cls == cls)
        last = self.feat[mask]
        if last.empty:
            raise KeyError(f"No series for {origin}->{dest} {cls}")
        x = _stack(last, range(1, horizon + 1), with_target=False)
        centre = self.w[x["h"].values] * self.ridge.predict(_lin(x))
        hw = self._half_width(self.q, x) * self.scale
        cur, base = float(last["rate"].iloc[0]), float(last["lr"].iloc[0])
        dates = [self.as_of + pd.Timedelta(days=7 * h) for h in range(1, horizon + 1)]
        p50, p10, p90 = np.exp(base + centre), np.exp(base + centre - hw), np.exp(base + centre + hw)
        width = float(np.mean((p90 - p10) / p50))
        conf = float(np.clip(100 * (1 - width / 1.3), 5, 98))
        history = self._history.get((origin, dest, cls), [])
        return dict(origin=origin, dest=dest, cls=cls, as_of=self.as_of, current=cur, dates=dates,
                    p10=p10, p50=p50, p90=p90, confidence=conf, low_confidence=conf < LOW_CONFIDENCE_THRESHOLD,
                    drivers=dict(ret4=float(last["ret4"].iloc[0]), bunker_ret4=float(last["bunker_ret4"].iloc[0]),
                                 tce_ret4=float(last["tce_ret4"].iloc[0]), wait=float(last["wait"].iloc[0])),
                    history=[(d, float(r)) for d, r in history])

    def save(self, path=ARTIFACTS / "forecaster.joblib"):
        joblib.dump(self, path)

    @staticmethod
    def load(path=ARTIFACTS / "forecaster.joblib") -> "Forecaster":
        return joblib.load(path)
