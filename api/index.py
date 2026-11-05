"""Vercel Serverless Function entrypoint."""
import sys
from pathlib import Path

# Add apps/api to python path so app.* modules resolve cleanly on Vercel
api_dir = Path(__file__).resolve().parent.parent / "apps" / "api"
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))

from app.main import app

