"""FastAPI service — with Supabase persistence on every /v1/recommend call."""
from __future__ import annotations

import json
import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Header
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

from . import config as C
from .engine import Engine
from .db import save_recommendation          # ← new

STATE: dict = {}

_ORIGINS = [o.strip() for o in os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",") if o.strip()]


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        STATE["engine"] = await run_in_threadpool(Engine.load)
    except FileNotFoundError:
        raise RuntimeError(
            "Artifacts not found. Run  python train.py  from the backend/ directory first."
        )
    yield


app = FastAPI(title="VoyageAI Pro", version=C.MODEL_VERSION, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-User-Id", "X-Request-Id"],
)


class ProcurementRequest(BaseModel):
    model_config = ConfigDict(extra="allow")
    commodity: str = "Coal"
    quantityMt: float = Field(gt=0)
    originPortName: str
    candidateDischargePorts: list[str] = []
    selectedDischargePortName: str = ""
    laycanStart: str
    laycanEnd: Optional[str] = None
    numberOfVoyages: int = Field(default=1, ge=1, le=24)
    contractDurationMonths: Optional[int] = None
    requestId: Optional[str] = None


async def _run(
    req: ProcurementRequest,
    user_id: str | None = None,
) -> dict:
    try:
        result = await run_in_threadpool(STATE["engine"].recommend, req.model_dump())
    except (KeyError, ValueError) as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Persist asynchronously — never block the response
    await run_in_threadpool(
        save_recommendation,
        user_id=user_id,
        request_id=req.requestId,
        model_version=C.MODEL_VERSION,
        engine_output=result,
        input_snapshot=req.model_dump(),
    )
    return result


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "modelVersion": C.MODEL_VERSION,
        "asOf": str(STATE["engine"].as_of.date()),
    }


@app.get("/v1/metrics")
def metrics():
    f = C.ARTIFACTS / "metrics.json"
    return json.loads(f.read_text()) if f.exists() else {}


@app.post("/v1/recommend")
async def recommend(
    req: ProcurementRequest,
    x_user_id: Optional[str] = Header(default=None),
):
    """Main endpoint — runs the full AI pipeline and persists to Supabase."""
    return await _run(req, user_id=x_user_id)


@app.post("/v1/forecast")
async def forecast(req: ProcurementRequest, x_user_id: Optional[str] = Header(default=None)):
    out = await _run(req, user_id=x_user_id)
    return {**out["forecast"], "entryTiming": out["entryTiming"]}


@app.post("/v1/risk")
async def risk(req: ProcurementRequest, x_user_id: Optional[str] = Header(default=None)):
    return (await _run(req, user_id=x_user_id))["riskAlerts"]


@app.post("/v1/idle-time")
async def idle(req: ProcurementRequest, x_user_id: Optional[str] = Header(default=None)):
    return (await _run(req, user_id=x_user_id))["idleEntries"]


@app.post("/v1/vessel-options")
async def vessel_options(req: ProcurementRequest, x_user_id: Optional[str] = Header(default=None)):
    return (await _run(req, user_id=x_user_id))["vesselOptions"]


@app.get("/v1/ports/congestion")
async def ports_congestion():
    return await run_in_threadpool(STATE["engine"].port_congestion)


@app.get("/v1/market-insights")
async def market_insights():
    return await run_in_threadpool(STATE["engine"].market_insights)


# ── User history routes (reads from Supabase) ────────────────────────────────

@app.get("/v1/user/requests")
async def user_requests(x_user_id: Optional[str] = Header(default=None)):
    """Return the logged-in user's past chartering requests."""
    from .db import get_client
    db = get_client()
    if db is None or not x_user_id:
        return []
    result = (db.table("chartering_requests")
                .select("*, recommendations(vessel_class,recommended_contract,confidence_pct,created_at)")
                .eq("user_id", x_user_id)
                .order("created_at", desc=True)
                .limit(50)
                .execute())
    return result.data or []


@app.get("/v1/user/audit")
async def user_audit(x_user_id: Optional[str] = Header(default=None)):
    """Return audit log entries for the logged-in user."""
    from .db import get_client
    db = get_client()
    if db is None or not x_user_id:
        return []
    result = (db.table("audit_log")
                .select("*")
                .eq("user_id", x_user_id)
                .order("created_at", desc=True)
                .limit(100)
                .execute())
    return result.data or []
