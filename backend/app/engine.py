"""Orchestrator: PREDICT -> CONSTRAIN -> OPTIMIZE -> SIMULATE -> RECOMMEND.

Output is camelCase and shaped like src/lib/types.ts so the frontend needs no reshaping.
"""
from __future__ import annotations

import math
from datetime import datetime, timezone

import numpy as np
import pandas as pd

from . import config as C
from .data.build import build_rate_panel, congestion_frame, idle_samples, load_market
from .models import decision as D
from .models.forecast import Forecaster
from .models.ops import CongestionModel, IdleModel, load as load_art, save as save_art, wait_level

TYPICAL = {  # (DWT range, draft range) - descriptive only
    "Handysize": ("25,000-40,000 DWT", "9.0-10.5 m"), "Supramax": ("50,000-65,000 DWT", "11.5-13.5 m"),
    "Panamax": ("65,000-82,000 DWT", "13.0-14.5 m"), "Capesize": ("150,000-210,000 DWT", "17.0-18.5 m"),
}
CONTRACT_PREMIUM = 0.02       # period rate vs forward spot at fixing
TC_BASIS = 0.98               # period hire assumed 2% below voyage-equivalent (charterer takes bunker/idle risk)


def _iso(ts) -> str:
    return pd.Timestamp(ts).strftime("%Y-%m-%d")


class Engine:
    def __init__(self, forecaster: Forecaster, cong: CongestionModel, idle: IdleModel, market: pd.DataFrame):
        self.fc, self.cong, self.idle, self.market = forecaster, cong, idle, market
        self.as_of = forecaster.as_of

    # ── lifecycle ───────────────────────────────────────────────────────────
    @classmethod
    def train(cls, save: bool = True) -> tuple["Engine", dict]:
        market, source = load_market()
        panel = build_rate_panel(market)
        fc, cong, idle = Forecaster(), CongestionModel(), IdleModel()
        metrics = dict(forecast=fc.fit(panel, market, source), congestion=cong.fit(congestion_frame(market)),
                       idle=idle.fit(idle_samples(market)), data_source=source, model_version=C.MODEL_VERSION,
                       trained_at=datetime.now(timezone.utc).isoformat())
        if save:
            C.ARTIFACTS.mkdir(exist_ok=True)
            fc.save()
            save_art(cong, "congestion")
            save_art(idle, "idle")
        return cls(fc, cong, idle, market), metrics

    @classmethod
    def load(cls) -> "Engine":
        market, _ = load_market()
        return cls(Forecaster.load(), load_art("congestion"), load_art("idle"), market)

    # ── helpers ─────────────────────────────────────────────────────────────
    def _mkt_now(self, cls_name: str) -> float:
        row = self.market.iloc[-1]
        return float(np.log(row[f"tce_{cls_name}"] / C.VESSELS[cls_name]["tce_base"]))

    def _series(self, origin, dest, cls_name, h=C.HORIZON_WEEKS):
        return self.fc.predict(origin, dest, cls_name, h)

    def _evaluate(self, origin: str, dest: str, cls_name: str, qty: float, n_req: int, weeks_to_laycan: int,
                  gap_weeks: int) -> dict:
        v = C.VESSELS[cls_name]
        con = D.check_constraints(cls_name, origin, dest)
        out = dict(cls=cls_name, dest=dest, constraint=con, feasible=con["feasible"])
        if not con["feasible"]:
            return out
        cap = con["cargo"] * D.CARGO_LOAD_FACTOR
        n = max(n_req, math.ceil(qty / cap))
        cargo_v = min(cap, qty / n)
        fcst = self._series(origin, dest, cls_name)
        wk = np.clip(weeks_to_laycan + gap_weeks * np.arange(n), 1, C.HORIZON_WEEKS) - 1
        full_cargo = v["cargo_dwt"] * D.CARGO_LOAD_FACTOR
        mult = full_cargo / cargo_v                                  # fixed voyage cost spread over less cargo
        lighter_pm = C.LIGHTERING_USD_PER_MT * (con["lightered_mt"] / con["cargo"]) if con["cargo"] else 0.0
        wait_now = self.cong.predict(dest)
        wait_days = float(np.mean(wait_now["weekly_wait_days"][:2]))
        dem_pm = wait_days * C.DEMURRAGE_USD_PER_DAY[cls_name] * 0.5 / cargo_v
        idle_days = self.idle.predict(cls_name, dest, float(pd.Timestamp(self.as_of).isocalendar().week) + weeks_to_laycan,
                                      wait_days, self._mkt_now(cls_name))
        out.update(n=n, cargo_v=cargo_v, wk=wk, mult=mult, lighter_pm=lighter_pm, dem_pm=dem_pm, fcst=fcst,
                   wait=wait_now, wait_days=wait_days, idle_days=idle_days, util=con["cargo"] / v["cargo_dwt"],
                   cost_pm=float(np.mean(fcst["p50"][wk]) * mult + lighter_pm + dem_pm),
                   full_rate=float(np.mean(fcst["p50"][wk])))
        return out

    # ── main entry ──────────────────────────────────────────────────────────
    def recommend(self, req: dict) -> dict:
        origin, _ = C.find_port(req["originPortName"])
        qty = float(req["quantityMt"])
        cands = []
        for name in dict.fromkeys([req.get("selectedDischargePortName", "")] + list(req.get("candidateDischargePorts", []))):
            try:
                p, _ = C.find_port(name)
                if p in C.DISCHARGE_PORTS:
                    cands.append(p)
            except KeyError:
                continue
        cands = list(dict.fromkeys(cands))
        if not cands:
            raise ValueError("No recognised discharge ports in request")

        laycan = pd.Timestamp(req["laycanStart"])
        w2l = int(np.clip(round((laycan - self.as_of).days / 7), 1, C.HORIZON_WEEKS))
        months = req.get("contractDurationMonths")
        n_req = int(req.get("numberOfVoyages") or 1)
        gap = max(1, round((months * 4.345) / max(n_req, 1))) if months else 2
        gap = min(gap, 4)

        # PREDICT + CONSTRAIN across every (port, class)
        grid = {(d, c): self._evaluate(origin, d, c, qty, n_req, w2l, gap) for d in cands for c in C.VESSEL_CLASSES}
        feas = [g for g in grid.values() if g["feasible"]]
        if not feas:
            raise ValueError("No feasible vessel class for this cargo/port combination")

        def fit(g):
            best = min(x["cost_pm"] for x in feas)
            fill = min(1.0, qty / (g["n"] * g["constraint"]["cargo"] * D.CARGO_LOAD_FACTOR))
            return 0.55 * (best / g["cost_pm"]) + 0.25 * fill + 0.20 * (1 - min(g["idle_days"], 10) / 10)

        for g in feas:
            g["fit"] = fit(g)
        top = max(feas, key=lambda g: g["fit"])
        try:
            selected = C.find_port(req.get("selectedDischargePortName", ""))[0]
        except KeyError:
            selected = None
        sel_best = max((g for g in feas if g["dest"] == selected), key=lambda g: g["fit"], default=None)
        if sel_best is not None and sel_best["fit"] >= 0.97 * top["fit"]:
            top = sel_best   # keep the user's chosen port unless another is materially (>3%) better
        dest, cls_name = top["dest"], top["cls"]

        # OPTIMIZE
        fc, n, wk, cargo_v = top["fcst"], top["n"], top["wk"], top["cargo_v"]
        adj = top["mult"]
        spot50, spot90, spot10 = fc["p50"][wk] * adj, fc["p90"][wk] * adj, fc["p10"][wk] * adj
        timing = D.entry_window(fc["dates"], fc["p50"], fc["p90"], w2l)
        contract_rate = float(fc["p50"][timing["best_week"] - 1] * adj * (1 + CONTRACT_PREMIUM))
        port = D.optimise_portfolio(spot50, spot90, contract_rate)
        x = port["x"]
        extra_pm = top["lighter_pm"] + top["dem_pm"]

        # SIMULATE
        mc = D.monte_carlo(x, spot10, spot50, spot90, contract_rate, cargo_v, cls_name, top["wait_days"])
        p50_pm, p90_pm = mc["p50"] + top["lighter_pm"], mc["p90"] + top["lighter_pm"]
        base_pm = mc["mean_all_spot"] + top["lighter_pm"]
        sav_pm = max(base_pm - (mc["mean"] + top["lighter_pm"]), 0.0)
        sav_usd, sav_pct = sav_pm * qty, (sav_pm / base_pm * 100 if base_pm else 0.0)

        # contract comparison (expected totals for the whole programme)
        near = float(fc["p50"][0] * adj)
        tce_now = float(self.market.iloc[-1][f"tce_{cls_name}"])
        spot_total = float((spot50.sum() + n * extra_pm) * cargo_v)
        cvc_total = float((n * near * (1 + CONTRACT_PREMIUM) + n * extra_pm) * cargo_v)
        tc_total = float((n * near * TC_BASIS + n * extra_pm) * cargo_v + n * top["idle_days"] * tce_now)
        comp = [dict(type="Spot", totalCostUsd=round(spot_total), ratePerMt=round(spot_total / (n * cargo_v), 2)),
                dict(type="CVC", totalCostUsd=round(cvc_total), ratePerMt=round(cvc_total / (n * cargo_v), 2)),
                dict(type="Time Charter", totalCostUsd=round(tc_total), ratePerMt=round(tc_total / (n * cargo_v), 2))]
        lam = 0.35   # risk aversion: weight on stress (P90) cost above expected
        stress = {"Spot": float((spot90.sum() + n * extra_pm) * cargo_v), "CVC": cvc_total,
                  "Time Charter": tc_total * 1.01}
        for c_ in comp:
            c_["stressCostUsd"] = round(stress[c_["type"]])
        rec_type = min(comp, key=lambda c: c["totalCostUsd"] + lam * (stress[c["type"]] - c["totalCostUsd"]))["type"]

        # RISK
        trend = float((fc["p50"][wk[-1]] / fc["current"] - 1) * 100)
        band = float(np.mean((fc["p90"] - fc["p10"]) / fc["p50"]))
        woy = int(pd.Timestamp(fc["dates"][w2l - 1]).isocalendar().week)
        d_draft = C.INDIA_EAST[dest][2]
        loaded = min(C.VESSELS[cls_name]["design_draft"], C.ORIGINS[origin][2], d_draft)
        risk = D.score_risk(confidence=fc["confidence"], trend_pct=trend, dest_wait_level=top["wait"]["level"],
                            week_of_year=woy, bunker_ret4=fc["drivers"]["bunker_ret4"], band_ratio=band, dest=dest,
                            draft_margin_m=d_draft - loaded)
        now = datetime.now(timezone.utc).isoformat()
        route_txt = f"{origin} -> {dest}"
        alerts = [dict(id=f"risk-{i + 1:03d}", level=lvl, category=cat, title=txt.split(" - ")[0][:70], description=txt,
                       route=route_txt, detectedAt=now, acknowledged=False)
                  for i, (cat, lvl, txt) in enumerate(risk["alerts"])]

        # IDLE / REPOSITION (REQ-4.5)
        idle_days = top["idle_days"]
        sugg = None
        if idle_days > C.IDLE_REPOSITION_THRESHOLD_DAYS:
            bp, desc, ballast = min(C.BACKHAUL[cls_name], key=lambda b: b[2])
            sugg = f"Ballast {ballast:.0f} days to {bp}: {desc}"
        idle_entries = [dict(vesselId=f"vsl-{cls_name.lower()}-{i + 1}", vesselName=f"Recommended {cls_name} #{i + 1}",
                             expectedIdleDays=round(idle_days, 1), location=f"{dest}, India",
                             repositioningSuggestion=sugg) for i in range(min(n, 3))]

        # vessel options at the chosen port (REQ-4.2.1 / 4.2.3)
        at_port = [g for g in grid.values() if g["dest"] == dest]
        best_cost = min((g["cost_pm"] for g in at_port if g["feasible"]), default=1.0)
        options = []
        for g in sorted(at_port, key=lambda g: -g.get("fit", -1)):
            c_ = g["cls"]
            v = C.VESSELS[c_]
            if not g["feasible"]:
                options.append(dict(vesselClass=c_, capacityRange=TYPICAL[c_][0], dwtRange=TYPICAL[c_][0],
                                    draftRange=TYPICAL[c_][1], cargoFitPct=0, portCompatibility=False,
                                    estimatedFreightUsdPerMt=0, idleRisk="High", suitabilityStatus="Not Suitable",
                                    availability="Unavailable", reasoning=g["constraint"]["reason"],
                                    reasons=[g["constraint"]["reason"]]))
                continue
            status = ("Best Match" if g is top else "Good Fit" if g["fit"] >= 0.85 * top["fit"] else "Marginal")
            idle_r = "Low" if g["idle_days"] < 2 else "Medium" if g["idle_days"] < 4 else "High"
            reasons = [g["constraint"]["reason"], f"{g['n']} voyage(s) x {g['cargo_v']:,.0f} MT",
                       f"Expected landed cost ${g['cost_pm']:.2f}/MT ({(g['cost_pm'] / best_cost - 1) * 100:+.0f}% vs best)",
                       f"Expected idle {g['idle_days']:.1f} days"]
            options.append(dict(vesselClass=c_, capacityRange=TYPICAL[c_][0], dwtRange=TYPICAL[c_][0],
                                draftRange=TYPICAL[c_][1], cargoFitPct=round(min(100, g["util"] * 100)),
                                portCompatibility=True, estimatedFreightUsdPerMt=round(g["cost_pm"], 2),
                                idleRisk=idle_r, suitabilityStatus=status, availability="Available",
                                reasoning="; ".join(reasons[:2]), reasons=reasons))

        # forecast payload (FreightForecast)
        series = [dict(date=_iso(d), historicalUsdPerMt=round(r * adj, 2), forecastUsdPerMt=None) for d, r in fc["history"]]
        series[-1]["forecastUsdPerMt"] = series[-1]["historicalUsdPerMt"]
        series += [dict(date=_iso(d), historicalUsdPerMt=None, forecastUsdPerMt=round(float(p * adj), 2),
                        lowerUsdPerMt=round(float(lo * adj), 2), upperUsdPerMt=round(float(hi * adj), 2))
                   for d, p, lo, hi in zip(fc["dates"], fc["p50"], fc["p10"], fc["p90"])]
        forecast = dict(route=f"{origin} -> {dest}", vesselClass=cls_name, confidencePct=round(fc["confidence"]),
                        optimalEntryWindowStart=_iso(timing["start"]), optimalEntryWindowEnd=_iso(timing["end"]),
                        currentRateUsdPerMt=round(fc["current"] * adj, 2), series=series,
                        lowConfidence=bool(fc["low_confidence"]))
        drivers = []
        if fc["drivers"]["ret4"] > 0.03: drivers.append("rising 4-week freight momentum")
        if fc["drivers"]["ret4"] < -0.03: drivers.append("falling 4-week freight momentum")
        if fc["drivers"]["bunker_ret4"] > 0.04: drivers.append("firming bunker prices")
        if top["wait"]["level"] != "Low": drivers.append(f"{dest} congestion ({top['wait']['level'].lower()})")
        if not drivers: drivers.append("mean-reversion toward the seasonal level")
        timing_expl = (f"Fix in week {timing['best_week']} ({_iso(timing['start'])}): forecast "
                       f"{timing['expected_vs_now_pct']:+.1f}% vs week 1 on a risk-adjusted basis; drivers: " + ", ".join(drivers))

        rec = dict(
            id=f"rec-{abs(hash((origin, dest, cls_name, qty))) % 10 ** 8:08d}", requestId=req.get("requestId", "req-live"),
            recommendedVessel=dict(vesselClass=cls_name, dwt=C.VESSELS[cls_name]["cargo_dwt"],
                                   draft=C.VESSELS[cls_name]["design_draft"], fitScorePct=round(top["fit"] * 100),
                                   reasoning=f"{top['constraint']['reason']}; ${top['cost_pm']:.2f}/MT expected landed cost across {n} voyage(s).",
                                   portCompatible=True),
            recommendedContractType=rec_type, contractComparison=comp, forecast=forecast, riskLevel=risk["level"],
            riskFactors=risk["factors"] or ["No material risk signals detected"], expectedIdleDays=round(idle_days),
            estimatedSavingsUsd=round(sav_usd), estimatedSavingsPct=round(sav_pct, 1), generatedAt=now,
            modelVersion=C.MODEL_VERSION,
            primaryAction=(f"STAY SPOT, REVIEW WEEKLY" if rec_type == "Spot" else
                           f"LOCK {n}-VOYAGE {'CVC' if rec_type == 'CVC' else 'TIME-CHARTER'} PROGRAMME "
                           f"({port['period_voyages']} period + {port['spot_voyages']} spot)"),
            recommendedRouteText=f"{origin} -> {dest} ({'direct discharge' if top['constraint']['mode'] == 'direct' else 'lightering at Sagar'})",
            vesselStrategyText=f"{n} x {cls_name} ({cargo_v:,.0f} MT) - {top['constraint']['reason']}",
            portfolioSplitText=f"{port['period_voyages']} Period Voyages ({port['period_voyages'] / n:.0%}) + {port['spot_voyages']} Spot Voyages ({port['spot_voyages'] / n:.0%})",
            expectedLandedCostP50=round(p50_pm, 2), stressCeilingP90=round(p90_pm, 2), netSavingsPct=round(sav_pct, 1),
            netSavingsUsd=round(sav_usd),
            backhaulMonetizationText=sugg or f"Idle time within threshold ({idle_days:.1f} days); no repositioning required.",
            lighteringComparison=dict(haldiaLighteringCostPerMt=C.LIGHTERING_USD_PER_MT,
                                      dhamraDirectSavingsPerMt=C.LIGHTERING_USD_PER_MT,
                                      sagarFloatingCraneRate=round(C.LIGHTERING_USD_PER_MT * 0.62, 2)),
        )

        rejected = [f"{g['cls']} ({g['constraint']['reason']})" for g in at_port if not g["feasible"]]
        port_cmp = sorted(({"port": g["dest"], "cls": g["cls"], "landedCostUsdPerMt": round(g["cost_pm"], 2),
                            "waitDays": round(g["wait_days"], 1)} for g in feas
                           if g["cls"] == cls_name), key=lambda r: r["landedCostUsdPerMt"])
        pipeline = dict(
            predict=dict(modelName=f"Quantile-GBM + Ridge hybrid ({C.MODEL_VERSION})", forecastDays=C.HORIZON_WEEKS * 7,
                         trendPct=round(abs(trend), 1), trendDirection="up" if trend >= 0 else "down",
                         confidencePct=round(fc["confidence"]), lowConfidence=bool(fc["low_confidence"]),
                         summary=f"P50 freight {trend:+.1f}% over the sailing window; confidence {fc['confidence']:.0f}%. " + timing_expl),
            constrain=dict(feasibleVesselClasses=[f"{g['cls']} ({g['cargo_v']:,.0f} MT)" for g in at_port if g["feasible"]],
                           rejectedVesselClasses=rejected,
                           summary=f"{dest} selected on lowest risk-adjusted landed cost of {len(cands)} candidate port(s)."),
            optimize=dict(solver=port["solver"], status=port["status"], periodVoyages=port["period_voyages"],
                          spotVoyages=port["spot_voyages"], periodCoveragePct=round(port["period_voyages"] / n * 100, 1),
                          spotFlexibilityPct=round(port["spot_voyages"] / n * 100, 1),
                          summary=rec["portfolioSplitText"]),
            simulate=dict(pathsRun=mc["paths"], p50BaseCostPerMt=round(p50_pm, 2), p90CeilingCostPerMt=round(p90_pm, 2),
                          varHedgeUsd=round((p90_pm - p50_pm) * qty),
                          summary=f"{mc['paths']:,} paths: P50 ${p50_pm:.2f}/MT vs P90 ${p90_pm:.2f}/MT."),
        )
        return dict(recommendation=rec, pipeline=pipeline, vesselOptions=options, riskAlerts=alerts,
                    idleEntries=idle_entries, forecast=forecast, portComparison=port_cmp,
                    entryTiming=dict(bestWeek=timing["best_week"], start=_iso(timing["start"]), end=_iso(timing["end"]),
                                     explanation=timing_expl),
                    meta=dict(asOf=_iso(self.as_of), modelVersion=C.MODEL_VERSION, originPort=origin, dischargePort=dest,
                              vesselClass=cls_name))

    # ── lightweight endpoints ───────────────────────────────────────────────
    def port_congestion(self) -> list[dict]:
        out = []
        for p in C.DISCHARGE_PORTS:
            r = self.cong.predict(p)
            out.append(dict(name=p, level=r["level"], currentWaitDays=round(r["current_wait_days"], 1),
                            expectedWaitDays=[round(v, 1) for v in r["weekly_wait_days"]]))
        return out

    def market_insights(self) -> dict:
        f = self._series("Gladstone", "Paradip", "Panamax")
        trend = float((f["p50"][7] / f["current"] - 1) * 100)
        b = self.market["bunker"].values
        b4 = float((b[-1] / b[-5] - 1) * 100)
        dem = float(self.market["demand"].iloc[-1])
        wait = self.cong.predict("Paradip")["level"]
        return dict(freightTrendPct=round(abs(trend), 1), freightTrendDirection="up" if trend >= 0 else "down",
                    demandLevel="High" if dem > 1.1 else "Low" if dem < 0.9 else "Moderate", portCongestion=wait,
                    bunkerPriceUsdPerMt=round(float(b[-1]), 1), bunkerPriceChangePct=round(b4, 1),
                    marketSentiment="Bullish" if trend > 3 else "Bearish" if trend < -3 else "Neutral")
