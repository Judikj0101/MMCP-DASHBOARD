"""Overview page — all regions at a glance."""

from flask import Blueprint, render_template
from ..api_client import get_snapshot, get_health, get_latest_run

overview_bp = Blueprint("overview", __name__)


@overview_bp.route("/")
def index():
    snapshot = get_snapshot(detail="full")
    health = get_health()
    latest_run = get_latest_run()
    return render_template(
        "overview.html",
        snapshot=snapshot,
        health=health,
        latest_run=latest_run,
    )
