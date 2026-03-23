"""System health page — source status, run history, diagnostics."""

from flask import Blueprint, render_template
from ..api_client import get_health, get_health_sources, get_latest_run, get_meta_version

system_bp = Blueprint("system", __name__)


@system_bp.route("/")
def index():
    health = get_health()
    sources = get_health_sources()
    latest_run = get_latest_run()
    version = get_meta_version()
    return render_template(
        "system.html",
        health=health,
        sources=sources,
        latest_run=latest_run,
        version=version,
    )
