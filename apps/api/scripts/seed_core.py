"""Seed core operational foundation without demo data."""
import sys
import os

# Run seed.py with --core-only flag
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.argv.append("--core-only")

from seed import seed_database

if __name__ == "__main__":
    seed_database()
