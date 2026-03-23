"""Region detail page — deep dive into a single region."""

from flask import Blueprint, render_template, request
from ..api_client import (
    get_region,
    get_region_history,
    get_region_signals,
    get_region_ml,
    get_region_price_forecast,
    get_region_commodity,
    get_region_regime_analysis,
    get_region_vdem,
    get_region_political_signal,
)

region_bp = Blueprint("region", __name__)


@region_bp.route("/<region_id>")
def detail(region_id):
    region = get_region(region_id)
    signals = get_region_signals(region_id)
    ml = get_region_ml(region_id)
    forecast = get_region_price_forecast(region_id)
    commodity = get_region_commodity(region_id)
    regime = get_region_regime_analysis(region_id)
    vdem = get_region_vdem(region_id)
    political = get_region_political_signal(region_id)

    from_date = request.args.get("from", "2026-01-01")
    to_date = request.args.get("to", "2026-03-23")
    history = get_region_history(region_id, from_date, to_date)

    return render_template(
        "region.html",
        region=region,
        region_id=region_id,
        signals=signals,
        ml=ml,
        forecast=forecast,
        commodity=commodity,
        regime=regime,
        vdem=vdem,
        political=political,
        history=history,
    )
