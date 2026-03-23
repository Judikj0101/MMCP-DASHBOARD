"""API proxy — forwards requests to MMCP-LIVE for frontend JS auto-refresh."""

import requests as req
from flask import Blueprint, request, jsonify, current_app

api_proxy_bp = Blueprint("api_proxy", __name__)


@api_proxy_bp.route("/v1/<path:path>")
def proxy(path):
    base = current_app.config["MMCP_API_URL"].rstrip("/")
    url = f"{base}/api/v1/{path}"
    headers = {
        "X-MMCP-API-Key": current_app.config["MMCP_API_KEY"],
        "Accept": "application/json",
    }
    try:
        r = req.get(url, headers=headers, params=request.args, timeout=10)
        return jsonify(r.json()), r.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 502
