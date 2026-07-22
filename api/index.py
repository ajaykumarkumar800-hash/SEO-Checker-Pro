"""
SEO Checker Pro — Vercel Serverless Entrypoint
Imports the main Flask application instance from app.py to prevent code duplication.
"""

import sys
import os

# Ensure root directory is in sys.path for local imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
