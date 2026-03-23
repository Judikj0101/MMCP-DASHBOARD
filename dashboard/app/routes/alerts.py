"""Alerts page — active alerts and history."""

from flask import Blueprint, render_template
from ..api_client import get_snapshot, get_health

alerts_bp = Blueprint("alerts", __name__)


@alerts_bp.route("/")
def index():
    snapshot = get_snapshot(detail="full")
    health = get_health()
    return render_template("alerts.html", snapshot=snapshot, health=health)
