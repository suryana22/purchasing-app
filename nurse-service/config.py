# Database Configuration
import os
from urllib.parse import quote_plus

# PostgreSQL Connection
DB_USER = os.getenv("DB_USER", "sysadmin_smartcall")
DB_PASSWORD = os.getenv("DB_PASSWORD", "sys4dm1n_Sm4rTtCaLL@26")
DB_HOST = os.getenv("DB_HOST", "localhost")  # Use 'db' for Docker network, 'localhost' for local
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "nurse_db")

# URL encode password to handle special characters like @
DB_PASSWORD_ENCODED = quote_plus(DB_PASSWORD)

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    f"postgresql://{DB_USER}:{DB_PASSWORD_ENCODED}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# Application Settings
APP_NAME = "Nurse Call Service"
APP_VERSION = "2.0.0"
DEBUG = os.getenv("DEBUG", "true").lower() == "true"

# Auth Service URL (untuk autentikasi via browser)
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:8000")
