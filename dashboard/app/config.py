"""Dashboard configuration from environment variables."""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-secret-change-me")
    MMCP_API_URL = os.getenv("MMCP_API_URL", "http://46.225.129.246:8000")
    MMCP_API_KEY = os.getenv("MMCP_API_KEY", "")
    DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"
