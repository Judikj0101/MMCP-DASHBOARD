"""Client for MMCP-LIVE API with simple TTL caching."""

import time
import logging
import requests
from flask import current_app

logger = logging.getLogger(__name__)

_cache = {}
DEFAULT_TTL = 120  # seconds


def _headers():
    return {
        "X-MMCP-API-Key": current_app.config["MMCP_API_KEY"],
        "Accept": "application/json",
    }


def _base():
    return current_app.config["MMCP_API_URL"].rstrip("/")


def _get(path, params=None, ttl=DEFAULT_TTL):
    """GET request with TTL cache. Returns dict or None on error."""
    cache_key = f"{path}|{params}"
    now = time.time()

    if cache_key in _cache:
        data, ts = _cache[cache_key]
        if now - ts < ttl:
            return data

    url = f"{_base()}/api/v1{path}"
    try:
        r = requests.get(url, headers=_headers(), params=params, timeout=10)
        r.raise_for_status()
        data = r.json()
        _cache[cache_key] = (data, now)
        return data
    except Exception as e:
        logger.warning("API call failed: %s %s — %s", url, params, e)
        # Return stale cache if available
        if cache_key in _cache:
            return _cache[cache_key][0]
        return None


def clear_cache():
    _cache.clear()


# ── Public API methods ───────────────────────────────────────────────

def get_snapshot(detail="full"):
    return _get("/snapshot", {"detail": detail}, ttl=60)


def get_region(region_id):
    return _get(f"/regions/{region_id}", ttl=60)


def get_region_history(region_id, from_date=None, to_date=None, granularity="daily"):
    params = {"granularity": granularity}
    if from_date:
        params["from"] = from_date
    if to_date:
        params["to"] = to_date
    return _get(f"/regions/{region_id}/history", params, ttl=300)


def get_region_signals(region_id):
    return _get(f"/regions/{region_id}/signals", ttl=60)


def get_region_commodity(region_id):
    return _get(f"/regions/{region_id}/commodity", ttl=120)


def get_region_ml(region_id):
    return _get(f"/regions/{region_id}/ml", ttl=120)


def get_region_price_forecast(region_id):
    return _get(f"/regions/{region_id}/price-forecast", ttl=120)


def get_region_regime_analysis(region_id):
    return _get(f"/regions/{region_id}/regime-analysis", ttl=300)


def get_region_political_signal(region_id):
    return _get(f"/regions/{region_id}/political-signal", ttl=120)


def get_region_vdem(region_id):
    return _get(f"/regions/{region_id}/vdem-context", ttl=300)


def get_health():
    return _get("/health", ttl=30)


def get_health_sources():
    return _get("/health/sources", ttl=60)


def get_latest_run():
    return _get("/runs/latest", ttl=60)


def get_meta_regions():
    return _get("/meta/regions", ttl=600)


def get_meta_version():
    return _get("/meta/version", ttl=600)
