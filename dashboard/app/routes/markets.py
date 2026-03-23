"""Markets page — price forecasts, commodity risk, buy/sell signals."""

from flask import Blueprint, render_template
from ..api_client import get_snapshot, get_region_price_forecast, get_region_commodity

markets_bp = Blueprint("markets", __name__)

REGION_IDS = [
    "eastern_europe_ua_ru",
    "israel_lebanon_gaza",
    "yemen",
    "iran_proxy_axis",
    "kashmir_in_pk",
    "korean_peninsula",
    "south_china_sea_ph",
    "south_china_sea_vn",
    "taiwan_strait",
    "north_syria_turkey",
]


@markets_bp.route("/")
def index():
    snapshot = get_snapshot(detail="full")

    market_data = []
    for rid in REGION_IDS:
        forecast = get_region_price_forecast(rid)
        commodity = get_region_commodity(rid)
        market_data.append({
            "region_id": rid,
            "forecast": forecast,
            "commodity": commodity,
        })

    return render_template(
        "markets.html",
        snapshot=snapshot,
        market_data=market_data,
    )
