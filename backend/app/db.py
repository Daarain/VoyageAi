# backend/app/db.py
# Supabase client for the FastAPI backend (service role — bypasses RLS)
# pip install supabase

from __future__ import annotations
import os
from functools import lru_cache
from typing import Any

try:
    from supabase import create_client, Client
    _SUPABASE_AVAILABLE = True
except ImportError:
    _SUPABASE_AVAILABLE = False

SUPABASE_URL     = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")  # NOT the anon key


@lru_cache(maxsize=1)
def get_client() -> "Client | None":
    """Returns the Supabase admin client, or None if not configured."""
    if not _SUPABASE_AVAILABLE:
        return None
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return None
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def save_recommendation(
    *,
    user_id: str | None,
    request_id: str | None,
    model_version: str,
    engine_output: dict[str, Any],
    input_snapshot: dict[str, Any],
) -> None:
    """
    Persist one AI recommendation + audit entry to Supabase.
    Silently no-ops if Supabase is not configured (local dev without DB).
    """
    db = get_client()
    if db is None:
        return

    try:
        # ── 1. Upsert chartering_request row if request_id provided ──────
        if request_id and user_id:
            db.table("chartering_requests").upsert({
                "id":               request_id,
                "user_id":          user_id,
                "cargo_type":       input_snapshot.get("commodity", "Coal"),
                "cargo_quantity_mt": input_snapshot.get("quantityMt", 0),
                "origin_port":      input_snapshot.get("originPortName", ""),
                "destination_ports": input_snapshot.get("candidateDischargePorts", []),
                "selected_port":    input_snapshot.get("selectedDischargePortName"),
                "number_of_voyages": input_snapshot.get("numberOfVoyages", 1),
                "laycan_start":     input_snapshot.get("laycanStart", ""),
                "laycan_end":       input_snapshot.get("laycanEnd"),
                "status":           "Recommended",
            }).execute()

        # ── 2. Insert recommendation row ─────────────────────────────────
        forecast   = engine_output.get("forecast", {})
        simulation = engine_output.get("simulation", {})
        rec_row: dict[str, Any] = {
            "model_version":         model_version,
            "vessel_class":          engine_output.get("vesselClass"),
            "recommended_contract":  engine_output.get("recommendedContract"),
            "expected_cost_p50":     simulation.get("totalCostP50"),
            "stress_cost_p90":       simulation.get("totalCostP90"),
            "estimated_savings_usd": simulation.get("estimatedSavings"),
            "risk_level":            engine_output.get("riskLevel"),
            "confidence_pct":        forecast.get("confidence"),
            "raw_output":            engine_output,
        }
        if user_id:    rec_row["user_id"]    = user_id
        if request_id: rec_row["request_id"] = request_id

        db.table("recommendations").insert(rec_row).execute()

        # ── 3. Audit log entry ───────────────────────────────────────────
        audit_row: dict[str, Any] = {
            "action":         "AI_RECOMMENDATION",
            "model_version":  model_version,
            "confidence_pct": forecast.get("confidence"),
            "input_snapshot": input_snapshot,
            "output_summary": (
                f"Vessel: {engine_output.get('vesselClass')} | "
                f"Contract: {engine_output.get('recommendedContract')} | "
                f"Risk: {engine_output.get('riskLevel')}"
            ),
        }
        if user_id:    audit_row["user_id"]    = user_id
        if request_id: audit_row["request_id"] = request_id

        db.table("audit_log").insert(audit_row).execute()

    except Exception as exc:  # never crash the API response
        import logging
        logging.getLogger(__name__).warning("Supabase write failed: %s", exc)
