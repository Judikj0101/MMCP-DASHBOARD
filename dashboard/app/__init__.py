"""MMCP Dashboard — Flask application factory."""

from flask import Flask
from .config import Config


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    from .routes.overview import overview_bp
    from .routes.markets import markets_bp
    from .routes.region import region_bp
    from .routes.alerts import alerts_bp
    from .routes.system import system_bp
    from .routes.api_proxy import api_proxy_bp

    app.register_blueprint(overview_bp)
    app.register_blueprint(markets_bp, url_prefix="/markets")
    app.register_blueprint(region_bp, url_prefix="/region")
    app.register_blueprint(alerts_bp, url_prefix="/alerts")
    app.register_blueprint(system_bp, url_prefix="/system")
    app.register_blueprint(api_proxy_bp, url_prefix="/api")

    return app
