#!/bin/bash

# =============================================================================
# User Management Service - Local Development Runner
# =============================================================================

# Set environment variables
export DATABASE_URL="postgresql://hospital_admin:secure_hospital_pass@localhost:5432/auth_db"

# Activate virtual env if exists
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Install deps if not present
python3 -m pip install -r requirements.txt -q

# Run
python3 -m uvicorn main:app --host 0.0.0.0 --port 8006 --reload
